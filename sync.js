/* ============================================================
   APEX SYNC — Cloudflare D1 backend (v2)
   - 500ms debounce (was 2.5s)
   - visibilitychange flushes pending sync
   - Honest sync pill: tracks last successful sync time
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSyncD1v2) return;
  window._apexSyncD1v2 = true;

  // ---- API helpers ----
  async function apiGet(roomId) {
    const base = location.protocol === "file:" ? "https://exam-os.pages.dev" : "";
    const r = await fetch(base + "/api/sync/" + encodeURIComponent(roomId), { cache: "no-store" });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }
  async function apiPut(roomId, salt, blob) {
    const base = location.protocol === "file:" ? "https://exam-os.pages.dev" : "";
    const r = await fetch(base + "/api/sync/" + encodeURIComponent(roomId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salt: salt, blob: blob })
    });
    if (!r.ok) {
      let m = "HTTP " + r.status;
      try { const j = await r.json(); if (j.error) m = j.error; } catch(e) {}
      throw new Error(m);
    }
    return await r.json();
  }
  async function apiDelete(roomId) {
    const base = location.protocol === "file:" ? "https://exam-os.pages.dev" : "";
    try {
      const r = await fetch(base + "/api/sync/" + encodeURIComponent(roomId), { method: "DELETE" });
      return r.ok;
    } catch(e) { return false; }
  }

  window.apiGet = apiGet;
  window.apiPut = apiPut;
  window.apiDelete = apiDelete;
  window.initFirebase = async function() { return true; };

  // ---- Sync status tracking ----
  function recordSyncSuccess() {
    S._lastSyncAt = Date.now();
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
    setSyncStatus("synced");
  }
  function recordSyncError() {
    S._lastSyncError = Date.now();
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
    setSyncStatus("error");
  }

  // ---- Honest sync pill ----
  function humanAgo(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24);
    return d + "d ago";
  }
  window.updateSyncPill = function() {
    const el = document.getElementById("sync-pill");
    if (!el) return;
    const hasRoom = !!S.sync.room;
    const enabled = S.sync.enabled && hasRoom;
    const locked = enabled && !syncKey;

    if (!enabled) {
      el.className = "sync-pill off";
      el.innerHTML = '<span class="dot"></span><span>Local</span>';
      el.title = "Sync disabled";
      return;
    }
    if (locked) {
      el.className = "sync-pill locked";
      el.innerHTML = '<span class="dot"></span><span>Locked</span>';
      el.title = "Click to enter your passphrase";
      return;
    }
    if (syncStatus === "connecting" || syncStatus === "syncing") {
      el.className = "sync-pill syncing";
      el.innerHTML = '<span class="dot"></span><span>Syncing…</span>';
      el.title = "Sync in progress";
      return;
    }
    if (syncStatus === "error") {
      el.className = "sync-pill error";
      el.innerHTML = '<span class="dot"></span><span>Error</span>';
      el.title = "Last sync failed";
      return;
    }
    const last = S._lastSyncAt || 0;
    const elapsed = last ? Date.now() - last : Infinity;
    if (!last) {
      el.className = "sync-pill connecting";
      el.innerHTML = '<span class="dot"></span><span>Not synced</span>';
      el.title = "Waiting for first sync";
      return;
    }
    if (elapsed < 5 * 60 * 1000) {
      el.className = "sync-pill synced";
      el.innerHTML = '<span class="dot"></span><span>Synced</span>';
      el.title = "Last sync: " + humanAgo(elapsed);
    } else if (elapsed < 24 * 60 * 60 * 1000) {
      el.className = "sync-pill synced";
      el.innerHTML = '<span class="dot"></span><span>Synced · ' + humanAgo(elapsed) + '</span>';
      el.title = "Last sync: " + humanAgo(elapsed);
    } else {
      el.className = "sync-pill error";
      el.innerHTML = '<span class="dot"></span><span>Stale</span>';
      el.title = "Last sync was " + humanAgo(elapsed) + " — check connection";
    }
  };

  // ---- Push / Pull ----
  window.pushNow = async function(silent) {
    if (!S.sync.enabled || !S.sync.room || !syncKey) return;
    try {
      setSyncStatus("syncing");
      let needMerge = false;
      try {
        const remote = await apiGet(S.sync.room);
        if (remote && remote.updatedAt && S._lastSync && remote.updatedAt > S._lastSync
            && S._lastLocalEdit && S._lastLocalEdit > S._lastSync) {
          needMerge = true;
          try {
            const parsed = JSON.parse(remote.blob);
            const remoteState = await decryptState(parsed);
            S = mergeForSync(S, remoteState);
            if (!silent) toast("Merged with cloud", "Local + cloud preserved");
          } catch(e) {}
        }
      } catch(e) {}
      const payload = JSON.parse(JSON.stringify(S));
      delete payload.sync;
      delete payload._lastSync;
      delete payload._lastSyncAt;
      delete payload._lastSyncError;
      delete payload._lastLocalEdit;
      delete payload._deviceId;
      const encrypted = await encryptState(payload);
      const blob = JSON.stringify(encrypted);
      const saltB64 = bufToB64(syncSalt);
      const resp = await apiPut(S.sync.room, saltB64, blob);
      S._lastSync = new Date(resp.updatedAt * 1000).toISOString();
      recordSyncSuccess();
      if (!silent && !needMerge) toast("Pushed (encrypted)");
      if (!silent && needMerge) rerender();
    } catch(e) {
      recordSyncError();
      if (!silent) toast("Push failed", e.message);
    }
  };

  window.pullNow = async function(silent) {
    if (!S.sync.enabled || !S.sync.room || !syncKey) return;
    try {
      setSyncStatus("connecting");
      const row = await apiGet(S.sync.room);
      if (!row) { if (!silent) toast("No cloud copy yet"); recordSyncSuccess(); return; }
      let remote;
      try {
        const parsed = JSON.parse(row.blob);
        remote = await decryptState(parsed);
      } catch(e) {
        if (!silent) toast("Wrong passphrase", "Could not decrypt cloud copy");
        recordSyncError(); return;
      }
      if (!silent && !confirm("Replace this device's data with the cloud copy?")) {
        setSyncStatus("synced"); return;
      }
      _applyingRemote = true;
      Object.keys(remote).forEach(k => { S[k] = remote[k]; });
      S.schemaVersion = SCHEMA_VERSION;
      S.sync = { enabled: true, room: S.sync.room };
      S._lastSync = new Date(row.updatedAt * 1000).toISOString();
      _applyingRemote = false;
      applyTheme(S.settings.theme || "apex");
      try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
      rerender();
      recordSyncSuccess();
      if (!silent) toast("Pulled (decrypted)");
    } catch(e) {
      recordSyncError();
      if (!silent) toast("Pull failed", e.message);
    }
  };

  // ---- Polling ----
  var _pollTimer = null;
  window.startSync = async function() {
    if (!S.sync.enabled || !S.sync.room) { setSyncStatus("off"); return; }
    if (!syncKey) { setSyncStatus("locked"); return; }
    // Do an immediate pull so we get accurate state on load
    try { await pullNow(true); } catch(e) {}
    if (_pollTimer) clearInterval(_pollTimer);
    _pollTimer = setInterval(async function() {
      if (document.hidden) return;
      if (!S.sync.enabled || !syncKey || _applyingRemote) return;
      try {
        const row = await apiGet(S.sync.room);
        if (!row) return;
        const remoteUpdated = row.updatedAt;
        const localUpdated = S._lastSync ? Math.floor(new Date(S._lastSync).getTime() / 1000) : 0;
        if (remoteUpdated <= localUpdated) return;
        const parsed = JSON.parse(row.blob);
        const remote = await decryptState(parsed);
        const localDirty = S._lastLocalEdit && S._lastSync && S._lastLocalEdit > S._lastSync;
        _applyingRemote = true;
        if (localDirty) { S = mergeForSync(S, remote); }
        else {
          Object.keys(remote).forEach(k => { S[k] = remote[k]; });
          S.schemaVersion = SCHEMA_VERSION;
          S.sync = { enabled: true, room: S.sync.room };
        }
        S._lastSync = new Date(remoteUpdated * 1000).toISOString();
        _applyingRemote = false;
        applyTheme(S.settings.theme || "apex");
        try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
        rerender();
        recordSyncSuccess();
      } catch(e) {
        // Silent poll failure — don't flip to error state on transient
      }
    }, 20000);
  };

  window.stopSync = function() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    clearSyncKey();
    setSyncStatus("off");
  };

  window.lockSync = function() {
    clearSyncKey();
    sessionStorage.removeItem("apex-sync-pass");
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    setSyncStatus("locked");
    toast("Sync locked");
  };

  window.firstSyncCheck = async function() {
    try {
      if (!S.sync.enabled || !S.sync.room || !syncKey) return false;
      if (S._lastSync) return false;
      const row = await apiGet(S.sync.room);
      if (!row) return false;
      const total = (S.syllabus||[]).length + (S.sessions||[]).length
                  + (S.errors||[]).length + (S.mocks||[]).length
                  + (S.tasks||[]).length;
      return total > 0;
    } catch(e) { return false; }
  };

  // ---- Faster debounce + flush on hide ----
  var _debounceTimer = null;
  window.queueSync = function() {
    if (!S.sync.enabled || !syncKey || _applyingRemote) return;
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function() {
      _debounceTimer = null;
      pushNow(true);
    }, 500);
  };
  document.addEventListener("visibilitychange", function() {
    if (document.hidden && _debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
      pushNow(true);
    }
  });

  // ---- ACTIONS overrides ----
  try {
    if (typeof ACTIONS === "object" && ACTIONS) {
      ACTIONS["fs-merge"] = async function() {
        try {
          const row = await apiGet(S.sync.room);
          if (row && row.blob) {
            const parsed = JSON.parse(row.blob);
            const remote = await decryptState(parsed);
            _applyingRemote = true;
            S = mergeForSync(S, remote);
            S.schemaVersion = SCHEMA_VERSION;
            S.sync = { enabled: true, room: S.sync.room };
            _applyingRemote = false;
            try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
            applyTheme(S.settings.theme || "apex");
            rerender();
          }
          closeModal();
          await pushNow(true);
          startSync();
          toast("Merged", "Both sides combined");
        } catch(e) { toast("Merge failed", e.message); }
      };
      ACTIONS["fs-local"] = async function() {
        closeModal();
        try { await pushNow(false); startSync(); toast("Pushed", "Cloud now matches device"); }
        catch(e) { toast("Push failed", e.message); }
      };
      ACTIONS["fs-cloud"] = async function() {
        closeModal();
        try { await pullNow(true); startSync(); toast("Pulled", "Device now matches cloud"); }
        catch(e) { toast("Pull failed", e.message); }
      };
      ACTIONS["gen-room"] = function() {
        const b = new Uint8Array(22);
        crypto.getRandomValues(b);
        const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let s = "";
        for (let i = 0; i < 22; i++) s += alpha[b[i] % alpha.length];
        const inp = document.querySelector('.modal [name="roomCode"]');
        if (inp) { inp.value = s; toast("New room code"); }
      };
    }
  } catch(e) { console.log("[apex-sync-d1] ACTIONS override skipped:", e.message); }

  // ---- Hide firebase field if it ever shows ----
  const obs = new MutationObserver(function() {
    const modal = document.querySelector(".modal");
    if (!modal) return;
    modal.querySelectorAll(".frow").forEach(function(frow) {
      const label = frow.querySelector("label");
      if (label && /firebase/i.test(label.textContent)) frow.style.display = "none";
    });
  });
  obs.observe(document.body, { childList: true, subtree: false });

  console.log("[apex-sync-d1] v2 installed — 500ms debounce, honest pill");
})();
