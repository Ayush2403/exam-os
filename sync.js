/* ============================================================
   APEX SYNC — Cloudflare D1 backend
   Loaded AFTER the main script. Overrides the Firebase-based
   sync functions with fetch versions. No Firebase needed.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSyncD1) return;
  window._apexSyncD1 = true;

  // ---- API helpers ----
  async function apiGet(roomId) {
    const r = await fetch("/api/sync/" + encodeURIComponent(roomId), { cache: "no-store" });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }
  async function apiPut(roomId, salt, blob) {
    const r = await fetch("/api/sync/" + encodeURIComponent(roomId), {
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
    try {
      const r = await fetch("/api/sync/" + encodeURIComponent(roomId), { method: "DELETE" });
      return r.ok;
    } catch(e) { return false; }
  }

  // ---- Override globals ----
  window.apiGet = apiGet;
  window.apiPut = apiPut;
  window.apiDelete = apiDelete;
  window.initFirebase = async function() { return true; };

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
      delete payload._lastLocalEdit;
      delete payload._deviceId;
      const encrypted = await encryptState(payload);
      const blob = JSON.stringify(encrypted);
      const saltB64 = bufToB64(syncSalt);
      const resp = await apiPut(S.sync.room, saltB64, blob);
      S._lastSync = new Date(resp.updatedAt * 1000).toISOString();
      store.set(KEY, JSON.stringify(S));
      setSyncStatus("synced");
      if (!silent && !needMerge) toast("Pushed (encrypted)");
      if (!silent && needMerge) rerender();
    } catch(e) {
      setSyncStatus("error");
      if (!silent) toast("Push failed", e.message);
    }
  };

  window.pullNow = async function(silent) {
    if (!S.sync.enabled || !S.sync.room || !syncKey) return;
    try {
      setSyncStatus("connecting");
      const row = await apiGet(S.sync.room);
      if (!row) { if (!silent) toast("No cloud copy yet"); setSyncStatus("synced"); return; }
      let remote;
      try {
        const parsed = JSON.parse(row.blob);
        remote = await decryptState(parsed);
      } catch(e) {
        if (!silent) toast("Wrong passphrase", "Could not decrypt cloud copy");
        setSyncStatus("error"); return;
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
      store.set(KEY, JSON.stringify(S));
      rerender();
      setSyncStatus("synced");
      if (!silent) toast("Pulled (decrypted)");
    } catch(e) {
      setSyncStatus("error");
      if (!silent) toast("Pull failed", e.message);
    }
  };

  var _pollTimer = null;
  window.startSync = async function() {
    if (!S.sync.enabled || !S.sync.room) { setSyncStatus("off"); return; }
    if (!syncKey) { setSyncStatus("locked"); return; }
    setSyncStatus("synced");
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
        store.set(KEY, JSON.stringify(S));
        rerender();
        setSyncStatus("synced");
      } catch(e) {}
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

  // Override fs-* and gen-room actions on the ACTIONS object
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
            store.set(KEY, JSON.stringify(S));
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

  // Hide the Firebase config field whenever the Settings modal is open
  const obs = new MutationObserver(function() {
    const modal = document.querySelector(".modal");
    if (!modal) return;
    modal.querySelectorAll(".frow").forEach(function(frow) {
      const label = frow.querySelector("label");
      if (label && /firebase/i.test(label.textContent)) frow.style.display = "none";
    });
    modal.querySelectorAll("h4").forEach(function(h) {
      if (/cloud sync/i.test(h.textContent)) h.textContent = "Cloud Sync";
    });
  });
  obs.observe(document.body, { childList: true, subtree: false });

  console.log("[apex-sync-d1] installed — D1 backend replaces Firebase");
})();
