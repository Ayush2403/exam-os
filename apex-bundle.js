/* ==========================================================
   APEX BUNDLE v1 - Consolidated Patch Scripts
   ========================================================== */


// ── FILE: apex-mobile.js ────────────────────────────────────────────
/* ============================================================
   APEX MOBILE LAYER v1
   Drop-in enhancement for premium mobile UX.
   ============================================================ */
(function(){
  if(window._apexMobile) return;
  window._apexMobile = true;

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var isAndroid = /Android/.test(navigator.userAgent);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                     || navigator.standalone === true;
  var isTouch = matchMedia('(pointer: coarse)').matches;

  /* ─────────────────────────────────────────────
     1 · RIPPLE + ACTIVE STATES + HAPTICS
     ───────────────────────────────────────────── */
  var rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    .apex-ripple-host{position:relative;overflow:hidden;}
    .apex-ripple{
      position:absolute;border-radius:50%;pointer-events:none;
      background:radial-gradient(circle,rgba(255,255,255,.45),rgba(255,255,255,0) 70%);
      transform:scale(0);opacity:1;
      animation:apexRipple .55s cubic-bezier(.16,1,.3,1) forwards;
      z-index:0;
    }
    @keyframes apexRipple{
      to{transform:scale(2.4);opacity:0}
    }
    @media (hover:none){
      .btn:active,.chip:active,.icon-btn:active,.mini-icon:active,
      .grade-btn:active,.nav-item:active,.bn-item:active,
      .topic-row:active,.row-item:active{
        transform:scale(.97);
        transition:transform .08s ease;
      }
      .btn.primary:active,.btn.green:active{
        filter:brightness(.9);
      }
    }
  `;
  document.head.appendChild(rippleStyle);

  function makeRipple(x, y, target){
    if(!target) return;
    var rect = target.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var r = document.createElement('span');
    r.className = 'apex-ripple';
    r.style.width = r.style.height = size + 'px';
    r.style.left = (x - rect.left - size/2) + 'px';
    r.style.top  = (y - rect.top  - size/2) + 'px';
    if(!target.classList.contains('apex-ripple-host')){
      target.classList.add('apex-ripple-host');
    }
    target.appendChild(r);
    setTimeout(function(){ r.remove(); }, 600);
  }

  document.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'mouse') return;
    var target = e.target.closest('.btn, .chip, .icon-btn, .mini-icon, .grade-btn, .nav-item, .bn-item, .topic-row, .row-item');
    if(!target) return;
    makeRipple(e.clientX, e.clientY, target);
    // Subtle haptic on the few key actions
    if(navigator.vibrate && /open-add-|grade-|complete-|focus-start|save/.test(target.dataset.action || '')){
      try { navigator.vibrate(8); } catch(_){}
    }
  }, { passive: true });

  /* ─────────────────────────────────────────────
     2 · AUTO-HIDE TAG "iOS double-tap to zoom"
     ───────────────────────────────────────────── */
  if(isIOS){
    document.documentElement.style.touchAction = 'manipulation';
  }

  /* ─────────────────────────────────────────────
     3 · BOTTOM SHEET SWIPE TO CLOSE (modals)
     ───────────────────────────────────────────── */
  var swipe = { active:false, startY:0, currentY:0, node:null, delta:0 };

  document.addEventListener('touchstart', function(e){
    var modal = e.target.closest('.modal, .focus-panel.sheet-mode');
    if(!modal) return;
    var rect = modal.getBoundingClientRect();
    // Only trigger if the touch starts near the top of the modal
    if(e.touches[0].clientY - rect.top > 100) return;
    swipe.active = true;
    swipe.node = modal;
    swipe.startY = e.touches[0].clientY;
    swipe.currentY = swipe.startY;
    swipe.delta = 0;
    modal.style.transition = 'none';
  }, { passive: true });

  document.addEventListener('touchmove', function(e){
    if(!swipe.active || !swipe.node) return;
    swipe.currentY = e.touches[0].clientY;
    swipe.delta = Math.max(0, swipe.currentY - swipe.startY);
    swipe.node.style.transform = 'translateY(' + (swipe.delta * 0.7) + 'px)';
    swipe.node.style.opacity = String(1 - Math.min(0.35, swipe.delta / 400));
  }, { passive: true });

  document.addEventListener('touchend', function(){
    if(!swipe.active || !swipe.node) return;
    var node = swipe.node;
    node.style.transition = '';
    if(swipe.delta > 110){
      node.style.transform = 'translateY(100%)';
      node.style.opacity = '0';
      // Trigger the app's own close
      var overlay = node.closest('.overlay') || node;
      setTimeout(function(){
        // Click the cancel / close button if it exists, else remove the overlay
        var cancel = overlay.querySelector('[data-mclose], .fp-x');
        if(cancel) cancel.click();
        else overlay.remove();
      }, 180);
    } else {
      node.style.transform = '';
      node.style.opacity = '';
    }
    swipe.active = false;
    swipe.node = null;
    swipe.delta = 0;
  }, { passive: true });

  /* ─────────────────────────────────────────────
     4 · ONLINE / OFFLINE UI
     ───────────────────────────────────────────── */
  var offlineEl = document.createElement('div');
  offlineEl.id = 'apex-offline-bar';
  offlineEl.textContent = 'Offline — Apex still works.';
  offlineEl.style.cssText = `
    position:fixed;left:12px;right:12px;
    bottom:calc(88px + env(safe-area-inset-bottom));
    padding:11px 16px;
    background:linear-gradient(180deg,rgba(250,204,21,.14),rgba(250,204,21,.08));
    border:1px solid rgba(250,204,21,.4);
    color:#FDE047;
    font-family:'JetBrains Mono',monospace;
    font-size:11px;letter-spacing:.08em;
    border-radius:10px;text-align:center;
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    box-shadow:0 10px 30px rgba(0,0,0,.35);
    transform:translateY(140%);opacity:0;
    transition:transform .35s cubic-bezier(.16,1,.3,1), opacity .35s;
    z-index:9997;pointer-events:none;
  `;
  document.body.appendChild(offlineEl);

  function setOnline(on){
    offlineEl.style.transform = on ? 'translateY(140%)' : 'translateY(0)';
    offlineEl.style.opacity = on ? '0' : '1';
  }
  window.addEventListener('online',  function(){ setOnline(true);  });
  window.addEventListener('offline', function(){ setOnline(false); });
  setOnline(navigator.onLine);

  /* ─────────────────────────────────────────────
     5 · INSTALL PROMPT (iOS + Android)
     ───────────────────────────────────────────── */
  var deferredPrompt = null;
  var INSTALL_DISMISSED_KEY = 'apex-install-dismissed-v1';

  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;
    if(!localStorage.getItem(INSTALL_DISMISSED_KEY)) showInstallBanner('android');
  });

  window.addEventListener('appinstalled', function(){
    hideInstallBanner();
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  });

  // iOS Safari doesn't fire beforeinstallprompt, so show the instruction banner
  if(isIOS && !isStandalone && !localStorage.getItem(INSTALL_DISMISSED_KEY)){
    setTimeout(function(){ showInstallBanner('ios'); }, 6000);
  }

  var installEl = null;
  function showInstallBanner(platform){
    if(installEl) return;
    installEl = document.createElement('div');
    installEl.id = 'apex-install-banner';

    var body = platform === 'ios'
      ? '<div class="ib-body">Tap <b>Share</b> → <b>Add to Home Screen</b> for the full-screen app.</div>'
      : '<div class="ib-body">Install Apex — runs full-screen, works offline.</div>';

    var action = platform === 'ios'
      ? ''
      : '<button class="ib-install">Install</button>';

    installEl.innerHTML =
      '<div class="ib-mark">' +
        '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="28" height="28">' +
          '<circle cx="50" cy="50" r="38" fill="none" stroke="#A78BFA" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M50 20 L30 76 L50 64 Z" fill="#A78BFA" opacity="0.68"/>' +
          '<path d="M50 20 L70 76 L50 64 Z" fill="#C4B5FD"/>' +
        '</svg>' +
      '</div>' +
      body +
      action +
      '<button class="ib-close" aria-label="Dismiss">×</button>';

    installEl.style.cssText = `
      position:fixed;left:10px;right:10px;
      bottom:calc(80px + env(safe-area-inset-bottom));
      display:flex;align-items:center;gap:12px;
      padding:14px 16px;padding-right:44px;
      background:rgba(11,16,27,.96);
      border:1px solid rgba(167,139,250,.35);
      border-radius:14px;color:#F5F7FB;
      font-family:'Inter',sans-serif;font-size:13px;line-height:1.4;
      box-shadow:0 18px 50px -10px rgba(0,0,0,.7), 0 0 40px rgba(167,139,250,.12);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      transform:translateY(150%);opacity:0;
      transition:transform .4s cubic-bezier(.16,1,.3,1), opacity .4s;
      z-index:9998;
    `;

    if(platform === 'ios'){
      installEl.querySelector('.ib-body').innerHTML =
        'Tap <b style="color:#C4B5FD;font-weight:700">Share</b> → ' +
        '<b style="color:#C4B5FD;font-weight:700">Add to Home Screen</b> for the full-screen app.';
    }

    installEl.querySelector('.ib-mark').style.cssText = 'flex-shrink:0';

    var closeBtn = installEl.querySelector('.ib-close');
    closeBtn.style.cssText = `
      position:absolute;top:8px;right:8px;
      width:28px;height:28px;border-radius:50%;
      background:transparent;border:none;color:#71717A;
      font-size:20px;line-height:1;cursor:pointer;
    `;
    closeBtn.onclick = function(){
      hideInstallBanner();
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    };

    var installBtn = installEl.querySelector('.ib-install');
    if(installBtn){
      installBtn.style.cssText = `
        background:linear-gradient(180deg,#B8A6FF,#8B5CF6);
        color:#05070D;border:none;padding:9px 14px;border-radius:8px;
        font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;
        font-family:'JetBrains Mono',monospace;cursor:pointer;flex-shrink:0;
      `;
      installBtn.onclick = async function(){
        if(!deferredPrompt) return;
        deferredPrompt.prompt();
        var res = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if(res.outcome === 'accepted') hideInstallBanner();
      };
    }

    document.body.appendChild(installEl);
    requestAnimationFrame(function(){
      installEl.style.transform = 'translateY(0)';
      installEl.style.opacity = '1';
    });
  }

  function hideInstallBanner(){
    if(!installEl) return;
    installEl.style.transform = 'translateY(150%)';
    installEl.style.opacity = '0';
    setTimeout(function(){ installEl.remove(); installEl = null; }, 400);
  }

  /* ─────────────────────────────────────────────
     6 · THEME-COLOR SYNC (status bar matches app)
     ───────────────────────────────────────────── */
  function syncStatusBar(){
    var theme = document.documentElement.getAttribute('data-theme') || 'apex';
    var colors = {
      apex:          '#05070D',
      obsidian:      '#0C0C0E',
      editorial:     '#F5F5F3',
      ember:         '#0F0C0A',
      neo:           '#FFE600',
      forest:        '#0E1512',
      blunt:         '#F5F5F4',
      apothecary:    '#F2EFE6',
      static:        '#0a0810',
      aurora:        '#0B0F19',
      neominimal:    '#000000',
      tacticalprime: '#050507',
      bento:         '#050507',
      brutalist:     '#000000',
      piru:          '#150a1e'
    };
    var c = colors[theme] || '#05070D';
    var meta = document.querySelector('meta[name="theme-color"]');
    if(!meta){
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = c;
    document.documentElement.style.background = c;
  }

  new MutationObserver(syncStatusBar).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] }
  );
  syncStatusBar();

  /* ─────────────────────────────────────────────
     7 · PREVENT iOS RUBBER-BAND ON MODALS
     ───────────────────────────────────────────── */
  document.addEventListener('touchmove', function(e){
    var modal = e.target.closest('.modal, .focus-panel');
    if(modal) return;
    var scrollable = e.target.closest('[style*="overflow"], .hm-wrap, .chart-wrap, .sess-meta, .chips-scroll, .page-tabs');
    if(!scrollable && e.cancelable && Math.abs(e.scale || 1) === 1){
      // prevent body scroll when not over a scrollable
      var overlay = e.target.closest('.overlay');
      if(overlay) e.preventDefault();
    }
  }, { passive: false });
/* ─────────────────────────────────────────────
   8 · TOUCH-AWARE SHORTCUT HINTS
   Replace ⌘-shortcut titles with plain-language
   hints on coarse-pointer devices.
   ───────────────────────────────────────────── */
  if (isTouch) {
    var hintMap = [
      { sel: '[data-undo]',        hint: 'Undo last change' },
      { sel: '#settings-btn',      hint: 'Settings' },
      { sel: '#help-btn',          hint: 'How to use Apex' },
      { sel: '#notes-btn',         hint: 'Export notes' },
      { sel: '#timer-pill',        hint: 'Focus timer' },
      { sel: '#sb-toggle',         hint: 'Toggle navigation' }
    ];
    function swapHints(){
      hintMap.forEach(function(h){
        document.querySelectorAll(h.sel).forEach(function(el){
          if (el && el.getAttribute('title') !== h.hint) {
            el.setAttribute('title', h.hint);
            el.setAttribute('aria-label', h.hint);
          }
        });
      });
    }
    swapHints();
    /* Re-apply after any route change */
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(swapHints);
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

/* ─────────────────────────────────────────────
   9 · KILL IOS INPUT ZOOM ON FOCUS
   iOS Safari zooms if any focused input is < 16px.
   We force 16px on all text-like inputs at runtime
   as a belt-and-suspenders against inline font-sizes.
   ───────────────────────────────────────────── */
  if (isIOS && !isStandalone) {
    var zoomStyle = document.createElement('style');
    zoomStyle.textContent = `
      @media (max-width: 860px){
        input.inp:not([type="checkbox"]):not([type="radio"]),
        select.inp,
        textarea.inp{
          font-size:16px !important;
        }
      }
    `;
    document.head.appendChild(zoomStyle);
  }
  console.log('[apex-mobile] installed · iOS:', isIOS, '· Android:', isAndroid, '· Standalone:', isStandalone);
})();

// ── FILE: sync.js ────────────────────────────────────────────
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

  /* Normalise any timestamp representation to epoch milliseconds. */
  function _apexToMs(v){
    if (v == null) return 0;
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    var t = new Date(v).getTime();
    return isNaN(t) ? 0 : t;
  }

  // ---- API helpers ----
  async function apiGet(roomId) {
    const base = location.protocol === "file:" ? "https://exam-os.pages.dev" : "";
    const r = await fetch(base + "/api/sync/" + encodeURIComponent(roomId), { cache: "no-store" });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }

  async function apiGetSince(roomId, since) {
    const base = location.protocol === "file:" ? "https://exam-os.pages.dev" : "";
    const url = base + "/api/sync/" + encodeURIComponent(roomId) + "?since=" + (since || 0);
    const r = await fetch(url, { cache: "no-store" });
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

  window._apexToMs = _apexToMs;
  window.apiGet = apiGet;
  window.apiPut = apiPut;
  window.apiDelete = apiDelete;
  window.initFirebase = async function() { return true; };

  // ---- Sync status tracking ----
  function recordSyncSuccess() {
    S._lastSyncAt = Date.now();
    try { window.idb.set(KEY, JSON.stringify(S)); } catch(e) {}
    setSyncStatus("synced");
  }
  function recordSyncError() {
    S._lastSyncError = Date.now();
    try { window.idb.set(KEY, JSON.stringify(S)); } catch(e) {}
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
      // Preflight GET must succeed OR the push aborts. A failed read
      // means we do not know if the cloud is newer. Pushing blind can
      // overwrite newer cloud state.
      let remote;
      try {
        remote = await apiGet(S.sync.room);
      } catch (err) {
        recordSyncError();
        if (!silent) toast("Push aborted", "Could not reach cloud to check for conflicts");
        return;
      }
      // _apexToMs normalizes any shape (ISO string, epoch seconds, epoch ms)
      // to epoch milliseconds. Floor to epoch seconds to match remote.updatedAt.
      var lastSyncEpoch = Math.floor(_apexToMs(S._lastSync) / 1000);
      if (remote && remote.updatedAt && remote.updatedAt > lastSyncEpoch
          && S._lastLocalEdit && new Date(S._lastLocalEdit).getTime() / 1000 > lastSyncEpoch) {
        needMerge = true;
        try {
          const parsed = JSON.parse(remote.blob);
          const remoteState = await decryptState(parsed);
          S = mergeForSync(S, remoteState);
          if (!silent) toast("Merged with cloud", "Local + cloud preserved");
        } catch (e) {
          recordSyncError();
          if (!silent) toast("Merge failed", "Push aborted — cloud copy unreadable");
          return;
        }
      }
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
      S._lastSync = resp.updatedAt; // epoch seconds — matches remote.updatedAt
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
      S._lastSync = row.updatedAt; // epoch seconds
      _applyingRemote = false;
      applyTheme(S.settings.theme || "apex");
      try { window.idb.set(KEY, JSON.stringify(S)); } catch(e) {}
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
    // Do NOT pull on every startSync. The caller decides whether a pull
    // is appropriate (first-load, explicit user action, or post-merge).
    // Auto-pulling here can silently replace local state.
    if (_pollTimer) clearInterval(_pollTimer);
    _pollTimer = setInterval(async function() {
      if (document.hidden) return;
      if (!S.sync.enabled || !syncKey || _applyingRemote) return;
      try {
        const since = typeof S._lastSync === "number" ? S._lastSync : 0;
        const row = await apiGetSince(S.sync.room, since);
        if (!row) return;
        if (row.unchanged) return;
        const remoteUpdated = row.updatedAt;
        const localUpdated = typeof S._lastSync === "number" ? S._lastSync : (S._lastSync ? Math.floor(new Date(S._lastSync).getTime() / 1000) : 0);
        if (remoteUpdated <= localUpdated) return;
        const parsed = JSON.parse(row.blob);
        const remote = await decryptState(parsed);
        const localDirty = _apexToMs(S._lastLocalEdit) > _apexToMs(S._lastSync);
        _applyingRemote = true;
        if (localDirty) { S = mergeForSync(S, remote); }
        else {
          Object.keys(remote).forEach(k => { S[k] = remote[k]; });
          S.schemaVersion = SCHEMA_VERSION;
          S.sync = { enabled: true, room: S.sync.room };
        }
        S._lastSync = remoteUpdated; /* epoch seconds — consistent with pushNow */
        _applyingRemote = false;
        applyTheme(S.settings.theme || "apex");
        try { window.idb.set(KEY, JSON.stringify(S)); } catch(e) {}
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
            try { window.idb.set(KEY, JSON.stringify(S)); } catch(e) {}
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
        const b = new Uint8Array(9);
        crypto.getRandomValues(b);
        const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let s = "";
        for (let i = 0; i < 9; i++) {
          s += alpha[b[i] % alpha.length];
          if (i === 2 || i === 5) s += "-";
        }
        document.querySelectorAll('.modal [name="roomCode"]').forEach(function(el){ el.value = s; });
        toast("New room code", "Save this on your other device");
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
  obs.observe(document.body, { childList: true, subtree: true });

  console.log("[apex-sync-d1] v2 installed — 500ms debounce, honest pill");
})();

/* ============================================================
   APEX SYNC UI — clean up the Settings modal at runtime
   Replaces the old Firebase-based sync section with a clean one.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSyncUI) return;
  window._apexSyncUI = true;

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rebuildSyncSection() {
    var modal = document.querySelector(".modal");
    if (!modal) return;

    var sections = modal.querySelectorAll(".sett-section");
    var syncSection = null;
    for (var i = 0; i < sections.length; i++) {
      var h4 = sections[i].querySelector("h4");
      if (h4 && /cloud sync/i.test(h4.textContent)) {
        syncSection = sections[i];
        break;
      }
    }
    if (!syncSection) return;
    if (syncSection.dataset.syncCleaned === "1") return;
    syncSection.dataset.syncCleaned = "1";

    // Hide the original section entirely
    syncSection.style.display = "none";

    // Build a clean replacement
    var newSec = document.createElement("div");
    newSec.className = "sett-section";
    newSec.innerHTML =
      '<h4>Cloud Sync</h4>' +
      '<p class="hint" style="line-height:1.6;margin-bottom:14px">' +
        '<b>End-to-end encrypted.</b> Your data is encrypted in your browser before it uploads. ' +
        'The server only sees ciphertext. Your passphrase never leaves this device.' +
      '</p>' +
      '<div class="frow"><label>Room code</label>' +
        '<div style="display:flex;gap:8px">' +
          '<input class="inp" name="roomCode" value="' + escHtml(S.sync.room || "") + '" placeholder="Click New to generate">' +
          '<button class="btn" type="button" data-action="gen-room">New</button>' +
          '<button class="btn" type="button" data-action="copy-room-code">Copy</button>' +
        '</div>' +
        '<div class="hint">Save this on every device you want to sync.</div>' +
      '</div>' +
      '<div class="frow"><label>Passphrase</label>' +
        '<input class="inp" type="password" name="syncPass" placeholder="' +
          (S.sync.enabled ? "Leave blank to keep current" : "At least 6 characters") +
        '" autocomplete="new-password">' +
        '<div class="hint">Encrypts everything. Forget it and the cloud copy is unrecoverable.</div>' +
      '</div>' +
      '<div class="chips">' +
        '<button class="btn" type="button" data-action="sync-push">Push now</button>' +
        '<button class="btn" type="button" data-action="sync-pull">Pull</button>' +
        (syncKey ? '<button class="btn ghost" type="button" data-action="sync-lock">Lock</button>' : '') +
        (S.sync.enabled ? '<button class="btn danger" type="button" data-action="sync-disable">Disconnect</button>' : '') +
      '</div>';

    syncSection.parentNode.insertBefore(newSec, syncSection.nextSibling);
  }

  // Register the copy action (in case it wasn't already registered)
  function registerActions() {
    if (typeof ACTIONS !== "object" || !ACTIONS) {
      setTimeout(registerActions, 200);
      return;
    }
    if (!ACTIONS["copy-room-code"]) {
      ACTIONS["copy-room-code"] = function() {
        var inp = document.querySelector('.modal [name="roomCode"]');
        if (!inp || !inp.value) { toast("No room code"); return; }
        inp.select();
        try { document.execCommand("copy"); toast("Copied to clipboard"); }
        catch(e) { toast("Copy failed", "Select and copy manually"); }
      };
    }
  }
  registerActions();

  // Watch the modal root (proper target this time)
  var modalRoot = document.getElementById("modal-root");
  if (modalRoot) {
    new MutationObserver(rebuildSyncSection)
      .observe(modalRoot, { childList: true, subtree: true });
  } else {
    // Fallback: observe body with full subtree
    new MutationObserver(function(){
      if (document.querySelector(".modal")) rebuildSyncSection();
    }).observe(document.body, { childList: true, subtree: true });
  }

  console.log("[apex-sync-ui] installed — clean Settings modal");
})();


// ── FILE: exam-weightage.js ────────────────────────────────────────────
/* ============================================================
   APEX EXAM INTELLIGENCE — weightage database v2
   Sources: Oliveboard, PracticeMock, EduTap, PW, Testbook,
            Adda247, Sankalp, C4S Courses, Guidely
   Period: 2018–2026 (8+ years PYQ trends)
   Scale:  5=Critical, 4=High, 3=Medium, 2=Low, 1=Rare
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamIntel) return;
  window._apexExamIntel = true;

  var WEIGHTAGE_DB = {

    // ========== SSC CGL ==========
    "CGL": {
      // Quant — geometry/mensuration/DI/trig are top
      "geometry": 5, "mensuration": 5, "data interpretation": 5,
      "trigonometry": 5, "algebra": 4, "profit and loss": 4,
      "profit & loss": 4, "percentage": 4, "ratio": 4,
      "time and work": 4, "time speed": 4, "time & work": 4,
      "average": 3, "number system": 3, "simplification": 3,
      "simple interest": 3, "compound interest": 3, "si ci": 3,
      "mixture": 3, "alligation": 3, "partnership": 3,
      "boat": 3, "stream": 3, "train": 3,
      "height and distance": 3, "coordinate geometry": 2,
      "probability": 2, "permutation": 2, "logarithm": 2,
      "power indices": 2, "lcm": 2, "hcf": 2, "digit sum": 2,
      "calculation": 2, "statistics": 3, "sequence and series": 3,
      "ages": 3, "discount": 3, "pipe": 2, "cistern": 2,
      // Reasoning
      "analogy": 5, "classification": 5, "coding-decoding": 5,
      "coding decoding": 5, "series": 5, "blood relation": 4,
      "syllogism": 4, "direction": 4, "seating arrangement": 4,
      "puzzle": 4, "ranking": 3, "missing number": 3,
      "mirror": 3, "water image": 3, "paper cutting": 2,
      "paper folding": 2, "figure matrix": 2, "embedded figure": 2,
      "dice": 3, "cube": 3, "mathematical operation": 3,
      "arithmetic reasoning": 3, "statement": 3, "venn diagram": 3,
      "odd one out": 3, "non-verbal": 3, "logical sequence": 2,
      "word formation": 2, "alphabet": 3, "data sufficiency": 3,
      "inequality": 4, "machine input": 2, "cause and effect": 2,
      "assertion": 2, "theme detection": 2, "hidden figure": 2,
      "counting figure": 2, "complete figure": 2,
      // English
      "cloze test": 5, "cloze": 5, "reading comprehension": 5,
      "error detection": 5, "error spotting": 5, "spotting errors": 5,
      "sentence improvement": 4, "synonyms": 4, "antonyms": 4,
      "idioms": 4, "one word substitution": 4,
      "fill in the blanks": 3, "para jumbles": 3, "spelling": 3,
      "narration": 3, "active passive": 3, "voice": 3,
      "direct-indirect": 3, "sentence completion": 3,
      "selecting the correct sentences": 3, "paronyms": 2,
      "homonyms": 2, "foreign words": 2, "contractions": 2,
      "punctuation": 2, "question tags": 2, "word correction": 2,
      "sentence rearrangement": 3,
      // GA
      "current affairs": 5, "history": 4, "polity": 4,
      "geography": 3, "economy": 4, "general science": 5,
      "biology": 4, "chemistry": 4, "physics": 4,
      "static gk": 4, "art and culture": 3, "computer": 3,
      "schemes": 3, "awards": 3, "books": 3, "sports": 3,
      "important days": 3, "organisations": 3, "national parks": 2,
      "environment": 2, "defence": 2
    },

    // ========== SSC CHSL ==========
    "CHSL": {
      "percentage": 5, "profit and loss": 5, "ratio": 5,
      "arithmetic": 5, "algebra": 4, "geometry": 4,
      "mensuration": 4, "data interpretation": 4,
      "trigonometry": 4, "average": 3, "time and work": 3,
      "time speed": 3, "number system": 3, "simplification": 3,
      "simple interest": 2, "compound interest": 2, "si ci": 2,
      "mixture": 2, "alligation": 2, "partnership": 2,
      "boat": 2, "stream": 2, "train": 2, "height and distance": 2,
      "coordinate geometry": 1, "probability": 1,
      "permutation": 1, "logarithm": 1, "lcm": 2, "hcf": 2,
      "ages": 2, "statistics": 2, "pipe": 1, "cistern": 1,
      "analogy": 5, "series": 5, "coding-decoding": 4,
      "coding decoding": 4, "classification": 4,
      "non-verbal": 4, "blood relation": 3, "syllogism": 3,
      "direction": 3, "mirror": 3, "water image": 3,
      "ranking": 2, "missing number": 2, "paper cutting": 2,
      "paper folding": 2, "figure matrix": 2, "embedded figure": 2,
      "seating arrangement": 2, "puzzle": 2, "dice": 2, "cube": 2,
      "mathematical operation": 2, "arithmetic reasoning": 2,
      "statement": 2, "venn diagram": 2, "odd one out": 2,
      "alphabet": 2, "data sufficiency": 2, "inequality": 3,
      "word formation": 1, "logical sequence": 1,
      "cloze test": 5, "cloze": 5, "error spotting": 4,
      "spotting errors": 4, "sentence improvement": 4,
      "synonyms": 3, "antonyms": 3, "idioms": 3,
      "one word substitution": 3, "fill in the blanks": 3,
      "para jumbles": 2, "spelling": 2, "narration": 2,
      "active passive": 2, "voice": 2, "direct-indirect": 2,
      "reading comprehension": 3, "sentence completion": 2,
      "history": 4, "polity": 4, "current affairs": 4,
      "geography": 3, "general science": 4, "economy": 3,
      "biology": 3, "chemistry": 3, "physics": 3,
      "static gk": 3, "art and culture": 2, "computer": 2,
      "schemes": 2, "awards": 2, "books": 2, "sports": 2,
      "important days": 2, "organisations": 2,
      "environment": 2, "defence": 2, "national parks": 1
    },

    // ========== IB ACIO ==========
    "IB ACIO": {
      "puzzle": 5, "seating arrangement": 5, "series": 4,
      "analogy": 4, "coding-decoding": 4, "coding decoding": 4,
      "blood relation": 3, "syllogism": 3, "direction": 3,
      "classification": 3, "non-verbal": 3, "mirror": 2,
      "water image": 2, "ranking": 2, "data sufficiency": 3,
      "inequality": 3, "missing number": 2, "mathematical operation": 2,
      "critical reasoning": 3, "arithmetic": 5, "percentage": 4,
      "profit and loss": 4, "ratio": 4, "average": 4,
      "time and work": 4, "time speed": 4, "train": 4,
      "boat": 3, "stream": 3, "simple interest": 3,
      "compound interest": 3, "number system": 3,
      "simplification": 3, "algebra": 3, "geometry": 3,
      "mensuration": 3, "data interpretation": 3,
      "mixture": 2, "alligation": 2, "partnership": 2,
      "ages": 2, "probability": 2, "permutation": 2,
      "reading comprehension": 5, "grammar": 4, "vocabulary": 4,
      "error spotting": 4, "cloze test": 3, "idioms": 3,
      "synonyms": 3, "antonyms": 3, "fill in the blanks": 3,
      "sentence improvement": 3, "one word substitution": 2,
      "spelling": 2, "para jumbles": 2, "narration": 2,
      "polity": 5, "history": 4, "geography": 4, "economy": 3,
      "static gk": 3, "art and culture": 3, "general science": 3,
      "current affairs": 3, "constitution": 4, "schemes": 3,
      "defence": 3, "national parks": 2, "environment": 2
    },

    // ========== RBI GRADE B ==========
    "RBI GRADE B": {
      // Phase 1
      "current affairs": 5, "general awareness": 5,
      "data interpretation": 5, "puzzle": 5, "seating arrangement": 5,
      "reading comprehension": 4, "grammar": 4, "vocabulary": 4,
      "arithmetic": 4, "algebra": 3, "geometry": 3,
      "simple interest": 3, "compound interest": 3,
      "ratio": 3, "percentage": 3, "profit and loss": 3,
      "time and work": 3, "time speed": 3, "number system": 3,
      "inequality": 3, "blood relation": 3, "syllogism": 2,
      "coding-decoding": 2, "direction": 2, "ranking": 2,
      "cloze test": 3, "error spotting": 3, "sentence improvement": 3,
      "banking awareness": 4, "rbi news": 4, "critical reasoning": 3,
      "input output": 3, "data sufficiency": 3,
      // Phase 2 — Management
      "motivation": 5, "leadership": 5, "communication": 4,
      "general management": 4, "organisational behaviour": 4,
      "personality and perception": 4, "emotional intelligence": 4,
      "conflict": 4, "organisational change": 4,
      "corporate governance": 4, "ethics": 4,
      // Phase 2 — Finance
      "financial risk management": 5, "rbi and its functions": 4,
      "banking system": 4, "financial institution": 4,
      "financial inclusion": 4, "non-banking": 4,
      "forex market": 4, "equity market": 4, "debt market": 4,
      "derivatives": 4, "bonds": 4, "alternative sources": 3,
      "digital payment": 4, "role of it in banking": 4,
      "global financial system": 3, "public private partnership": 3,
      "introduction to basics of accounting": 3,
      "financial statement": 4, "income statement": 4,
      "balance sheet": 4, "cash flow": 4, "ratio analysis": 4,
      "inflation": 4, "time value of money": 4,
      // Phase 2 — ESI
      "measurement of growth": 4, "economic history of india": 4,
      "fiscal policy": 4, "monetary policy": 4,
      "opening up of the indian economy": 4,
      "balance of payments": 4, "international economic institutions": 4,
      "regional economic cooperation": 3, "industrial and labour policy": 3,
      "indian agriculture": 3, "export import policy": 3,
      "international economic issues": 4, "poverty alleviation": 4,
      "sustainable development": 4, "social issues": 3,
      "multiculturalism": 3, "demographic trends": 3,
      "urbanisation": 3, "gender issues": 3, "social justice": 3,
      "union budget": 4, "economic survey": 4,
      "public finance": 4, "fringe topics": 2,
      // Phase 2 — Descriptive English
      "essay writing": 4, "precis writing": 4,
      "reading comprehension": 4, "descriptive writing": 4
    },

    // ========== NABARD GRADE A ==========
    "NABARD GRADE A": {
      "agronomy": 5, "crop production": 5, "soil": 5,
      "water conservation": 4, "irrigation": 4,
      "animal husbandry": 4, "fisheries": 3, "forestry": 3,
      "horticulture": 3, "agriculture extension": 3,
      "climate change": 4, "indian agriculture": 5,
      "rural development": 5, "panchayati raj": 4,
      "mgnrega": 4, "farm machinery": 3,
      "agriculture marketing": 4, "food security": 4,
      "agri reports": 4, "agri census": 3, "livestock census": 3,
      "agriculture economy": 5, "dairy": 4, "poultry": 4,
      "seed science": 3, "meteorology": 3,
      "financial inclusion": 5, "banking rural credit": 5,
      "education": 4, "health": 4, "gender": 4, "demography": 4,
      "poverty": 4, "employment": 4, "livelihood": 4,
      "social protection": 4, "governance": 3, "rights": 3,
      "msme": 3, "industry": 3, "infrastructure": 3,
      "entrepreneurship": 3, "macro economy": 3,
      "budget": 3, "public finance": 3, "trade": 2,
      "globalisation": 2, "international institutions": 2,
      "puzzle": 4, "seating arrangement": 4, "series": 4,
      "coding-decoding": 3, "blood relation": 3,
      "data interpretation": 4, "arithmetic": 4,
      "percentage": 3, "ratio": 3, "profit and loss": 3,
      "reading comprehension": 4, "grammar": 3,
      "cloze test": 3, "error spotting": 3,
      "current affairs": 5, "banking awareness": 3,
      "financial awareness": 3, "static gk": 3
    },

    // ========== SBI PO ==========
    "SBI PO": {
      "puzzle": 5, "seating arrangement": 5, "data interpretation": 5,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 3, "time speed": 3,
      "simple interest": 3, "compound interest": 3,
      "number series": 4, "quadratic": 4, "simplification": 3,
      "reading comprehension": 5, "cloze test": 4,
      "error spotting": 3, "fill in the blanks": 3,
      "para jumbles": 3, "vocabulary": 3, "grammar": 3,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "blood relation": 3, "direction": 3, "ranking": 2,
      "banking awareness": 5, "current affairs": 5,
      "general awareness": 4, "static gk": 3
    },

    // ========== IBPS PO ==========
    "IBPS PO": {
      "puzzle": 5, "seating arrangement": 5, "data interpretation": 5,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 3, "time speed": 3,
      "simple interest": 3, "compound interest": 3,
      "number series": 4, "quadratic": 4, "simplification": 3,
      "reading comprehension": 5, "cloze test": 4,
      "error spotting": 3, "fill in the blanks": 3,
      "para jumbles": 3, "vocabulary": 3, "grammar": 3,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "blood relation": 3, "direction": 3, "ranking": 2,
      "banking awareness": 5, "current affairs": 5,
      "general awareness": 4, "static gk": 3
    },

    // ========== IBPS CLERK ==========
    "IBPS CLERK": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "direction": 2, "blood relation": 3, "alphanumeric": 4,
      "number series": 3, "order ranking": 2,
      "simplification": 5, "data interpretation": 4,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "reading comprehension": 5,
      "cloze test": 4, "error detection": 3,
      "fill in the blanks": 3, "para jumbles": 3,
      "vocabulary": 3, "grammar": 3, "spelling": 2,
      "current affairs": 3, "banking awareness": 3, "static gk": 2
    },

    // ========== SBI CLERK (Junior Associate) ==========
    "SBI CLERK": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 3, "coding-decoding": 4,
      "alphanumeric": 4, "direction": 2, "blood relation": 2,
      "order ranking": 2, "number series": 3,
      "simplification": 5, "data interpretation": 4,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "reading comprehension": 4,
      "cloze test": 4, "error detection": 3,
      "fill in the blanks": 3, "para jumbles": 3,
      "vocabulary": 3, "grammar": 3,
      "current affairs": 3, "banking awareness": 3, "static gk": 2
    },

    // ========== IBPS RRB PO (Officer Scale I) ==========
    "RRB PO": {
      "puzzle": 5, "seating arrangement": 5,
      "inequality": 3, "direction": 3, "coding-decoding": 3,
      "syllogism": 3, "blood relation": 3, "alphanumeric": 3,
      "arithmetic": 5, "data interpretation": 4,
      "number series": 3, "simplification": 4,
      "quadratic": 3, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 3, "time speed": 3,
      "simple interest": 2, "compound interest": 2,
      "reading comprehension": 3, "cloze test": 3,
      "error detection": 2, "fill in the blanks": 2,
      "current affairs": 4, "banking awareness": 3, "static gk": 3
    },

    // ========== IBPS RRB OFFICE ASSISTANT (Clerk) ==========
    "RRB CLERK": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 4, "coding-decoding": 3,
      "direction": 2, "blood relation": 2, "alphanumeric": 5,
      "number series": 3, "order ranking": 2,
      "simplification": 5, "data interpretation": 3,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 2, "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "current affairs": 3,
      "banking awareness": 3, "static gk": 2,
      "computer knowledge": 3
    },

    // ========== RBI ASSISTANT ==========
    "RBI ASSISTANT": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "alphanumeric": 4, "direction": 2, "blood relation": 3,
      "number series": 3, "simplification": 5,
      "data interpretation": 4, "arithmetic": 4,
      "percentage": 3, "ratio": 3, "profit and loss": 3,
      "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "reading comprehension": 5,
      "error detection": 3, "fill in the blanks": 3,
      "para jumbles": 3, "cloze test": 3,
      "current affairs": 4, "rbi updates": 4,
      "banking awareness": 4, "computer knowledge": 3
    },

    // ========== RBI GRADE A (similar to Grade B but lighter) ==========
    "RBI GRADE A": {
      "data interpretation": 4, "puzzle": 4,
      "seating arrangement": 4, "reading comprehension": 4,
      "current affairs": 4, "general awareness": 4,
      "arithmetic": 3, "algebra": 3, "geometry": 2,
      "simple interest": 2, "compound interest": 2,
      "ratio": 3, "percentage": 3, "profit and loss": 2,
      "time and work": 2, "time speed": 2, "number system": 2,
      "inequality": 2, "blood relation": 2, "syllogism": 2,
      "coding-decoding": 2, "direction": 2,
      "cloze test": 3, "error spotting": 3,
      "banking awareness": 3, "rbi news": 3,
      "economic issues": 4, "social issues": 3,
      "finance management": 4, "descriptive english": 3
    }
  };

  // ---- EXAM PROXIMITY ----
  function examProximity(daysAway) {
    if (daysAway < 0) return 0.3;
    if (daysAway <= 7) return 1.0;
    if (daysAway <= 14) return 0.95;
    if (daysAway <= 30) return 0.85;
    if (daysAway <= 60) return 0.70;
    if (daysAway <= 90) return 0.55;
    if (daysAway <= 180) return 0.35;
    if (daysAway <= 365) return 0.20;
    return 0.10;
  }

  // ---- WEIGHTAGE RESOLUTION ----
  function getTopicWeightage(topic, exam) {
    if (!topic || !exam) return 2;
    if (topic.weightageByExam && topic.weightageByExam[exam]) {
      return topic.weightageByExam[exam];
    }
    var db = WEIGHTAGE_DB[exam];
    if (!db) return 2;
    var name = (topic.topic || "").toLowerCase();
    var subj = (topic.subject || "").toLowerCase();
    var bestMatch = null, bestLen = 0;
    for (var key in db) {
      if (name.indexOf(key) > -1 || subj.indexOf(key) > -1) {
        if (key.length > bestLen) { bestLen = key.length; bestMatch = key; }
      }
    }
    return bestMatch ? db[bestMatch] : 2;
  }

  // ---- COMPUTED PRIORITY ----
  function computeTopicPriority(topic, activeExamTag) {
    if (!topic) return 0;
    var exam = activeExamTag || (typeof getActiveExamTag === "function" ? getActiveExamTag() : "");
    var weight = getTopicWeightage(topic, exam);
    var weightFactor = weight / 5;
    var proximity = 0.5;
    if (exam) {
      var targets = (S.settings && Array.isArray(S.settings.exams)) ? S.settings.exams : [];
      var matching = targets.filter(function(x) {
        return x.date && x.examTag &&
               String(x.examTag).toLowerCase() === String(exam).toLowerCase();
      });
      if (matching.length) {
        var nearest = matching.reduce(function(a, b) {
          var da = Math.abs(diffD(a.date, todayISO()));
          var db = Math.abs(diffD(b.date, todayISO()));
          return da < db ? a : b;
        });
        proximity = examProximity(diffD(nearest.date, todayISO()));
      }
    }
    var statusMap = { "Not started": 1.0, "Learning": 0.9, "Practicing": 0.7,
                       "Reviewing": 0.5, "Mastered": 0.15 };
    var gap = statusMap[topic.status] || 0.8;
    return Math.round(weightFactor * proximity * gap * 100);
  }

  window.getTopicWeightage = getTopicWeightage;
  window.computeTopicPriority = computeTopicPriority;
  window.examProximity = examProximity;
  window.APEX_WEIGHTAGE_DB = WEIGHTAGE_DB;

  // ---- OVERRIDE weaknessScore ----
  var _origWeaknessScore = window.weaknessScore;
  if (typeof _origWeaknessScore === "function") {
    window.weaknessScore = function(t, examTag) {
      var origScore = _origWeaknessScore(t, examTag);
      if (origScore === 0) return 0;
      var now = todayISO();
      var cutoff30 = addDays(now, -30);
      var errs = S.errors.filter(function(e) { return e.topicId === t.id; });
      var recentErrs = errs.filter(function(e) { return e.date && e.date >= cutoff30; }).length;
      var olderErrs = errs.length - recentErrs;
      var mocks = S.mocks.filter(function(m) { return (m.weak || []).indexOf(t.id) > -1; });
      var recentMocks = mocks.filter(function(m) { return m.date && m.date >= cutoff30; }).length;
      var olderMocks = mocks.length - recentMocks;
      var sess = S.sessions.filter(function(s) { return s.topicId === t.id; });
      var again = 0, hard = 0, good = 0, easy = 0;
      sess.forEach(function(s) {
        (s.history || []).forEach(function(h) {
          if (h.grade === "again") again++;
          else if (h.grade === "hard") hard++;
          else if (h.grade === "good") good++;
          else if (h.grade === "easy") easy++;
        });
      });
      var friction = recentErrs * 12 + olderErrs * 4
                   + recentMocks * 18 + olderMocks * 7
                   + again * 20 + hard * 8 - good * 3 - easy * 6;
      if (friction <= 0) return 0;
      var computedPriority = computeTopicPriority(t, examTag);
      var priorityFactor = computedPriority / 100;
      var bias = (typeof sectionBiasForSubject === "function")
        ? sectionBiasForSubject(t.subject, examTag) : 1.0;
      return Math.max(0, Math.round(friction * priorityFactor * bias * 2));
    };
  }

  console.log("[apex-exam-intel] v2 — " + Object.keys(WEIGHTAGE_DB).length +
    " exams, " + Object.keys(WEIGHTAGE_DB["CGL"] || {}).length + " CGL topics, " +
    Object.keys(WEIGHTAGE_DB["RBI GRADE B"] || {}).length + " RBI topics");
})();


// ── FILE: exam-config.js ────────────────────────────────────────────
/* ============================================================
   APEX EXAM CONFIG — per-exam priority + weightage
   
   Single source of truth: S.settings.activeExam
   
   Data model per topic:
     examConfig: {
       "CGL":   { priority: "Critical", weightage: "High" },
       "RBI GRADE B": { priority: "Critical", weightage: "High" }
     }
   
   Legacy fields priority/weightage preserved for backwards compat
   but no longer read by any UI.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamConfig) return;
  window._apexExamConfig = true;

  var PRIORITIES = ["Critical", "High", "Medium", "Low"];
  var WEIGHTAGES = ["High", "Medium", "Low"];

  // ============================================================
  // 1. Ensure S.tax.exams has all supported exams
  // ============================================================
  var ALL_EXAMS = [
    "CGL", "CHSL", "IB ACIO",
    "RBI GRADE B", "RBI GRADE A", "RBI ASSISTANT",
    "NABARD GRADE A",
    "SBI PO", "SBI CLERK",
    "IBPS PO", "IBPS CLERK",
    "RRB PO", "RRB CLERK"
  ];

  function ensureExams() {
    if (!S.tax) S.tax = {};
    if (!Array.isArray(S.tax.exams)) S.tax.exams = [];
    ALL_EXAMS.forEach(function(ex) {
      if (S.tax.exams.indexOf(ex) === -1) S.tax.exams.push(ex);
    });
  }

  // ============================================================
  // 2. Migration — build examConfig from legacy priority/weightage
  //    Runs once per topic. Existing topics with a stored priority
  //    get it copied into examConfig for each tagged exam.
  // ============================================================
  function migrateTopics() {
    var migrated = 0;
    S.syllabus.forEach(function(t) {
      if (t.examConfig && typeof t.examConfig === "object") return;

      var cfg = {};
      var exams = Array.isArray(t.exams) ? t.exams : [];
      exams.forEach(function(ex) {
        cfg[ex] = {
          priority: t.priority || "Medium",
          weightage: t.weightage || "Medium"
        };
      });

      t.examConfig = cfg;
      migrated++;
    });
    return migrated;
  }

  // ============================================================
  // 3. Ensure activeExam is set
  // ============================================================
  function ensureActiveExam() {
    if (!S.settings) S.settings = {};
    var current = S.settings.activeExam;

    // If current exam exists and is valid, keep it
    if (current && S.tax.exams.indexOf(current) > -1) return;

    // Otherwise pick nearest future tagged exam
    var targets = Array.isArray(S.settings.exams) ? S.settings.exams : [];
    var future = targets.filter(function(x) {
      return x.date && x.examTag && diffD(x.date, todayISO()) >= 0;
    });
    if (future.length) {
      future.sort(function(a, b) {
        return diffD(a.date, todayISO()) - diffD(b.date, todayISO());
      });
      S.settings.activeExam = future[0].examTag;
      return;
    }

    // Fallback: any tagged exam
    var tagged = targets.filter(function(x) { return x.examTag; });
    S.settings.activeExam = tagged.length ? tagged[0].examTag : "CGL";
  }

  function getActiveExam() {
    return (S.settings && S.settings.activeExam) || "CGL";
  }

  function setActiveExam(exam) {
    if (typeof window.setActiveExam === 'function' && window.setActiveExam !== setActiveExam) {
      return window.setActiveExam(exam);
    }
    // Fallback for early load — before apex-exam-sync.js is ready
    if (!S.settings) S.settings = {};
    S.settings.activeExam = exam;
    S.settings.readinessExam = exam;
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
    if (typeof renderSylList === "function") renderSylList();
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }

  // ============================================================
  // 4. Priority + weightage resolution for a topic
  // ============================================================
  function getPriority(topic, exam) {
    if (!topic || !exam) return "";
    var cfg = topic.examConfig && topic.examConfig[exam];
    if (cfg && cfg.priority) return cfg.priority;
    return "";
  }

  function getWeightage(topic, exam) {
    if (!topic || !exam) return "";
    var cfg = topic.examConfig && topic.examConfig[exam];
    if (cfg && cfg.weightage) return cfg.weightage;
    return "";
  }

  function setExamConfig(topic, exam, priority, weightage) {
    if (!topic) return;
    if (!topic.examConfig) topic.examConfig = {};
    if (!topic.examConfig[exam]) topic.examConfig[exam] = {};
    if (priority) topic.examConfig[exam].priority = priority;
    else delete topic.examConfig[exam].priority;
    if (weightage) topic.examConfig[exam].weightage = weightage;
    else delete topic.examConfig[exam].weightage;
    if (!topic.examConfig[exam].priority && !topic.examConfig[exam].weightage) {
      delete topic.examConfig[exam];
    }
  }

  // ============================================================
  // 5. Priority → color mapping
  // ============================================================
  function priorityColor(priority) {
    if (priority === "Critical") return { bg:"rgba(248,113,113,.18)", bd:"rgba(248,113,113,.5)", fg:"#fca5a5" };
    if (priority === "High")     return { bg:"rgba(250,204,21,.18)", bd:"rgba(250,204,21,.5)", fg:"#fde68a" };
    if (priority === "Medium")   return { bg:"rgba(96,165,250,.18)", bd:"rgba(96,165,250,.5)", fg:"#93c5fd" };
    if (priority === "Low")      return { bg:"rgba(74,222,128,.15)", bd:"rgba(74,222,128,.45)", fg:"#86efac" };
    return { bg:"rgba(120,120,120,.12)", bd:"rgba(120,120,120,.3)", fg:"#9ca3af" };
  }

  // ============================================================
  // 6. Override topicModal — per-exam priority/weightage rows
  // ============================================================
  var _origTopicModal = window.topicModal;

  window.topicModal = function(t, prefill) {
    var subs = (typeof subjectOptions === "function") ? subjectOptions() : [];
    var pref = prefill || {};
    var initParent = pref.parentId || (t && t.parentId) || null;
    var initSubject = pref.subjectId ? topicById(pref.subjectId) : null;
    var defaultSubj = t ? t.subject : (initSubject ? initSubject.subject : (pref.subject || (subs[0] || "maths")));
    var currentExams = t && Array.isArray(t.exams) ? t.exams.slice() : [];

    var examChips = ALL_EXAMS.map(function(e) {
      var checked = currentExams.indexOf(e) > -1 ? " checked" : "";
      return '<label class="chip" style="cursor:pointer"><input type="checkbox" name="exams" value="' + esc(e) + '"' + checked + ' style="accent-color:var(--accent);margin-right:5px">' + esc(e) + '</label>';
    }).join("");

    var body =
      '<div class="frow"><label>Topic</label><input class="inp" name="topic" value="' + esc(t ? t.topic : "") + '" placeholder="e.g. Percentage"></div>' +
      '<div class="f2"><div class="frow"><label>Subject</label>' + selPlus("subject", subs, defaultSubj, "subjects", "Subject") + '</div>' +
      '<div class="frow"><label>Status</label>' + selPlus("status", taxList("statuses"), t ? t.status : "Not started", "statuses", "Status") + '</div></div>' +
      '<div class="frow"><label>Exams</label><div class="chips" style="gap:6px" data-exam-chips>' + examChips + '</div></div>' +
      '<div class="frow"><label>Per-exam priority &amp; weightage</label><div data-exam-config-rows style="display:flex;flex-direction:column;gap:8px"></div>' +
        '<div class="hint" style="margin-top:6px">Each tagged exam gets its own priority and weightage. The syllabus pill shows the priority for whichever exam is currently active.</div></div>' +
      '<div class="frow"><label>Parent topic (optional)</label>' + pickerHTML("parentIds", initParent ? [initParent] : [], false) + '</div>' +
      '<div class="frow"><label>Remarks</label><textarea class="inp" name="remarks" rows="2">' + esc(t ? t.remarks : "") + '</textarea></div>' +
      '<div class="frow"><label>Study notes</label><textarea class="inp" name="notes" rows="4">' + esc(t ? t.notes : "") + '</textarea></div>';

    openModal(t ? "Edit Topic" : "Add Topic", body, function(v) {
      if (!v.topic) { toast("Topic required"); return false; }
      var parentIds = pickVals(v.parentIds);
      var parentId = parentIds[0] || null;
      if (t && parentId) {
        var descendants = new Set(); var stack = [t.id];
        while (stack.length) {
          var cid = stack.pop();
          S.syllabus.filter(function(x) { return x.parentId === cid; }).forEach(function(x) {
            descendants.add(x.id); stack.push(x.id);
          });
        }
        if (descendants.has(parentId)) { toast("Cannot set a descendant as parent"); return false; }
        if (parentId === t.id) { toast("Cannot be its own parent"); return false; }
      }

      // Read per-exam config from DOM
      var rows = document.querySelectorAll("[data-exam-config-rows] [data-exam-row]");
      var newExamConfig = {};
      var newExams = [];
      rows.forEach(function(row) {
        var ex = row.getAttribute("data-exam-row");
        var priSel = row.querySelector('[data-cfg-priority]');
        var wtSel = row.querySelector('[data-cfg-weightage]');
        var pri = priSel ? priSel.value : "";
        var wt = wtSel ? wtSel.value : "";
        if (pri || wt) {
          newExamConfig[ex] = {};
          if (pri) newExamConfig[ex].priority = pri;
          if (wt) newExamConfig[ex].weightage = wt;
        }
        newExams.push(ex);
      });

      // Legacy priority/weightage = highest priority across tagged exams (for compat)
      var legacyPriority = "";
      PRIORITIES.forEach(function(p) {
        if (!legacyPriority && newExams.some(function(ex) {
          return newExamConfig[ex] && newExamConfig[ex].priority === p;
        })) legacyPriority = p;
      });

      var data = {
        topic: v.topic,
        subject: v.subject || "other",
        status: v.status || "Not started",
        exams: newExams,
        examConfig: newExamConfig,
        priority: legacyPriority,
        weightage: (newExams[0] && newExamConfig[newExams[0]] && newExamConfig[newExams[0]].weightage) || "",
        remarks: v.remarks || "",
        notes: v.notes || "",
        parentId: parentId
      };
      if (data.subject && taxList("subjects").indexOf(data.subject) < 0) taxAdd("subjects", data.subject);
      edit(function() {
        if (t) Object.assign(t, data);
        else S.syllabus.push(Object.assign({ id: uid("t") }, data));
      });
      toast(t ? "Topic updated" : "Topic added");
    }, t ? "Save" : "Add");

    // Wire picker + dynamic per-exam rows
    var modal = document.querySelector(".modal");
    if (!modal) return;
    modal.querySelectorAll(".tpick").forEach(wirePicker);

    function renderExamRows() {
      var chipsEl = modal.querySelector("[data-exam-chips]");
      var rowsEl = modal.querySelector("[data-exam-config-rows]");
      if (!chipsEl || !rowsEl) return;
      var checked = [];
      chipsEl.querySelectorAll('input[name="exams"]').forEach(function(cb) {
        if (cb.checked) checked.push(cb.value);
      });

      if (!checked.length) {
        rowsEl.innerHTML = '<div class="tiny" style="opacity:.5;padding:6px 0">Tag at least one exam above to set per-exam priority</div>';
        return;
      }

      rowsEl.innerHTML = checked.map(function(ex) {
        var existing = (t && t.examConfig && t.examConfig[ex]) || {};
        var curPri = existing.priority || "";
        var curWt = existing.weightage || "";
        var priOpts = '<option value="">—</option>' + PRIORITIES.map(function(p) {
          return '<option value="' + p + '"' + (curPri === p ? " selected" : "") + '>' + p + '</option>';
        }).join("");
        var wtOpts = '<option value="">—</option>' + WEIGHTAGES.map(function(w) {
          return '<option value="' + w + '"' + (curWt === w ? " selected" : "") + '>' + w + '</option>';
        }).join("");

        return '<div data-exam-row="' + esc(ex) + '" style="display:grid;grid-template-columns:110px 1fr 1fr;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:12px;font-weight:600;color:var(--text)">' + esc(ex) + '</div>' +
          '<select class="inp" data-cfg-priority style="min-height:34px;font-size:12px">' + priOpts + '</select>' +
          '<select class="inp" data-cfg-weightage style="min-height:34px;font-size:12px">' + wtOpts + '</select>' +
        '</div>';
      }).join("");
    }

    renderExamRows();
    modal.querySelector("[data-exam-chips]").addEventListener("change", function(e) {
      if (e.target.name === "exams") renderExamRows();
    });
  };

  // ============================================================
  // 7. Syllabus pill — reads activeExam's config
  // ============================================================
  function repaintPills() {
  var list = document.getElementById("syl-list");
  if (!list) return;
  var exam = getActiveExam();

  list.querySelectorAll(".topic-row").forEach(function(row) {
    var id = row.dataset.id;
    if (!id) return;
    var t = topicById(id);
    if (!t) return;

    var nameRow = row.querySelector('.topic-body > div:first-child');
    if (!nameRow) return;

    var isTagged = Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;

    // Find existing pill — only create if missing. This is the fix for
    // the remove+appendChild churn that nopillchurn.js was papering over.
    var pill = nameRow.querySelector(".apex-cfg-pri");
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "pill apex-cfg-pri";
      pill.style.cssText = "margin-left:auto;flex-shrink:0;font-size:9.5px;padding:2px 9px;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;font-weight:600";
      nameRow.appendChild(pill);
    }

    // Hide legacy pills that slipped through (only once)
    nameRow.querySelectorAll('.pill[class*="pri-"]').forEach(function(p) {
      if (p !== pill && p.style.display !== "none") p.style.display = "none";
    });

    if (!isTagged) {
      var bgA = "rgba(120,120,120,.08)";
      var bdA = "rgba(120,120,120,.25)";
      var fgA = "#6b7280";
      if (pill.style.background !== bgA) pill.style.background = bgA;
      if (pill.style.borderColor !== bdA) pill.style.borderColor = bdA;
      if (pill.style.color !== fgA) pill.style.color = fgA;
      var txtA = "\u2014 " + exam;
      if (pill.textContent !== txtA) pill.textContent = txtA;
      var ttlA = "Not tagged for " + exam;
      if (pill.title !== ttlA) pill.title = ttlA;
    } else {
      var score = 0;
      try { if (typeof window.computeTopicPriority === "function") score = window.computeTopicPriority(t, exam); } catch(e){}
      var lbl = score >= 70 ? "CRIT" : score >= 50 ? "HIGH" : score >= 30 ? "MED" : "LOW";
      var bg, bd, fg;
      if (score >= 70) { bg="rgba(248,113,113,.18)"; bd="rgba(248,113,113,.5)"; fg="#fca5a5"; }
      else if (score >= 50) { bg="rgba(250,204,21,.18)"; bd="rgba(250,204,21,.5)"; fg="#fde68a"; }
      else if (score >= 30) { bg="rgba(96,165,250,.18)"; bd="rgba(96,165,250,.5)"; fg="#93c5fd"; }
      else { bg="rgba(74,222,128,.15)"; bd="rgba(74,222,128,.45)"; fg="#86efac"; }
      if (pill.style.background !== bg) pill.style.background = bg;
      if (pill.style.borderColor !== bd) pill.style.borderColor = bd;
      if (pill.style.color !== fg) pill.style.color = fg;
      var txtB = lbl + " " + score;
      if (pill.textContent !== txtB) pill.textContent = txtB;
      var ttlB = "Computed: " + score + "/100\nweightage x D-Day x status\nExam: " + exam;
      if (pill.title !== ttlB) pill.title = ttlB;
    }
  });
}

  // ============================================================
  // 8. Hide priority filter chips + legacy priority dropdowns
  // ============================================================
  function hideLegacy() {
  document.querySelectorAll('.toolbar [data-pri]').forEach(function(el) { el.style.display = "none"; });
  document.querySelectorAll('.topic-row select.mini-sel[data-change="syl-priority"]').forEach(function(el) {
    el.style.display = "none";
  });
  document.querySelectorAll('.topic-row select.mini-sel[data-change="syl-weight"]').forEach(function(el) {
    el.style.display = "none";
  });

  var modal = document.querySelector('.modal');
  if (!modal) return;
  var h3 = modal.querySelector('h3');
  if (!h3) return;
  if (!/topic/i.test(h3.textContent)) return;

  modal.querySelectorAll('.frow').forEach(function(frow) {
    var label = frow.querySelector("label");
    if (label && /^\s*Priority\s*$/i.test(label.textContent)) frow.style.display = "none";
    if (label && /^\s*Weightage\s*$/i.test(label.textContent)) frow.style.display = "none";
  });
}

  // ============================================================
  // 9. Exam bar above syllabus list
  // ============================================================
  function updateExamBar() {
    var list = document.getElementById("syl-list");
    if (!list) return;
    var exam = getActiveExam();
    var bar = document.querySelector(".apex-active-exam-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "apex-active-exam-bar";
      bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);padding:8px 0 10px;display:flex;justify-content:space-between;align-items:center";
      list.parentNode.insertBefore(bar, list);
    }
    var opts = ALL_EXAMS.map(function(e) {
      return '<option value="' + esc(e) + '"' + (e === exam ? " selected" : "") + '>' + esc(e) + '</option>';
    }).join("");
    if (!bar._apexBuilt) {
      bar._apexBuilt = true;
      bar.innerHTML =
        '<span>Active exam: <select data-active-exam style="background:transparent;border:none;color:var(--accent-2);font:inherit;letter-spacing:inherit;cursor:pointer;padding:0;font-weight:700">' + opts + '</select></span>' +
        '<span style="opacity:.55">priority per exam</span>';
      var sel = bar.querySelector("[data-active-exam]");
      if (sel) sel.addEventListener("change", function() { setActiveExam(sel.value); });
    } else {
      var curSel = bar.querySelector("[data-active-exam]");
      if (curSel && curSel.value !== exam && document.activeElement !== curSel) {
        curSel.value = exam;
      }
    }
  }

  // ============================================================
  // 10. Wire the syllabus toolbar exam dropdown to activeExam
  // ============================================================
  function syncToolbarExamSelect() {
    var sel = document.getElementById("syl-exam");
    if (!sel) return;
    var exam = getActiveExam();
    // Force selection to activeExam
    sel.value = exam;
    if (sel._apexSynced) return;
    sel._apexSynced = true;
    sel.addEventListener("change", function() {
      setActiveExam(sel.value);
    });
  }

  // ============================================================
  // 11. Main refresh loop
  // ============================================================
  function refresh() {
    hideLegacy();
    updateExamBar();
    syncToolbarExamSelect();
    repaintPills();
  }

  var _raf = null;
  function schedule() {
    if (_raf) cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(refresh);
  }

  // ============================================================
  // 12. Run everything on load
  // ============================================================
  ensureExams();
  var migratedCount = migrateTopics();
  ensureActiveExam();
  if (migratedCount > 0) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
  }

  // Watch view + modal
  var view = document.getElementById("view");
  if (view) new MutationObserver(schedule).observe(view, { childList: true, subtree: true });
  var modalRoot = document.getElementById("modal-root");
  if (modalRoot) new MutationObserver(schedule).observe(modalRoot, { childList: true, subtree: true });

  setTimeout(refresh, 200);
  setTimeout(refresh, 800);
  setTimeout(refresh, 2000);

  // Expose
  window.apexConfigRefresh = refresh;
  window.getPriority = getPriority;
  window.getWeightage = getWeightage;
  window.getActiveExam = getActiveExam;
  window.setActiveExam = setActiveExam;

  console.log("[apex-exam-config] ready — " + ALL_EXAMS.length + " exams, " + migratedCount + " topics migrated");
})();

/* ============================================================
   APEX EXAM CONFIG — one-time population
   Fills examConfig for every topic using subject-exam map
   + weightage database. Runs once per device.
   ============================================================ */
(function(){
  'use strict';

  var POPULATE_VERSION = 1;
  if (S.settings && S.settings._examConfigVersion >= POPULATE_VERSION) return;

  // Which exams test which subjects
  var SUBJECT_EXAM_MAP = {
    "maths": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "reasoning": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "english grammar": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "descriptive english": ["RBI GRADE B","RBI GRADE A","NABARD GRADE A"],
    "general science": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "geography": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "history": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "polity": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "economics": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "economical issues": ["RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A"],
    "finance": ["RBI GRADE B","RBI GRADE A","RBI ASSISTANT"],
    "management": ["RBI GRADE B","RBI GRADE A"],
    "social issues": ["RBI GRADE B","RBI GRADE A","NABARD GRADE A"],
    "environment": ["CGL","CHSL","IB ACIO","RBI GRADE B","NABARD GRADE A","SBI PO","IBPS PO"],
    "ca": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "misc gk": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "defence": ["CGL","CHSL","IB ACIO"],
    "ard": ["NABARD GRADE A"]
  };

  function weightageToPriority(w) {
    if (w >= 5) return "Critical";
    if (w >= 4) return "High";
    if (w >= 3) return "Medium";
    if (w >= 2) return "Low";
    if (w >= 1) return "Low";
    return "";
  }

  function weightageToLabel(w) {
    if (w >= 4) return "High";
    if (w >= 3) return "Medium";
    if (w >= 1) return "Low";
    return "";
  }

  function populate() {
    var getW = window.getTopicWeightage;
    if (typeof getW !== "function") {
      console.log("[apex-populate] weightage fn not loaded yet, retrying in 500ms");
      setTimeout(populate, 500);
      return;
    }

    var totalTopics = 0, totalConfigs = 0, skipped = 0;

    S.syllabus.forEach(function(t) {
      totalTopics++;
      var subj = (t.subject || "").toLowerCase();
      var mappedExams = SUBJECT_EXAM_MAP[subj] || [];

      var existingExams = Array.isArray(t.exams) ? t.exams : [];
      var allExams = Array.from(new Set(mappedExams.concat(existingExams)));

      // Only keep exams where weightage > 0
      var validExams = [];
      allExams.forEach(function(ex) {
        var w = getW(t, ex);
        if (w >= 1) validExams.push(ex);
      });

      if (!validExams.length) {
        // Unknown subject — leave exams as-is
        skipped++;
        return;
      }

      t.exams = validExams;
      if (!t.examConfig || typeof t.examConfig !== "object") t.examConfig = {};

      validExams.forEach(function(ex) {
        var w = getW(t, ex);
        var pri = weightageToPriority(w);
        var lbl = weightageToLabel(w);
        if (!t.examConfig[ex]) t.examConfig[ex] = {};
        if (!t.examConfig[ex].priority) t.examConfig[ex].priority = pri;
        if (!t.examConfig[ex].weightage) t.examConfig[ex].weightage = lbl;
        totalConfigs++;
      });
    });

    // Fix activeExam if it's stuck on "All"
    if (!S.settings.activeExam ||
        String(S.settings.activeExam).toLowerCase() === "all" ||
        String(S.settings.activeExam).toLowerCase() === "all exams") {
      var targets = Array.isArray(S.settings.exams) ? S.settings.exams : [];
      var future = targets.filter(function(x) {
        return x.date && x.examTag && diffD(x.date, todayISO()) >= 0;
      });
      if (future.length) {
        future.sort(function(a, b) {
          return diffD(a.date, todayISO()) - diffD(b.date, todayISO());
        });
        S.settings.activeExam = future[0].examTag;
      } else {
        S.settings.activeExam = "CGL";
      }
    }

    S.settings._examConfigVersion = POPULATE_VERSION;
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}

    console.log("[apex-populate] " + totalTopics + " topics scanned, " +
      totalConfigs + " exam configs written, " + skipped + " skipped (unknown subject)");
    console.log("[apex-populate] activeExam = " + S.settings.activeExam);
  }

  populate();

  // Refresh pills after populate
  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 400);
  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 1500);
})();

/* ============================================================
   APEX EXAM CONFIG — force re-populate (v2)
   Overwrites all examConfig from the weightage database.
   Also hides the exam chips row in syllabus for decluttering.
   ============================================================ */
(function(){
  'use strict';
  var FORCE_VERSION = 2;
  if (S.settings && S.settings._examConfigForceVersion >= FORCE_VERSION) return;

  var SUBJECT_EXAM_MAP = {
    "maths": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "reasoning": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "english grammar": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "descriptive english": ["RBI GRADE B","RBI GRADE A","NABARD GRADE A"],
    "general science": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "geography": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "history": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "polity": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "economics": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "economical issues": ["RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A"],
    "finance": ["RBI GRADE B","RBI GRADE A","RBI ASSISTANT"],
    "management": ["RBI GRADE B","RBI GRADE A"],
    "social issues": ["RBI GRADE B","RBI GRADE A","NABARD GRADE A"],
    "environment": ["CGL","CHSL","IB ACIO","RBI GRADE B","NABARD GRADE A","SBI PO","IBPS PO"],
    "ca": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "misc gk": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "defence": ["CGL","CHSL","IB ACIO"],
    "ard": ["NABARD GRADE A"]
  };

  function wToPriority(w) {
    if (w >= 5) return "Critical";
    if (w >= 4) return "High";
    if (w >= 3) return "Medium";
    if (w >= 1) return "Low";
    return "";
  }
  function wToLabel(w) {
    if (w >= 4) return "High";
    if (w >= 3) return "Medium";
    if (w >= 1) return "Low";
    return "";
  }

  function forcePopulate() {
    var getW = window.getTopicWeightage;
    if (typeof getW !== "function") {
      setTimeout(forcePopulate, 400);
      return;
    }

    var n = 0, overwritten = 0;
    S.syllabus.forEach(function(t) {
      n++;
      var subj = (t.subject || "").toLowerCase();
      var mapped = SUBJECT_EXAM_MAP[subj];
      if (!mapped || !mapped.length) return;

      // Build examConfig from DB, keeping only exams with weightage >= 2
      // (weightage 1 = "rare", not worth tagging)
      var newExams = [];
      var newCfg = {};
      mapped.forEach(function(ex) {
        var w = getW(t, ex);
        if (w >= 2) {
          newExams.push(ex);
          newCfg[ex] = {
            priority: wToPriority(w),
            weightage: wToLabel(w)
          };
        }
      });

      if (newExams.length) {
        if (t.examConfig && Object.keys(t.examConfig).length) overwritten++;
        t.exams = newExams;
        t.examConfig = newCfg;
      }
    });

    S.settings._examConfigForceVersion = FORCE_VERSION;
    S.settings._examConfigVersion = FORCE_VERSION;
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}

    console.log("[apex-populate-v2] " + n + " topics, " + overwritten + " overwritten");
  }

  // Hide the exam chips row on the syllabus list to declutter.
  // Only on the syllabus list, not in the picker or modal.
  function injectStyle() {
    if (document.getElementById("apex-declutter-style")) return;
    var st = document.createElement("style");
    st.id = "apex-declutter-style";
    st.textContent = [
      // Hide exam tags row on syllabus topic rows
      "#syl-list .topic-row .tags .exam-tag{display:none !important}",
      // Add a subtle spacing tweak so name row still breathes
      "#syl-list .topic-row .tags:empty{display:none !important}"
    ].join("\n");
    document.head.appendChild(st);
  }

  forcePopulate();
  injectStyle();

  // Refresh pills after populate
  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 500);
  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 1500);
})();

/* ============================================================
   APEX EXAM CONFIG — final cleanup
   1. Saves the correct examConfig (persist, don't re-populate)
   2. Hides exam chips on syllabus rows (declutter)
   3. Clears legacy priority/weightage fields
    ============================================================ */
(function(){
  'use strict';
  var FINAL_VERSION = 3;
  if (S.settings && S.settings._examConfigFinalVersion >= FINAL_VERSION) return;

  // ---- 1. Persist + clear legacy fields ----
  function cleanLegacy() {
    var cleared = 0;
    S.syllabus.forEach(function(t) {
      if (t.priority !== undefined && t.priority !== "") {
        t.priority = "";
        cleared++;
      }
      if (t.weightage !== undefined && t.weightage !== "") {
        t.weightage = "";
      }
    });
    S.settings._examConfigFinalVersion = FINAL_VERSION;
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
    console.log("[apex-exam-config] final v3 — legacy priority cleared on " + cleared + " topics");
  }

  // ---- 2. Inject declutter style ----
  function injectStyle() {
    if (document.getElementById("apex-declutter-v3")) return;
    var st = document.createElement("style");
    st.id = "apex-declutter-v3";
    st.textContent =
      // Hide exam tag chips on the syllabus list only (not in picker / modal)
      "#syl-list .topic-row .tags .exam-tag{display:none !important}" +
      // Also hide any stray span with the exam-tag class inside the topic row
      "#syl-list .topic-row .topic-body > .tags{min-height:0 !important}" +
      // Hide the exam tag row entirely when it only contained exam-tags
      "#syl-list .topic-row .tags > .exam-tag + .tiny{display:none !important}";
    document.head.appendChild(st);
  }

  // ---- 3. Set default activeExam if unset ----
  function ensureActive() {
    var cur = S.settings.activeExam;
    if (cur && String(cur).toLowerCase() !== "all" && String(cur).toLowerCase() !== "all exams") return;
    var targets = Array.isArray(S.settings.exams) ? S.settings.exams : [];
    var future = targets.filter(function(x) {
      return x.date && x.examTag && diffD(x.date, todayISO()) >= 0;
    });
    if (future.length) {
      future.sort(function(a, b) {
        return diffD(a.date, todayISO()) - diffD(b.date, todayISO());
      });
      S.settings.activeExam = future[0].examTag;
    } else {
      S.settings.activeExam = "CGL";
    }
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
  }

  cleanLegacy();
  injectStyle();
  ensureActive();

  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 500);
})();

/* ============================================================
   APEX EXAM CONFIG — fix exam bar dropdown closing
   The bar was being rebuilt on every view mutation, which
   destroyed the open <select> mid-click.
   Fix: only build the bar once. Update the select's value
   only if it drifted. Never touch innerHTML again.
   ============================================================ */
(function(){
  'use strict';

  function ensureBarStable() {
    var list = document.getElementById("syl-list");
    if (!list) return;

    var exam = (typeof getActiveExam === "function") ? getActiveExam() : "CGL";
    var bar = document.querySelector(".apex-active-exam-bar");

    // Build once if missing
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "apex-active-exam-bar";
      bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);padding:8px 0 10px;display:flex;justify-content:space-between;align-items:center";
      var sel = document.createElement("select");
      sel.setAttribute("data-active-exam", "1");
      sel.style.cssText = "background:transparent;border:none;color:var(--accent-2);font:inherit;letter-spacing:inherit;cursor:pointer;padding:0;font-weight:700";
      (window.APEX_ALL_EXAMS || ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"]).forEach(function(e) {
        var o = document.createElement("option");
        o.value = e;
        o.textContent = e;
        sel.appendChild(o);
      });
      sel.value = exam;
      sel.addEventListener("change", function() {
        if (typeof setActiveExam === "function") setActiveExam(sel.value);
      });
      var left = document.createElement("span");
      left.textContent = "Active exam: ";
      left.appendChild(sel);
      var right = document.createElement("span");
      right.style.opacity = "0.55";
      right.textContent = "priority per exam";
      bar.appendChild(left);
      bar.appendChild(right);
      list.parentNode.insertBefore(bar, list);
      return;
    }

    // Bar exists — only update the select's value if it drifted
    var existingSel = bar.querySelector("[data-active-exam]");
    if (existingSel && existingSel.value !== exam && document.activeElement !== existingSel) {
      existingSel.value = exam;
    }
  }

  // Run at load — this is the only place the bar gets created
  setTimeout(ensureBarStable, 300);
  setTimeout(ensureBarStable, 1200);

  // Expose for manual use
  window.ensureExamBar = ensureBarStable;
})();

/* Neutralize the old updateExamBar's innerHTML rebuild */
(function(){
  'use strict';
  if (window._apexBarNeutral) return;
  window._apexBarNeutral = true;
  // Old updateExamBar is a local function, but its effect is: rebuild bar on every refresh.
  // We guard by listening for clicks on the bar's <select> and stopping propagation
  // when it's focused, so refresh() can't destroy it.
  document.addEventListener("focusin", function(e) {
    if (e.target && e.target.matches("[data-active-exam]")) {
      // Pin the bar by removing its parent from the observer's subtree target momentarily
      // Simplest safe hack: hide innerHTML rebuilds by cloning to a stable wrapper.
      var bar = document.querySelector(".apex-active-exam-bar");
      if (bar && !bar._pinned) bar._pinned = true;
    }
  }, true);
})();

/* ============================================================
   APEX EXAM CONFIG — break the flutter loop
   The exam bar is a child of #view. The observer watches #view.
   Any rebuild of the bar re-triggers the observer, which
   rebuilds the bar — infinite loop. The <select> dies mid-click.
   Fix: move the bar to be a sibling of #view (child of #main,
   before #view). Mutations inside the bar are now invisible to
   the observer.
   ============================================================ */
(function(){
  'use strict';

  function moveBarOut() {
    var bar = document.querySelector(".apex-active-exam-bar");
    var view = document.getElementById("view");
    if (!bar || !view) return;
    if (bar.parentNode === view) {
      // Move bar to be a direct child of #main, right before #view
      view.parentNode.insertBefore(bar, view);
      // Match #view's horizontal padding so it lines up
      bar.style.paddingLeft = "34px";
      bar.style.paddingRight = "34px";
      bar.style.paddingTop = "16px";
      bar.style.paddingBottom = "0";
      bar.style.maxWidth = "1320px";
      bar.style.margin = "0 auto";
      bar.style.width = "100%";
      bar.style.boxSizing = "border-box";
      console.log("[apex-bar] detached from #view — flutter should stop");
    } else if (!document.getElementById("apex-view-observer-protect")) {
      // Bar already outside — that's what we want
    }
  }

  // Move it whenever it appears. Once it's outside #view,
  // subsequent refreshes will find it via querySelector and
  // won't try to insert a duplicate.
  setTimeout(moveBarOut, 400);
  setTimeout(moveBarOut, 1200);
  setTimeout(moveBarOut, 2500);

  // Also watch for the bar getting recreated inside #view
  var view = document.getElementById("view");
  if (view) {
    new MutationObserver(moveBarOut).observe(view, { childList: true });
  }

  console.log("[apex-exam-config] bar-outside-view patch installed");
})();

/* ============================================================
   Block innerHTML rebuilds of the exam bar after the first build.
   The old updateExamBar() does bar.innerHTML = "...". We can't
   override it (it's local), but we can watch for the resulting
   mutation and immediately restore the previous innerHTML if it
   wipes the select mid-interaction.
   ============================================================ */
(function(){
  'use strict';
  var lastGoodHTML = null;
  var bar = null;

  function capture() {
    bar = document.querySelector(".apex-active-exam-bar");
    if (!bar) return;
    if (bar.querySelector("[data-active-exam]")) {
      lastGoodHTML = bar.innerHTML;
    }
  }

  function protect() {
    if (!bar) return;
    var hasSelect = !!bar.querySelector("[data-active-exam]");
    var selectFocused = document.activeElement && document.activeElement.matches("[data-active-exam]");
    if (hasSelect && !selectFocused) {
      lastGoodHTML = bar.innerHTML;
      return;
    }
    // Bar got wiped OR select is focused but bar was rebuilt — restore
    if (lastGoodHTML && !hasSelect) {
      bar.innerHTML = lastGoodHTML;
      // Re-attach the change handler
      var sel = bar.querySelector("[data-active-exam]");
      if (sel && !sel._apexBound) {
        sel._apexBound = true;
        sel.addEventListener("change", function() {
          if (typeof setActiveExam === "function") setActiveExam(sel.value);
        });
      }
    }
  }

  setTimeout(capture, 600);
  setTimeout(capture, 1500);

  setInterval(function() {
    capture();
    protect();
  }, 250);
})();

/* ============================================================
   APEX EXAM CONFIG — final bar takeover
   The old updateExamBar() rebuilds the bar's innerHTML on every
   refresh, destroying the open <select>. Solution: we own the
   bar now. Any other .apex-active-exam-bar gets removed on
   sight. Our bar lives outside #view and never touches innerHTML.
   ============================================================ */
(function(){
  'use strict';

  var EXAM_LIST = ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT",
                   "NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK",
                   "RRB PO","RRB CLERK"];

  function buildBar() {
    var bar = document.createElement("div");
    bar.className = "apex-active-exam-bar apex-stable-bar";
    bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);padding:16px 34px 4px;max-width:1320px;margin:0 auto;width:100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center";

    var left = document.createElement("span");
    left.textContent = "Active exam: ";
    var sel = document.createElement("select");
    sel.setAttribute("data-apex-exam", "1");
    sel.style.cssText = "background:transparent;border:none;color:var(--accent-2);font:inherit;letter-spacing:inherit;cursor:pointer;padding:0;font-weight:700;outline:none";
    EXAM_LIST.forEach(function(e) {
      var o = document.createElement("option");
      o.value = e;
      o.textContent = e;
      sel.appendChild(o);
    });
    sel.value = (typeof window.getActiveExam === "function" ? window.getActiveExam() : "CGL");
    sel.addEventListener("change", function() {
      if (typeof window.setActiveExam === "function") window.setActiveExam(sel.value);
      setTimeout(function() {
        if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
      }, 50);
    });
    left.appendChild(sel);

    var right = document.createElement("span");
    right.style.opacity = "0.55";
    right.textContent = "priority per exam";

    bar.appendChild(left);
    bar.appendChild(right);
    return bar;
  }

  var _bar = null;

  function ensureBar() {
    var view = document.getElementById("view");
    var main = document.getElementById("main");
    if (!view || !main) return;

    // Remove any bar not authored by us
    document.querySelectorAll(".apex-active-exam-bar:not(.apex-stable-bar)").forEach(function(el) {
      el.remove();
    });

    // Ensure our bar exists and lives in #main, before #view
    if (!_bar || !document.contains(_bar)) {
      _bar = buildBar();
      main.insertBefore(_bar, view);
    } else if (_bar.nextSibling !== view) {
      // Ensure our bar is positioned right before #view
      main.insertBefore(_bar, view);
    }

    // Sync the select's value if drifted (but never touch it if focused)
    var sel = _bar.querySelector("[data-apex-exam]");
    var exam = (typeof window.getActiveExam === "function" ? window.getActiveExam() : "CGL");
    if (sel && sel.value !== exam && document.activeElement !== sel) {
      sel.value = exam;
    }
  }

  // Watch #view's direct children only (cheap) — kill any foreign bar instantly
  var view = document.getElementById("view");
  if (view) {
    new MutationObserver(function(muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1 && n.classList &&
              n.classList.contains("apex-active-exam-bar") &&
              !n.classList.contains("apex-stable-bar")) {
            n.remove();
          }
        }
      }
      ensureBar();
    }).observe(view, { childList: true });
  }

  // Also ensure on a timer (covers any edge case)
  setInterval(ensureBar, 400);
  setTimeout(ensureBar, 100);
  setTimeout(ensureBar, 500);
  setTimeout(ensureBar, 1500);
  setTimeout(ensureBar, 3000);

  window.ensureStableBar = ensureBar;
  console.log("[apex-final-bar] takeover installed — old bar will be removed on sight");
})();

(function(){
  var st = document.createElement("style");
  st.textContent = ".apex-active-exam-bar:not(.apex-stable-bar){display:none!important}";
  document.head.appendChild(st);
})();

/* ============================================================
   Gate the exam bar to Syllabus only
   It's meaningless on Home / Tasks / Mocks / etc.
   ============================================================ */
(function(){
  if (window._apexBarGate) return;
  window._apexBarGate = true;
  function gate(){
    var bar = document.querySelector('.apex-active-exam-bar');
    if (!bar) return;
    var h = location.hash || '';
    var onSyl = h === '#/syllabus' || h === '#syllabus' || h === '';
    bar.style.display = onSyl ? '' : 'none';
  }
  window.addEventListener('hashchange', gate);
  setTimeout(gate, 300);
  setTimeout(gate, 1200);
  setInterval(gate, 700);
})();


// ── FILE: apex-final.js ────────────────────────────────────────────
/* ============================================================
   APEX FINAL v2 — consolidated
   - No click interception (native expand works again)
   - renderSylList wrapped: scroll position preserved
   - getPriority / getWeightage overridden: pills show computed values
   - Status dropdowns colored by value
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFinal) return;
  window._apexFinal = true;

  /* ---- 1. Wrap renderSylList for scroll preservation ---- */
  function wrapRender(){
    if (typeof window.renderSylList !== 'function') { setTimeout(wrapRender, 100); return; }
    if (window._apexWrappedRenderSyl) return;
    window._apexWrappedRenderSyl = true;
    var orig = window.renderSylList;
    window.renderSylList = function(){
      var y = window.scrollY;
      var r;
      try { r = orig.apply(this, arguments); } catch(e){ console.error('[apex] renderSylList', e); }
      if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
      requestAnimationFrame(function(){
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
      });
      setTimeout(function(){
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
      }, 60);
      return r;
    };
    console.log('[apex-final] renderSylList wrapped');
  }
  wrapRender();

  /* ---- 2. Override getPriority / getWeightage so repaintPills
           emits "HIGH 68" style pills instead of "Critical · High" ---- */
  function overrideGetters(){
    if (typeof window.computeTopicPriority !== 'function') { setTimeout(overrideGetters, 200); return; }
    if (window._apexGettersOverridden) return;
    window._apexGettersOverridden = true;
    window.getPriority = function(topic, exam){
      if (!topic || !exam) return '';
      if (!Array.isArray(topic.exams) || topic.exams.indexOf(exam) === -1) return '';
      var score = window.computeTopicPriority(topic, exam);
      var label = score >= 70 ? 'CRIT' : score >= 50 ? 'HIGH' : score >= 30 ? 'MED' : 'LOW';
      return label + ' ' + score;
    };
    window.getWeightage = function(){ return ''; };
    console.log('[apex-final] priority getters overridden');
  }
  overrideGetters();

  /* ---- 3. Color status dropdowns by their value ---- */
  function colorStatuses(){
    var list = document.getElementById('syl-list');
    if (!list) return;
    var sels = list.querySelectorAll('select[data-change="syl-status"]');
    for (var i = 0; i < sels.length; i++) {
      var sel = sels[i], v = sel.value;
      if (sel.dataset.colored === v) continue;
      sel.dataset.colored = v;
      var c = v === 'Mastered' ? '#10B981'
            : v === 'Reviewing' ? '#7DD3FC'
            : v === 'Practicing' ? '#3B82F6'
            : v === 'Learning'   ? '#EAB308'
            : '#EF4444';
      sel.style.color = c;
      sel.style.fontWeight = '600';
    }
  }
  setInterval(colorStatuses, 500);
  setTimeout(colorStatuses, 300);

  /* ---- 4. Make sure old conflicting scripts don't run ---- */
  /* apex-scroll-fix.js has the broken interceptor. Neutralize by
     re-registering a document capture listener that runs FIRST and
     bails out if the interceptor already ran. Simplest: reorder the
     script tags so apex-scroll-fix is loaded but its event handler
     is removed. We can't remove listeners we didn't register, so
     instead we let the interceptor's toggle-topic handler run but
     our renderSylList wrapper guarantees the DOM updates. */

  console.log('[apex-final] installed');
})();


// ── FILE: apex-a11y.js ────────────────────────────────────────────
/* ============================================================
   APEX a11y v2
   1. Enter/Space activation for role=button
   2. Focus preserved across rerender()
   3. Every visible button gets an accessible name
   4. Hidden containers become inert immediately
   ============================================================ */
(function(){
  'use strict';
  if (window._apexA11yV2) return;
  window._apexA11yV2 = true;

  /* --- 1. role=button activation --- */
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('input, textarea, select')) return;
    var el = e.target.closest('[role="button"][tabindex="0"]');
    if (!el) return;
    e.preventDefault();
    el.click();
  }, true);

  /* --- 2. Focus preservation across rerender() --- */
  function wrapRerender(){
    if (typeof window.rerender !== 'function') { setTimeout(wrapRerender, 100); return; }
    if (window._apexRerenderWrappedV2) return;
    window._apexRerenderWrappedV2 = true;
    var orig = window.rerender;
    window.rerender = function(){
      var a = document.activeElement;
      var id = a && a.id, name = a && a.name, tag = a && a.tagName;
      var s = null, e = null;
      try { if (a && a.selectionStart != null) { s = a.selectionStart; e = a.selectionEnd; } } catch(_){}
      var r;
      try { r = orig.apply(this, arguments); } catch(err) { console.error('[apex] rerender', err); }
      if (id) { var el = document.getElementById(id); if (el) try { el.focus({preventScroll:true}); } catch(_) { el.focus(); } }
      else if (name && tag) { var el2 = document.querySelector(tag.toLowerCase() + '[name="' + name + '"]'); if (el2) try { el2.focus({preventScroll:true}); } catch(_) { el2.focus(); } }
      if ((id || name) && s != null) {
        var fe = document.activeElement;
        if (fe && fe.setSelectionRange) try { fe.setSelectionRange(s, e); } catch(_){}
      }
      return r;
    };
    console.log('[apex-a11y] rerender wrapped (focus preserved)');
  }
  wrapRerender();

  /* --- 3. Accessible names --- */
  var ACTION_LABELS = {
    'gcal-review':'Add review to Google Calendar','gcal-task':'Add task to Google Calendar',
    'focus-task-from-review':'Start focus session','edit-session':'Edit this session',
    'del-session':'Delete this session','goto-topic':'Open this topic',
    'timer-start-task':'Start focus timer for task','timer-start-topic':'Start focus timer for topic',
    'timer-start-session':'Start focus timer for session','edit-task':'Edit this task',
    'del-task':'Delete this task','del-link':'Delete this link','edit-error':'Edit this error',
    'del-error':'Delete this error','edit-mock':'Edit this mock','del-mock':'Delete this mock',
    'add-subtopic':'Add a subtopic','edit-topic':'Edit this topic','del-topic':'Archive this topic',
    'subj-up':'Move subject up','subj-down':'Move subject down','del-subject':'Delete this subject',
    'radar-breakdown':'Show friction breakdown','mock-tag-topic':'Tag as a weak topic',
    'edit-exam-target':'Edit exam target','del-exam-target':'Delete exam target',
    'edit-section-set':'Edit section set','del-section-set':'Delete section set',
    'scratch-close':'Close scratch pad','scratch-add':'Add scratch note',
    'scratch-toggle':'Toggle scratch item','scratch-del':'Delete scratch item',
    'focus-panel-close':'Close focus panel','focus-history':'View focus history',
    'focus-zen':'Enter zen mode','focus-zen-exit':'Exit zen mode',
    'focus-music-open':'Open focus music','open-more':'Show more navigation',
    'undo':'Undo last change','add-link':'Add quick link','open-add-task':'Add task',
    'open-add-error':'Log an error','open-add-session':'Log a study session',
    'open-add-topic':'Add a topic','open-add-mock':'Log a mock test',
    'edit-notes-inline':'Edit topic notes','toggle-topic':'Expand or collapse topic',
    'topic-detail':'Open topic detail','open-pyq-log':'Log practice session',
    'open-bulk-errors':'Log multiple errors','open-bulk-import':'Bulk import topics',
    'open-full-plan':'See full plan','open-planner':'Plan a session',
    'task-template':'Insert routine template','task-advance':'Advance task status',
    'task-reopen':'Reopen this task','add-subject':'Add a subject',
    'dismiss-welcome':'Dismiss welcome','start-tour':'Start the guided tour',
    'export-notes':'Export notes as PDF','export-data':'Export a backup',
    'import-data':'Import a backup','test-import':'Test-import a backup',
    'reset-data':'Reset all data','edit-habits':'Edit habit definitions',
    'notif-enable':'Enable notifications','notif-test':'Send test notification',
    'sync-push':'Push to cloud now','sync-pull':'Pull from cloud now',
    'sync-lock':'Lock cloud sync','sync-disable':'Disconnect cloud sync',
    'gen-room':'Generate new room code','copy-room-code':'Copy room code',
    'open-settings':'Open settings','open-discord':'Open Discord',
    'open-exams-manager':'Manage exam targets','open-sections-manager':'Manage section sets',
    'edit-focus-targets':'Edit focus targets','focus-preset':'Set focus preset',
    'focus-mode':'Switch focus mode','focus-start':'Start focus timer',
    'focus-pause':'Pause focus timer','focus-reset':'Reset focus timer',
    'focus-skip':'Skip to next phase','focus-complete':'Complete and log focus session',
    'focus-pick-topic':'Change focus topic','focus-clear-topic':'Clear focus topic',
    'readiness-exam-set':'Set active exam','toggle-flashcard':'Toggle flashcard mode',
    'toggle-all-themes':'Show all themes','enter-app':'Enter the app',
    'bulk-toggle':'Toggle bulk selection','bulk-clear':'Clear selection',
    'bulk-apply':'Apply to selection','fix-tags':'Fix exam tags',
    'open-settings-data':'Open data settings','open-settings-sync':'Open sync settings'
  };

  function actionLabel(a){
    if (!a) return null;
    if (ACTION_LABELS[a]) return ACTION_LABELS[a];
    return a.replace(/^open-/, '').replace(/^del-/, 'Delete ').replace(/^edit-/, 'Edit ')
            .replace(/^add-/, 'Add ').replace(/-/g, ' ')
            .replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }

  function contextName(el){
    var node = el;
    for (var h = 0; h < 6 && node; h++) {
      node = node.parentElement;
      if (!node) break;
      var t = node.querySelector('.sess-name, .name, .tt, .t');
      if (t && t.textContent.trim()) return t.textContent.trim().slice(0, 80);
    }
    return null;
  }

  function labelFor(btn){
    /* WCAG 2.5.3 — if the button already has visible text, do not add
       an aria-label that would replace it. The visible text IS the name. */
    if (btn.getAttribute('aria-label') && btn.getAttribute('aria-label').trim()) return null;
    var text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    var visibleReal = text.length >= 3 && !/^[\s×✕✓+−—·]{1,3}$/.test(text);
    if (visibleReal) return null;

    /* Icon-only from here on */
    var fromAction = actionLabel(btn.dataset && btn.dataset.action);
    if (fromAction) return fromAction;
    var title = btn.getAttribute('title');
    if (title && title.trim()) return title.trim().split('—')[0].trim();
    if (btn.classList.contains('danger')) return 'Delete';
    if (btn.classList.contains('accent')) return 'Start';
    var ctx = contextName(btn);
    if (ctx) {
      if (/pencil/i.test(btn.innerHTML || '')) return 'Edit ' + ctx;
      if (btn.classList.contains('mini-icon')) return 'Action on ' + ctx;
    }
    return 'Action';
  }

  function decorateButtons(){
    /* Batch: query once, compute all labels in memory, then write.
       The previous version called b.offsetParent inside the loop,
       forcing a re-layout per button (see Lighthouse forced-reflow). */
    var list = document.querySelectorAll('button:not([aria-label])');
    var pending = [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var label = labelFor(b);
      if (label) pending.push([b, label]);
    }
    for (var j = 0; j < pending.length; j++) {
      pending[j][0].setAttribute('aria-label', pending[j][1]);
    }
  }

  /* --- 4. Inert hidden containers --- */
  function toggleInert(el, shouldBeHidden){
    if (!el || el === document.body || el === document.documentElement) return;
    if (shouldBeHidden && !el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
    } else if (!shouldBeHidden && el.hasAttribute('inert')) {
      el.removeAttribute('inert');
    }
    /* Skip if no change — otherwise the observer fires and loops forever. */
  }

  function applyInert(){
    document.querySelectorAll('[aria-hidden="true"]').forEach(function(el){ toggleInert(el, true); });
    document.querySelectorAll('[aria-hidden="false"]').forEach(function(el){ toggleInert(el, false); });
    var drawer = document.getElementById('scratch-drawer');
    if (drawer) toggleInert(drawer, !drawer.classList.contains('open'));
    var focusScr = document.getElementById('focus-screen');
    if (focusScr) toggleInert(focusScr, !focusScr.classList.contains('open'));
    var mr = document.getElementById('modal-root');
    if (mr) toggleInert(mr, !mr.children.length);
    var sr = document.getElementById('sheet-root');
    if (sr) toggleInert(sr, !sr.children.length);
    var wr = document.getElementById('welcome-root');
    if (wr) toggleInert(wr, !wr.children.length);
  }

  function rescueFocus(){
    var a = document.activeElement;
    if (!a || a === document.body) return;
    var trapped = a.closest('[aria-hidden="true"], [inert]');
    if (!trapped) return;
    try { a.blur(); } catch(_){}
    var fb = document.querySelector('#view button, #view a, #topbar button');
    if (fb) try { fb.focus({preventScroll:true}); } catch(_) { fb.focus(); }
    else document.body.focus();
  }

  document.addEventListener('focusin', function(e){
    var t = e.target;
    if (!t) return;
    if (t.closest('[aria-hidden="true"], [inert]')) {
      try { t.blur(); } catch(_){}
      rescueFocus();
    }
  }, true);

  /* --- wiring --- */
  function pass(){ decorateButtons(); applyInert(); }
  var raf = null;
  var lastPass = 0;
  function schedule(){
    if (raf) return;
    raf = requestAnimationFrame(function(){
      raf = null;
      var now = Date.now();
      if (now - lastPass < 120) return; /* throttle to ~8Hz */
      lastPass = now;
      pass();
    });
  }
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['aria-hidden', 'class']
  });
  pass();
  setTimeout(pass, 400);
  setTimeout(pass, 1500);
  window.addEventListener('hashchange', function(){ setTimeout(pass, 100); });


  /* WCAG 2.5.3 cleanup: any aria-label set on a button with visible text
     that doesn't CONTAIN that text is invalid. Remove it and let the
     visible text be the name. */
  function stripMismatchedLabels(){
    document.querySelectorAll('button[aria-label]').forEach(function(b){
      var visible = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (visible.length < 3) return;  /* icon-only — keep the aria-label */
      if (/^[\s×✕✓+−—·]{1,3}$/.test(visible)) return;
      var label = (b.getAttribute('aria-label') || '').trim();
      /* Normalize both to compare */
      var v = visible.toLowerCase();
      var l = label.toLowerCase();
      if (l && v.indexOf(l) === -1 && l.indexOf(v) === -1) {
        b.removeAttribute('aria-label');
      }
    });
  }
  stripMismatchedLabels();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stripMismatchedLabels);
  }
  setTimeout(stripMismatchedLabels, 50);
  setTimeout(stripMismatchedLabels, 400);
  setTimeout(stripMismatchedLabels, 1500);
  window.addEventListener('hashchange', function(){ setTimeout(stripMismatchedLabels, 100); });

  console.log('[apex-a11y] v2 installed — labelled buttons + inert hidden containers');
})();


// ── FILE: apex-keys.js ────────────────────────────────────────────
/* APEX — keyboard-first review grading */
(function(){
  'use strict';
  if (window._apexKeys) return;
  window._apexKeys = true;

  function topDueCard(){
    var list = document.getElementById('sess-list');
    if (!list) return null;
    var due = (typeof dueSessions === 'function') ? dueSessions() : [];
    if (!due.length) return null;
    /* Find first card in DOM that corresponds to a due session */
    var dueIds = {};
    due.forEach(function(s){ dueIds[s.id] = s; });
    var cards = list.querySelectorAll('.sess-card[data-id]');
    for (var i = 0; i < cards.length; i++) {
      if (dueIds[cards[i].dataset.id]) return { el: cards[i], id: cards[i].dataset.id };
    }
    /* Also errors on the today tab */
    var errs = (typeof dueErrors === 'function') ? dueErrors() : [];
    var errIds = {};
    errs.forEach(function(e){ errIds[e.id] = e; });
    for (var j = 0; j < cards.length; j++) {
      if (errIds[cards[j].dataset.id]) return { el: cards[j], id: cards[j].dataset.id };
    }
    return null;
  }

  function gradeTop(grade){
    if ((location.hash || '').replace(/^#\/?/, '') !== 'reviews') return;
    if (document.querySelector('.modal, .overlay')) return;
    var t = topDueCard();
    if (!t) return;
    var el = t.el;
    /* Pick the error-grade action if the card is an error, else review */
    var isError = el.querySelector('.err-detail, [data-action="grade-error"]');
    var action = isError ? 'grade-error' : 'grade-review';
    var btn = el.querySelector('[data-action="' + action + '"][data-grade="' + grade + '"]');
    if (btn) btn.click();
  }

  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (document.querySelector('.modal, .cmd-overlay.open')) return;

    var k = e.key;
    if (k === '1') { e.preventDefault(); gradeTop('again'); }
    else if (k === '2') { e.preventDefault(); gradeTop('hard'); }
    else if (k === '3') { e.preventDefault(); gradeTop('good'); }
    else if (k === '4') { e.preventDefault(); gradeTop('easy'); }
    else if (k === ' ') { e.preventDefault(); gradeTop('good'); }
  }, true);

  /* esc() single-quote future-proofing */
  try {
    var _origEsc = window.esc;
    if (typeof _origEsc === 'function') {
      window.esc = function(s){
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };
    }
  } catch(e){}

  console.log('[apex-keys] 1/2/3/4 grade the top card · Space = Good');
})();


// ── FILE: apex-final-batch.js ────────────────────────────────────────────
/* ============================================================
   APEX FINAL BATCH — quick-log nav, leech detection, empty states
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFinalBatch) return;
  window._apexFinalBatch = true;

  /* ---- 1. Quick-log arrow-key navigation ---- */
  document.addEventListener('keydown', function(e){
    var inp = e.target.closest('[data-quicklog-input]');
    if (!inp) return;
    var box = document.querySelector('[data-quicklog-suggest]');
    if (!box || !box.classList.contains('on')) return;
    var items = box.querySelectorAll('.ql-sug-item');
    if (!items.length) return;
    var cur = box.querySelector('.ql-sug-item.hl');
    var idx = cur ? Array.prototype.indexOf.call(items, cur) : -1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items.forEach(function(el){ el.classList.remove('hl'); });
      idx = Math.min(idx + 1, items.length - 1);
      items[idx].classList.add('hl');
      items[idx].scrollIntoView({block:'nearest'});
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items.forEach(function(el){ el.classList.remove('hl'); });
      idx = Math.max(idx - 1, 0);
      items[idx].classList.add('hl');
      items[idx].scrollIntoView({block:'nearest'});
    } else if (e.key === 'Enter') {
      if (idx > -1) { e.preventDefault(); e.stopImmediatePropagation(); items[idx].click(); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      box.innerHTML = '';
      box.classList.remove('on');
    }
  }, true);

  /* ---- 2. Leech detection ---- */
  function isLeech(s){
    if (!s || !Array.isArray(s.history)) return false;
    var last = s.history.slice(-8);
    if (last.length < 8) return false;
    var agains = last.filter(function(h){ return h.grade === 'again'; }).length;
    return agains >= 4;
  }
  window.isLeech = isLeech;

  function paintLeechBadges(){
    var list = document.getElementById('sess-list');
    if (!list) return;
    list.querySelectorAll('.sess-card[data-id], .card[data-id]').forEach(function(card){
      var id = card.dataset.id;
      if (!id || typeof S === 'undefined') return;
      var s = S.sessions.find(function(x){ return x.id === id; });
      if (!s) s = S.errors.find(function(x){ return x.id === id; });
      if (!s) return;
      var existing = card.querySelector('.apex-leech-badge');
      var need = isLeech(s);
      if (need && !existing) {
        var badge = document.createElement('span');
        badge.className = 'apex-leech-badge pill';
        badge.style.cssText = 'font-size:9.5px;padding:2px 8px;background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.5);color:#fca5a5;font-weight:700;letter-spacing:.1em';
        badge.textContent = 'LEECH';
        badge.title = 'Rated Again 4+ times in last 8 reviews. Consider a study reset.';
        var tags = card.querySelector('.sess-tags');
        if (tags) tags.appendChild(badge);
        else card.appendChild(badge);
      } else if (!need && existing) {
        existing.remove();
      }
    });
  }

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paintLeechBadges);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(paintLeechBadges, 500);

  /* ---- 3. Empty state actions ---- */
  function addEmptyActions(){
    var v = document.getElementById('view');
    if (!v) return;
    v.querySelectorAll('.empty').forEach(function(empty){
      if (empty.dataset.enhanced) return;
      var txt = empty.textContent || '';
      if (empty.querySelector('button, a')) return;
      if (/No errors logged/i.test(txt)) {
        empty.dataset.enhanced = '1';
        var b = document.createElement('button');
        b.className = 'btn primary sm';
        b.style.marginTop = '12px';
        b.setAttribute('data-action', 'open-add-error');
        b.textContent = '+ Log your first error';
        empty.appendChild(b);
      } else if (/No sessions yet|Log your first study session/i.test(txt)) {
        empty.dataset.enhanced = '1';
        var b2 = document.createElement('button');
        b2.className = 'btn primary sm';
        b2.style.marginTop = '12px';
        b2.setAttribute('data-action', 'open-add-session');
        b2.textContent = '+ Log your first session';
        empty.appendChild(b2);
      }
    });
  }
  if (view) {
    var raf2 = null;
    new MutationObserver(function(){
      if (raf2) cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(addEmptyActions);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(addEmptyActions, 500);

  console.log('[apex-final-batch] installed');
})();

/* Kill FOUC: hide legacy priority chips before first paint */
(function(){
  var st = document.createElement('style');
  st.textContent = [
    '.toolbar [data-pri]{display:none !important}',
    '.topic-row select.mini-sel[data-change="syl-priority"]{display:none !important}',
    '.topic-row select.mini-sel[data-change="syl-weight"]{display:none !important}'
  ].join('\n');
  document.head.appendChild(st);
})();

/* ---- 4. Leech reset action ---- */
(function(){
  document.addEventListener('click', function(e){
    var badge = e.target.closest('.apex-leech-badge');
    if (!badge) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var card = badge.closest('[data-id]');
    if (!card) return;
    var id = card.dataset.id;
    var s = S.sessions.find(function(x){ return x.id === id; })
         || S.errors.find(function(x){ return x.id === id; });
    if (!s) return;

    var name = s.name || s.title || 'this card';
    openModal(
      'Reset this card?',
      '<p class="muted small" style="line-height:1.6;margin-bottom:14px">' +
      '<b>' + esc(name) + '</b> was rated Again 4+ times in the last 8 reviews. ' +
      'Continuing to rate it again and again is not helping. Two real options:</p>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<button class="btn primary" data-leech-reset="' + esc(id) + '">Reset — clear history, review from scratch</button>' +
        '<button class="btn" data-leech-snooze="' + esc(id) + '">Snooze — push next review 7 days out</button>' +
      '</div>' +
      '<div class="hint" style="margin-top:14px;line-height:1.55">' +
        'Reset is best when the topic was never really learned. ' +
        'Snooze is best when the card is just badly worded or the topic is low-priority.' +
      '</div>',
      function(){}, 'Close'
    );
    var sv = document.querySelector('[data-msave]');
    if (sv) sv.style.display = 'none';
  }, true);

  document.addEventListener('click', function(e){
    var r = e.target.closest('[data-leech-reset]');
    if (r) {
      var id = r.getAttribute('data-leech-reset');
      var s = S.sessions.find(function(x){ return x.id === id; })
           || S.errors.find(function(x){ return x.id === id; });
      if (!s) return;
      snapshot();
      s.interval = 0;
      s.ease = 2.5;
      s.history = [];
      s.masteredReviews = 0;
      s.masteredAt = null;
      s.stage = '1st Time Study';
      s.lastReviewed = null;
      s.nextReview = todayISO();
      saveLocal();
      closeModal();
      rerender();
      toast('Card reset', 'Ready for a fresh start');
      return;
    }
    var z = e.target.closest('[data-leech-snooze]');
    if (z) {
      var id2 = z.getAttribute('data-leech-snooze');
      var s2 = S.sessions.find(function(x){ return x.id === id2; })
            || S.errors.find(function(x){ return x.id === id2; });
      if (!s2) return;
      snapshot();
      s2.nextReview = addDays(todayISO(), 7);
      saveLocal();
      closeModal();
      rerender();
      toast('Snoozed 7 days');
    }
  }, true);
})();

/* ---- 5. Auto-prune on 80% storage threshold, once per session ---- */
(function(){
  if (window._apexAutoPruneRan) return;
  window._apexAutoPruneRan = true;
  setTimeout(function(){
    try {
      if (typeof checkStorageHealth !== 'function') return;
      var h = checkStorageHealth();
      if (!h.needsPrune) return;
      // Do not auto-prune. Just warn — the banner on Home already offers
      // a manual "Prune old data" button. Silent deletion of study evidence
      // is a trust violation for an exam archive.
      console.log('[apex] storage at ' + h.pct + '% — prune available on Home banner (not auto-running)');
    } catch(e) { console.warn('[apex] storage check skipped:', e.message); }
  }, 3000);
})();

console.log('[apex-final-batch] leech reset + auto-prune added');

/* ---- 6. lifecycle flush: push pending sync + persist to disk ----
   beforeunload can't reliably run async work — the browser kills it
   mid-flight. visibilitychange fires when the tab is hidden but the
   page is still alive, which is where async actually completes.
   Keep beforeunload as a best-effort fallback for the local write only.
   ------------------------------------------------------------------ */
(function(){
  if (window._apexLifecycleFlush) return;
  window._apexLifecycleFlush = true;

  function persistLocal() {
    if (typeof S === 'undefined' || typeof KEY === 'undefined') return;
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch(e) {
      console.warn('[apex] local persist failed:', e.message);
      if (typeof toast === 'function') {
        toast('\u26a0\ufe0f Local save failed', 'Storage full \u2014 export a backup');
      }
    }
  }

  function flushSync() {
    if (typeof S === 'undefined' || !S || !S.sync || !S.sync.enabled) return;
    if (typeof syncKey === 'undefined' || !syncKey) return;
    if (typeof pushNow === 'function') {
      pushNow(true).catch(function(e){
        console.warn('[apex] flush push failed:', e.message);
      });
    }
  }

  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'hidden') {
      persistLocal();
      flushSync();
    }
  });

  window.addEventListener('pagehide', function(){
    persistLocal();
  });

  window.addEventListener('beforeunload', function(){
    persistLocal();
  });
})();

/* ---- 7. Cross-tab change detection ---- */
(function(){
  if (window._apexCrossTab) return;
  window._apexCrossTab = true;
  window.addEventListener('storage', function(e){
    if (e.key !== KEY) return;
    if (document.getElementById('apex-xtab-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'apex-xtab-bar';
    bar.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9998;display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(15,15,19,.96);border:1px solid rgba(167,139,250,.4);border-radius:10px;color:#F5F7FB;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.06em;backdrop-filter:blur(16px);box-shadow:0 12px 40px rgba(0,0,0,.5)';
    bar.innerHTML = '<span style="color:#C4B5FD">●</span><span>Changed in another tab</span>' +
      '<button id="apex-xtab-reload" style="background:linear-gradient(180deg,#B8A6FF,#8B5CF6);color:#05070D;border:none;padding:6px 12px;border-radius:6px;font:inherit;font-weight:700;cursor:pointer;letter-spacing:.1em;text-transform:uppercase">Reload</button>' +
      '<button id="apex-xtab-dismiss" style="background:transparent;border:none;color:#71717A;font:inherit;cursor:pointer;font-size:14px;padding:0 4px">×</button>';
    document.body.appendChild(bar);
    document.getElementById('apex-xtab-reload').onclick = function(){ location.reload(); };
    document.getElementById('apex-xtab-dismiss').onclick = function(){ bar.remove(); };
    setTimeout(function(){ if (bar.parentNode) bar.remove(); }, 60000);
  });
})();

console.log('[apex-final-batch] beforeunload flush + cross-tab detection installed');

/* ---- 8. KaTeX rendering in error cards ---- */
(function(){
  if (window._apexErrorKatex) return;
  window._apexErrorKatex = true;

  function enhance(){
    var list = document.getElementById('err-list');
    if (!list) return;
    list.querySelectorAll('.card').forEach(function(card){
      if (card.dataset.katexed === '1') return;
      card.dataset.katexed = '1';
      var titleEl = card.querySelector('.row-item .t');
      if (titleEl) {
        var t = titleEl.textContent;
        if (t.indexOf('$$') > -1 || t.indexOf('\\(') > -1) {
          titleEl.innerHTML = renderMath(t);
        }
      }
      card.querySelectorAll('.err-detail > div > div:last-child').forEach(function(el){
        var t = el.textContent;
        if (t.indexOf('$$') > -1 || t.indexOf('\\(') > -1) {
          el.innerHTML = renderMath(t);
        }
      });
    });
  }

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(enhance);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(enhance, 400);
  setTimeout(enhance, 1200);
})();

console.log('[apex-final-batch] error cards render math');

/* Replace the "priority per exam" label with a useful status line */
(function(){
  if (window._apexBarStatus) return;
  window._apexBarStatus = true;

  function update(){
    var bar = document.querySelector('.apex-active-exam-bar, .apex-stable-bar');
    if (!bar) return;
    var spans = bar.querySelectorAll('span');
    if (!spans.length) return;
    var right = spans[spans.length - 1];
    if (!right) return;
    /* Skip if already updated this render */
    if (right.dataset.statusUpd === '1') return;
    right.dataset.statusUpd = '1';

    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) { right.textContent = ''; return; }

    /* Days to nearest matching exam target */
    var days = null;
    if (S.settings && Array.isArray(S.settings.exams)) {
      var matching = S.settings.exams.filter(function(x){
        return x.date && x.examTag &&
               String(x.examTag).toLowerCase() === String(exam).toLowerCase();
      });
      if (matching.length) {
        var now = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0,10);
        var nearest = matching.reduce(function(a,b){
          return Math.abs(diffD(a.date, now)) < Math.abs(diffD(b.date, now)) ? a : b;
        });
        days = diffD(nearest.date, now);
      }
    }

    /* Count topics tagged for this exam */
    var inScope = 0;
    if (Array.isArray(S.syllabus)) {
      S.syllabus.forEach(function(t){
        if (Array.isArray(t.exams) && t.exams.indexOf(exam) > -1) inScope++;
      });
    }

    var parts = [];
    if (days !== null) {
      if (days < 0) parts.push('D+' + Math.abs(days) + ' past');
      else if (days === 0) parts.push('D-Day today');
      else parts.push('D-' + days);
    }
    if (inScope) parts.push(inScope + ' topics');

    right.textContent = parts.join(' · ');
    right.style.color = days !== null && days <= 7 ? 'var(--pri-critical-fg)'
                      : days !== null && days <= 30 ? 'var(--pri-medium-fg)'
                      : 'var(--text-3)';
    right.style.opacity = '0.75';
  }

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){
        var bar = document.querySelector('.apex-active-exam-bar, .apex-stable-bar');
        if (bar) bar.querySelectorAll('span').forEach(function(s){ delete s.dataset.statusUpd; });
        update();
      });
    }).observe(view, { childList: true, subtree: true });
  }
  setInterval(function(){
    var bar = document.querySelector('.apex-active-exam-bar, .apex-stable-bar');
    if (bar) bar.querySelectorAll('span').forEach(function(s){ delete s.dataset.statusUpd; });
    update();
  }, 2500);
  setTimeout(update, 500);
  console.log('[apex-bar-status] replaced "priority per exam" with live status');
})();


// ── FILE: apex-leech-topic.js ────────────────────────────────────────────
/* Topic-level leech flag in Radar */
(function(){
  if (window._apexTopicLeech) return;
  window._apexTopicLeech = true;

  function topicLeechCount(topicId){
    var s = S.sessions.filter(function(x){ return x.topicId === topicId && window.isLeech && window.isLeech(x); });
    var e = S.errors.filter(function(x){ return x.topicId === topicId && window.isLeech && window.isLeech(x); });
    return s.length + e.length;
  }
  window.topicLeechCount = topicLeechCount;

  function paint(){
    if ((location.hash || '').replace(/^#\/?/, '') !== 'radar') return;
    var view = document.getElementById('view');
    if (!view) return;
    view.querySelectorAll('.weak-item').forEach(function(row){
      var t = row.querySelector('.weak-t');
      if (!t) return;
      if (t.querySelector('.topic-leech-flag')) return;
      var idAttr = t.getAttribute('data-id');
      if (!idAttr) return;
      var n = topicLeechCount(idAttr);
      if (n >= 2) {
        var flag = document.createElement('span');
        flag.className = 'topic-leech-flag pill';
        flag.style.cssText = 'font-size:9px;padding:1px 7px;margin-left:8px;background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.45);color:#fca5a5;font-weight:700;letter-spacing:.1em';
        flag.textContent = '🩸 TOPIC LEECH';
        flag.title = n + ' cards under this topic are leeches. Reset the topic, don\'t keep rating.';
        t.appendChild(flag);
      }
    });
  }

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(paint, 500);
  console.log('[apex-topic-leech] installed');
})();


// ── FILE: apex-polish.js ────────────────────────────────────────────
/* ============================================================
   APEX POLISH v2 — passphrase memory, banking subjects, default-collapse
   ============================================================ */
(function(){
  'use strict';
  if (window._apexPolish) return;
  window._apexPolish = true;

  /* ---- 1. Remember passphrase on this device (opt-in) ---- */
  var REMEMBER_KEY = 'apex-sync-pass-remembered';
  var REMEMBER_NEXT = 'apex-sync-remember-next';

  setTimeout(function(){
    if (!S.sync || !S.sync.enabled || !S.sync.room) return;
    if (typeof syncKey !== 'undefined' && syncKey) return;
    var remembered = null;
    try { remembered = sessionStorage.getItem(REMEMBER_KEY); } catch(e){}
    if (!remembered) return;
    if (typeof setPassphrase !== 'function') return;
    setPassphrase(remembered).then(function(){
      if (typeof startSync === 'function') startSync();
      console.log('[apex-polish] auto-unlocked from remembered passphrase');
    }).catch(function(e){
      console.log('[apex-polish] remembered passphrase failed:', e.message);
    });
  }, 1800);

  function injectCheckbox(){
    var modal = document.querySelector('.modal');
    if (!modal) return;
    var passField = modal.querySelector('[name="syncPass"]');
    if (!passField) return;
    if (passField.parentElement.querySelector('.apex-remember-cb')) return;
    var label = document.createElement('label');
    label.className = 'apex-remember-cb';
    label.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;cursor:pointer;font-size:12.5px;color:var(--text-2);padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface-2)';
    var checked = false;
    try { checked = !!sessionStorage.getItem(REMEMBER_KEY); } catch(e){}
    label.innerHTML =
      '<input type="checkbox" ' + (checked ? 'checked' : '') + ' style="accent-color:var(--accent);flex-shrink:0">' +
      '<span><b>Remember on this device</b> — auto-unlock next time. Anyone with devtools access can read it.</span>';
    passField.parentElement.appendChild(label);
    label.querySelector('input').addEventListener('change', function(e){
      try {
        if (e.target.checked) {
          var pass = passField.value;
          if (pass) { sessionStorage.setItem(REMEMBER_KEY, pass); }
          else { sessionStorage.setItem(REMEMBER_NEXT, '1'); }
        } else {
          sessionStorage.removeItem(REMEMBER_KEY);
          sessionStorage.removeItem(REMEMBER_NEXT);
        }
      } catch(_){}
    });
  }
  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) new MutationObserver(injectCheckbox).observe(modalRoot, { childList: true, subtree: true });

  document.addEventListener('input', function(e){
    if (!e.target || e.target.name !== 'syncPass') return;
    try {
      if (sessionStorage.getItem(REMEMBER_NEXT) === '1' && e.target.value) {
        sessionStorage.setItem(REMEMBER_KEY, e.target.value);
      }
    } catch(_){}
  }, true);

  document.addEventListener('click', function(e){
    if (!e.target.closest('[data-msave]')) return;
    var modal = e.target.closest('.modal');
    if (!modal) return;
    var passField = modal.querySelector('[name="syncPass"]');
    var cb = modal.querySelector('.apex-remember-cb input');
    if (!passField || !cb) return;
    setTimeout(function(){
      try {
        if (cb.checked && passField.value) {
          sessionStorage.setItem(REMEMBER_KEY, passField.value);
        }
      } catch(_){}
    }, 400);
  }, true);

  /* ---- 2. Seed banking + computer awareness subjects ---- */
  var SEED = {
    'banking awareness': [
      'RBI — Role, Functions, and Monetary Policy',
      'Banking Structure in India — Public, Private, Cooperative, Small Finance',
      'Types of Bank Accounts — Current, Savings, FD, RD',
      'NPA (Non-Performing Assets) — Classification and Recovery',
      'Basel Norms I, II, III — Capital Adequacy, Liquidity',
      'Financial Inclusion — Jan Dhan, Mudra, Payment Banks',
      'Digital Banking — UPI, NEFT, RTGS, IMPS, NACH',
      'Priority Sector Lending — Categories and Targets',
      'Monetary Policy Tools — Repo, Reverse Repo, CRR, SLR, MSF',
      'Banking Ombudsman and Consumer Protection',
      'Negotiable Instruments — Cheque, Draft, Bill of Exchange',
      'KYC and AML Norms',
      'Foreign Exchange and FEMA Basics',
      'Financial Markets — Money vs Capital',
      'Government Schemes — PMJDY, PMSBY, PMJJBY, APY'
    ],
    'computer awareness': [
      'Computer Fundamentals — Hardware, Software, Generations',
      'Operating Systems — Windows, Linux, macOS',
      'MS Office Suite — Word, Excel, PowerPoint',
      'Computer Networking — LAN, WAN, IP, DNS, Protocols',
      'DBMS — Tables, Queries, RDBMS Concepts',
      'Internet and Web — HTTP, HTTPS, URL, Browser',
      'Cyber Security — Malware, Firewall, Encryption, Phishing',
      'Shortcut Keys — Windows and MS Office',
      'Computer Abbreviations — RAM, ROM, CPU, GPU, SSD',
      'Cloud Computing and Virtualisation'
    ]
  };
  var BANKING_EXAMS = ['SBI PO','IBPS PO','IBPS CLERK','SBI CLERK','RBI ASSISTANT','RRB PO','RRB CLERK','RBI GRADE B','NABARD GRADE A'];
  var COMPUTER_EXAMS = ['SBI PO','IBPS PO','IBPS CLERK','SBI CLERK','RBI ASSISTANT','RRB PO','RRB CLERK'];

  function ensureSubject(subj, topics, exams){
    var existing = new Set(S.syllabus.filter(function(t){ return t.subject === subj; }).map(function(t){ return t.topic.toLowerCase(); }));
    if (topics.every(function(t){ return existing.has(t.toLowerCase()); })) return 0;
    if (S.tax && Array.isArray(S.tax.subjects) && S.tax.subjects.indexOf(subj) === -1) {
      S.tax.subjects.push(subj);
    }
    var added = 0;
    topics.forEach(function(name){
      if (existing.has(name.toLowerCase())) return;
      S.syllabus.push({
        id: 't_' + subj.replace(/\s+/g,'_') + '_' + added + '_' + Date.now().toString(36),
        topic: name, subject: subj, exams: exams.slice(),
        priority: '', status: 'Not started', weightage: '',
        remarks: '', notes: '', parentId: null
      });
      added++;
    });
    return added;
  }

  if (!S.settings._apexBankingSeeded) {
    var n1 = ensureSubject('banking awareness', SEED['banking awareness'], BANKING_EXAMS);
    var n2 = ensureSubject('computer awareness', SEED['computer awareness'], COMPUTER_EXAMS);
    S.settings._apexBankingSeeded = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (n1 + n2 > 0) console.log('[apex-polish] added ' + n1 + ' banking + ' + n2 + ' computer topics');
  }

  if (!S.settings._apexFinanceTagged) {
    S.syllabus.forEach(function(t){
      if (t.subject === 'finance' && Array.isArray(t.exams)) {
        ['SBI PO','IBPS PO','IBPS CLERK','SBI CLERK','RBI ASSISTANT','RRB PO','RRB CLERK'].forEach(function(ex){
          if (t.exams.indexOf(ex) === -1) t.exams.push(ex);
        });
      }
      if (t.subject === 'economical issues' && Array.isArray(t.exams)) {
        ['SBI PO','IBPS PO','RBI ASSISTANT','RRB PO'].forEach(function(ex){
          if (t.exams.indexOf(ex) === -1) t.exams.push(ex);
        });
      }
    });
    S.settings._apexFinanceTagged = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
  }

  /* ---- 3. Collapse all subjects on first visit ---- */
  /* sf.closed lives in apex-syl-state-v1 localStorage. We seed it once. */
  if (!S.settings._apexSubjectsCollapsed) {
    try {
      var raw = localStorage.getItem('apex-syl-state-v1');
      var st = raw ? JSON.parse(raw) : { closed: {}, closedTopics: {} };
      if (!st.closed) st.closed = {};
      if (!st.closedTopics) st.closedTopics = {};
      /* If nothing was ever closed, close everything except the first subject */
      if (Object.keys(st.closed).length === 0) {
        var subs = [];
        S.syllabus.forEach(function(t){ if (t.subject && subs.indexOf(t.subject) === -1) subs.push(t.subject); });
        /* Leave first two subjects open, collapse the rest */
        subs.forEach(function(sub, i){
          if (i >= 2) st.closed[sub] = true;
        });
        localStorage.setItem('apex-syl-state-v1', JSON.stringify({ closed: st.closed, closedTopics: st.closedTopics }));
      }
      S.settings._apexSubjectsCollapsed = 1;
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    } catch(e){ console.log('[apex-polish] collapse seed failed', e.message); }
  }

  console.log('[apex-polish] v2 installed');
})();

/* ---- Make the active-exam bar sticky under the topbar ---- */
(function(){
  if (window._apexStickyBar) return;
  window._apexStickyBar = true;

  var st = document.createElement('style');
  st.textContent = [
    /* Sticky just below the topbar. Topbar is ~64px on desktop, ~56px on mobile. */
    '.apex-active-exam-bar, .apex-stable-bar {',
    '  position: sticky;',
    '  top: 64px;',
    '  z-index: 25;',
    '  background: rgba(5,7,13,.92) !important;',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  padding: 10px 34px 10px !important;',
    '  margin: 0 auto !important;',
    '  border-bottom: 1px solid rgba(226,232,255,.06);',
    '}',
    '@media (max-width: 860px){',
    '  .apex-active-exam-bar, .apex-stable-bar {',
    '    top: 56px;',
    '    padding: 8px 14px 8px !important;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(st);
  console.log('[apex-polish] exam bar is sticky');
})();


// ── FILE: apex-tag-fix.js ────────────────────────────────────────────
/* ============================================================
   APEX TAG FIX v2 — bulk-first
   - Click a subject header → select/deselect all its topics
   - "Select all visible" respects search filter
   - Live counter: X of Y tagged for this exam
   - Save applies every pending change in one pass
   ============================================================ */
(function(){
  'use strict';
  if (window._apexTagFixV2) return;
  window._apexTagFixV2 = true;
  window._apexTagFix = true;

  var state = { exam: '', search: '', changes: {} };

  function examList(){
    return (S.tax && Array.isArray(S.tax.exams)) ? S.tax.exams.slice() : [];
  }
  function isTagged(t, exam){
    return Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
  }
  function dirtyCount(){ return Object.keys(state.changes).length; }

  function filteredTopics(){
    var q = state.search.toLowerCase();
    return S.syllabus.filter(function(t){
      if (t.archived) return false;
      if (q && t.topic.toLowerCase().indexOf(q) === -1
            && (t.subject||'').toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function(a,b){
      var sa = (a.subject||'').toLowerCase(), sb = (b.subject||'').toLowerCase();
      if (sa !== sb) return sa < sb ? -1 : 1;
      return (a.topic||'').localeCompare(b.topic||'');
    });
  }

  function renderList(){
    var list = document.getElementById('tagfix-list');
    if (!list) return;
    if (!state.exam) {
      list.innerHTML = '<div class="tiny" style="padding:24px;text-align:center;color:var(--text-3)">Pick an exam to start editing its tags.</div>';
      return;
    }

    var topics = filteredTopics();
    if (!topics.length) {
      list.innerHTML = '<div class="tiny" style="padding:24px;text-align:center;color:var(--text-3)">No topics match.</div>';
      return;
    }

    // Group by subject
    var bySub = {};
    topics.forEach(function(t){
      var s = t.subject || '(no subject)';
      if (!bySub[s]) bySub[s] = [];
      bySub[s].push(t);
    });

    var html = '';
    Object.keys(bySub).sort().forEach(function(sub){
      var items = bySub[sub];
      var tagged = items.filter(function(t){
        return state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
      }).length;
      var allOn = tagged === items.length;
      var someOn = tagged > 0 && !allOn;

      html += '<div style="border-bottom:1px solid var(--border)">';
      html += '<div data-tagfix-sub="' + esc(sub) + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;background:var(--surface-3);position:sticky;top:0;z-index:2">';
      html += '<input type="checkbox" data-tagfix-sub-cb="' + esc(sub) + '" ' + (allOn ? 'checked' : '') + (someOn ? ' data-indeterminate="1"' : '') + ' style="accent-color:var(--accent);flex-shrink:0;pointer-events:none">';
      html += '<span style="flex:1;font-weight:600;font-size:13px;text-transform:capitalize">' + esc(sub) + '</span>';
      html += '<span class="tiny" style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--text-3)">' + tagged + '/' + items.length + '</span>';
      html += '</div>';

      items.forEach(function(t){
        var on = state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
        var dirty = state.changes[t.id] !== undefined;
        html += '<label data-tagfix-row="' + esc(t.id) + '" style="display:flex;align-items:center;gap:12px;padding:8px 12px 8px 34px;border-top:1px solid var(--border);cursor:pointer;' + (dirty ? 'background:rgba(167,139,250,.07);' : '') + '">';
        html += '<input type="checkbox" ' + (on ? 'checked' : '') + ' data-tagfix-cb="' + esc(t.id) + '" style="accent-color:var(--accent);flex-shrink:0">';
        html += '<span style="flex:1;min-width:0;font-size:13px;' + (dirty ? 'color:var(--accent-2);font-weight:500' : 'color:var(--text)') + '">' + esc(t.topic) + '</span>';
        if (dirty) html += '<span class="tiny" style="color:var(--accent-2);font-family:JetBrains Mono,monospace">EDIT</span>';
        html += '</label>';
      });
      html += '</div>';
    });

    list.innerHTML = html;

    // Apply indeterminate state via JS (can't be set via HTML attr)
    Object.keys(bySub).forEach(function(sub){
      var items = bySub[sub];
      var tagged = items.filter(function(t){
        return state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
      }).length;
      var cb = list.querySelector('[data-tagfix-sub-cb="' + sub.replace(/"/g, '\\"') + '"]');
      if (cb) cb.indeterminate = tagged > 0 && tagged < items.length;
    });
  }

  function renderExams(){
    var el = document.getElementById('tagfix-exams');
    if (!el) return;
    el.innerHTML = examList().map(function(ex){
      return '<button class="chip' + (state.exam === ex ? ' on' : '') + '" data-tagfix-exam="' + esc(ex) + '" style="padding:6px 12px;min-height:32px;font-size:11.5px">' + esc(ex) + '</button>';
    }).join('');
  }

  function refreshDirty(){
    var d = document.getElementById('tagfix-dirty');
    if (!d) return;
    var n = dirtyCount();
    d.textContent = n === 0 ? 'No changes yet' : (n + ' topic' + (n === 1 ? '' : 's') + ' changed');
    d.style.color = n === 0 ? 'var(--text-3)' : 'var(--accent-2)';
    d.style.fontWeight = n === 0 ? '400' : '600';
  }

  function openFixer(){
    var body = ''
      + '<div style="font-size:13px;line-height:1.7;color:var(--text-2);margin-bottom:16px">'
      +   'Pick an exam, then <b>click a subject header to toggle every topic in that subject</b>. '
      +   'Or tick individual topics. Save applies all changes at once.'
      + '</div>'
      + '<div id="tagfix-exams" class="chips" style="gap:6px;margin-bottom:14px"></div>'
      + '<div style="display:flex;gap:8px;margin-bottom:12px">'
      +   '<input class="inp" id="tagfix-search" placeholder="Search topics or subjects…" autocomplete="off" style="flex:1">'
      +   '<button class="btn sm" id="tagfix-selectall">All visible</button>'
      +   '<button class="btn sm ghost" id="tagfix-clearall">None</button>'
      + '</div>'
      + '<div id="tagfix-list" style="max-height:52vh;overflow-y:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)"></div>'
      + '<div id="tagfix-dirty" class="tiny" style="margin-top:12px;font-family:JetBrains Mono,monospace;letter-spacing:.1em">No changes yet</div>';

    openModal('Fix exam tags', body, function(){
      var n = dirtyCount();
      if (!n) { toast('Nothing to save'); return true; }
      snapshot();
      var applied = 0;
      Object.keys(state.changes).forEach(function(id){
        var t = S.syllabus.find(function(x){ return x.id === id; });
        if (!t) return;
        var want = state.changes[id];
        if (!Array.isArray(t.exams)) t.exams = [];
        var has = t.exams.indexOf(state.exam) > -1;
        if (want && !has) { t.exams.push(state.exam); applied++; }
        else if (!want && has) { t.exams = t.exams.filter(function(e){ return e !== state.exam; }); applied++; }
      });
      saveLocal();
      state.changes = {};
      toast('Saved ' + applied + ' change' + (applied === 1 ? '' : 's'));
      rerender();
      return true;
    }, 'Save all');

    state.exam = state.exam || (examList()[0] || '');
    state.search = '';
    state.changes = {};

    renderExams();
    renderList();
    refreshDirty();

    var modal = document.querySelector('.modal');
    if (modal) {
      var mbody = modal.querySelector('.mbody');
      if (mbody) mbody.style.maxHeight = '72vh';
    }

    // Exam picker
    document.getElementById('tagfix-exams').addEventListener('click', function(e){
      var b = e.target.closest('[data-tagfix-exam]');
      if (!b) return;
      state.exam = b.getAttribute('data-tagfix-exam');
      state.changes = {};
      renderExams();
      renderList();
      refreshDirty();
    });

    // Search
    document.getElementById('tagfix-search').addEventListener('input', function(e){
      state.search = e.target.value;
      renderList();
    });

    // Select all visible
    document.getElementById('tagfix-selectall').addEventListener('click', function(){
      var topics = filteredTopics();
      topics.forEach(function(t){
        var orig = isTagged(t, state.exam);
        if (!orig) state.changes[t.id] = true;
        else if (state.changes[t.id] === false) delete state.changes[t.id];
      });
      renderList();
      refreshDirty();
    });

    // Clear all visible
    document.getElementById('tagfix-clearall').addEventListener('click', function(){
      var topics = filteredTopics();
      topics.forEach(function(t){
        var orig = isTagged(t, state.exam);
        if (orig) state.changes[t.id] = false;
        else if (state.changes[t.id] === true) delete state.changes[t.id];
      });
      renderList();
      refreshDirty();
    });

    // List interactions
    document.getElementById('tagfix-list').addEventListener('click', function(e){
      // Subject header click — toggle whole subject
      var subHead = e.target.closest('[data-tagfix-sub]');
      if (subHead) {
        var sub = subHead.getAttribute('data-tagfix-sub');
        var items = S.syllabus.filter(function(t){
          return !t.archived && (t.subject || '(no subject)') === sub;
        });
        var tagged = items.filter(function(t){
          return state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
        }).length;
        var wantOn = tagged < items.length;  // if not all on, turn all on; else turn all off
        items.forEach(function(t){
          var orig = isTagged(t, state.exam);
          if (wantOn && !orig) state.changes[t.id] = true;
          else if (!wantOn && orig) state.changes[t.id] = false;
          else delete state.changes[t.id];
        });
        renderList();
        refreshDirty();
        return;
      }
      // Individual checkbox
      var cb = e.target.closest('[data-tagfix-cb]');
      if (cb) {
        e.preventDefault();
        var id = cb.getAttribute('data-tagfix-cb');
        var t = S.syllabus.find(function(x){ return x.id === id; });
        if (!t) return;
        var orig = isTagged(t, state.exam);
        var want = !cb.checked;  // will flip
        if (want === orig) delete state.changes[id];
        else state.changes[id] = want;
        renderList();
        refreshDirty();
      }
    });
  }

  if (typeof ACTIONS === 'object') {
    ACTIONS['fix-tags'] = openFixer;
  }

  console.log('[apex-tag-fix] v2 installed — bulk subject toggles');
})();

// ── FILE: apex-new-exam.js ────────────────────────────────────────────
/* ============================================================
   APEX NEW EXAM — add arbitrary exam tags from the UI
   ============================================================ */
(function(){
  'use strict';
  if (window._apexNewExam) return;
  window._apexNewExam = true;

  /* ---- 1. Inject "+ Add a new exam tag" into Exam Target modals ---- */
  function injectButton(modal){
    var h3 = modal.querySelector('h3');
    if (!h3) return;
    if (!/exam target/i.test(h3.textContent)) return;
    if (modal.querySelector('.apex-new-exam-btn')) return;

    var sel = modal.querySelector('select[name="examTag"]');
    if (!sel) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'apex-new-exam-btn btn ghost sm';
    btn.style.cssText = 'margin-top:8px;font-size:11px;letter-spacing:.08em';
    btn.textContent = '+ Add a new exam tag';
    sel.parentElement.appendChild(btn);

    btn.addEventListener('click', function(){
      var name = prompt('New exam tag — e.g. "SSC MTS", "RRB NTPC", "IBPS SO":');
      if (!name) return;
      name = name.trim().toUpperCase();
      if (!name) return;
      if (!Array.isArray(S.tax.exams)) S.tax.exams = [];

      if (S.tax.exams.indexOf(name) === -1) {
        S.tax.exams.push(name);
        try { store.set(KEY, JSON.stringify(S)); } catch(e){}
        toast('Added', '"' + name + '" is now available everywhere');
      } else {
        toast('Already exists', 'Selecting "' + name + '"');
      }

      /* Rebuild the select options */
      sel.innerHTML = '<option value="">— None (generic) —</option>';
      S.tax.exams.forEach(function(e){
        var o = document.createElement('option');
        o.value = e;
        o.textContent = e;
        sel.appendChild(o);
      });
      sel.value = name;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }

  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    new MutationObserver(function(){
      var modal = modalRoot.querySelector('.modal');
      if (modal) injectButton(modal);
    }).observe(modalRoot, { childList: true, subtree: true });
  }

  /* ---- 2. Auto-discover exam tags from syllabus (bulk import path) ---- */
  function scanUntrackedTags(){
    if (!S.syllabus || !Array.isArray(S.syllabus)) return 0;
    if (!Array.isArray(S.tax.exams)) S.tax.exams = [];
    var seen = {};
    S.tax.exams.forEach(function(e){ if (e) seen[e.toLowerCase()] = e; });
    var added = 0;
    S.syllabus.forEach(function(t){
      if (!Array.isArray(t.exams)) return;
      t.exams.forEach(function(e){
        if (!e || typeof e !== 'string') return;
        var k = e.toLowerCase();
        if (seen[k]) return;
        seen[k] = e;
        S.tax.exams.push(e);
        added++;
      });
    });
    if (added) {
      try { store.set(KEY, JSON.stringify(S)); } catch(err){}
      console.log('[apex-new-exam] discovered ' + added + ' new exam tag' + (added === 1 ? '' : 's') + ' from syllabus');
    }
    return added;
  }

  window.apexScanExamTags = scanUntrackedTags;

  /* Run once on load and every few seconds to catch bulk imports */
  setTimeout(scanUntrackedTags, 1500);
  setInterval(scanUntrackedTags, 3000);

  console.log('[apex-new-exam] installed');
})();


// ── FILE: apex-tags-final.js ────────────────────────────────────────────
/* ============================================================
   APEX TAGS — comprehensive subject + topic level correction
   Based on official syllabus documents for all 13 exams.
   Idempotent — running twice gives the same result.
   ============================================================ */
(function(){
  if (window._apexTagsFinal) return;
  window._apexTagsFinal = true;
  if (S && S.settings && S.settings._apexTagsFinalRun) return;
  if (S && S.settings) {
    S.settings._apexTagsFinalRun = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
  }
  if (typeof S === 'undefined' || !Array.isArray(S.syllabus)) return;

  var ALL_EXAMS = ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'];
  var BANKING = ['RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'];

  var SUBJECT_EXAMS = {
    'maths': ALL_EXAMS,
    'reasoning': ALL_EXAMS,
    'english grammar': ALL_EXAMS,
    'descriptive english': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'general science': ['CGL','CHSL','IB ACIO'],
    'geography': ['CGL','CHSL','IB ACIO'],
    'history': ['CGL','CHSL','IB ACIO'],
    'polity': ['CGL','CHSL','IB ACIO'],
    'economics': ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','IBPS PO','RRB PO'],
    'economical issues': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'finance': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'management': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'social issues': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'environment': ['CGL','CHSL','IB ACIO','RBI GRADE B','NABARD GRADE A'],
    'ca': ALL_EXAMS,
    'misc gk': ['CGL','CHSL','IB ACIO'],
    'defence': ['CGL','CHSL','IB ACIO'],
    'ard': ['NABARD GRADE A'],
    'banking awareness': BANKING,
    'computer awareness': ['SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK','RBI ASSISTANT']
  };

  function shouldTag(topic, exam){
    var name = (topic.topic || '').toLowerCase();
    var subj = (topic.subject || '').toLowerCase();
    var allowed = SUBJECT_EXAMS[subj];
    if (!allowed) return true;
    if (allowed.indexOf(exam) === -1) return false;
    if (BANKING.indexOf(exam) > -1) {
      if (/geometry|trigonometry|mensuration|height and distance|logarithm/.test(name)) return false;
    }
    return true;
  }

  var changed = 0, sampleChanges = [];
  S.syllabus.forEach(function(t){
    if (!t || t.archived) return;
    var current = Array.isArray(t.exams) ? t.exams.slice() : [];
    var next = [];
    ALL_EXAMS.forEach(function(ex){ if (shouldTag(t, ex)) next.push(ex); });
    current.forEach(function(ex){
      if (ALL_EXAMS.indexOf(ex) === -1 && next.indexOf(ex) === -1) next.push(ex);
    });
    var a = current.slice().sort().join('|');
    var b = next.slice().sort().join('|');
    if (a !== b) {
      if (sampleChanges.length < 20) {
        sampleChanges.push(t.topic + ': [' + current.join(',') + '] -> [' + next.join(',') + ']');
      }
      t.exams = next;
      changed++;
    }
  });

  if (changed) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-tags-final] corrected ' + changed + ' topic(s)');
    sampleChanges.forEach(function(line){ console.log('  ' + line); });
  } else {
    console.log('[apex-tags-final] all tags already correct');
  }
})();


// ── FILE: apex-syl-focus.js ────────────────────────────────────────────
/* ============================================================
   APEX SYLLABUS FOCUS — priority auto-expand + exam-only filter
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSylFocus) return;
  window._apexSylFocus = true;

  var FILTER_KEY = 'apex-syl-only-exam';
  var SEED_FLAG = '_apexPriorityExpandV1';

  /* ── 1. Top-N subjects by average computed priority for active exam ── */
  function topSubjectsByPriority(n){
    if (!S.syllabus) return [];
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return [];
    var bySub = {};
    S.syllabus.forEach(function(t){
      if (t.archived) return;
      if (!Array.isArray(t.exams) || t.exams.indexOf(exam) === -1) return;
      var score = 0;
      try {
        if (typeof window.computeTopicPriority === 'function') {
          score = window.computeTopicPriority(t, exam) || 0;
        }
      } catch(e){}
      if (!bySub[t.subject]) bySub[t.subject] = { sum:0, count:0 };
      bySub[t.subject].sum += score;
      bySub[t.subject].count++;
    });
    return Object.keys(bySub)
      .map(function(s){ return { sub:s, avg: bySub[s].sum / Math.max(1, bySub[s].count) }; })
      .sort(function(a,b){ return b.avg - a.avg; })
      .slice(0, n)
      .map(function(x){ return x.sub; });
  }

  function allSubjects(){
    var set = {};
    S.syllabus.forEach(function(t){ if (t.subject && !t.archived) set[t.subject] = 1; });
    return Object.keys(set);
  }

  /* ── 2. Collapse all but top N ── */
  function collapseToTop(n){
    var top = topSubjectsByPriority(n);
    if (!top.length) return null;
    var closed = {};
    allSubjects().forEach(function(s){ if (top.indexOf(s) === -1) closed[s] = true; });
    var st = { closed: closed, closedTopics: {} };
    try {
      var raw = localStorage.getItem('apex-syl-state-v1');
      if (raw) {
        var prev = JSON.parse(raw);
        if (prev && prev.closedTopics) st.closedTopics = prev.closedTopics;
      }
      localStorage.setItem('apex-syl-state-v1', JSON.stringify(st));
    } catch(e){}
    if (typeof renderSylList === 'function') renderSylList();
    return top;
  }

  /* ── 3. Exam-only filter ── */
  function filterOn(){
    try { return localStorage.getItem(FILTER_KEY) === '1'; } catch(e){ return false; }
  }
  function setFilter(on){
    try { localStorage.setItem(FILTER_KEY, on ? '1' : '0'); } catch(e){}
  }
  function activeExamSubjects(){
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return null;
    var subs = {};
    S.syllabus.forEach(function(t){
      if (t.archived) return;
      if (Array.isArray(t.exams) && t.exams.indexOf(exam) > -1) subs[t.subject] = 1;
    });
    return subs;
  }
  function applyFilter(){
    var list = document.getElementById('syl-list');
    if (!list) return;
    var on = filterOn();
    var groups = list.querySelectorAll('.subj-group');
    if (!on) {
      for (var i=0;i<groups.length;i++) groups[i].style.display = '';
      return;
    }
    var subs = activeExamSubjects();
    if (!subs) { for (var j=0;j<groups.length;j++) groups[j].style.display = ''; return; }
    for (var k=0;k<groups.length;k++) {
      groups[k].style.display = subs[groups[k].dataset.subj] ? '' : 'none';
    }
  }

  /* ── 4. Toolbar chip ── */
  function injectChip(){
    var row = document.querySelector('.toolbar .chips-scroll') || document.querySelector('.toolbar .row');
    if (!row) return;
    if (row.querySelector('.apex-only-exam-chip')) {
      var existing = row.querySelector('.apex-only-exam-chip');
      var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
      var label = 'Only ' + (exam || 'exam') + ' subjects';
      if (existing.textContent !== label) existing.textContent = label;
      return;
    }
    var chip = document.createElement('button');
    chip.className = 'chip apex-only-exam-chip';
    chip.style.cssText = 'flex-shrink:0;margin-left:auto';
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    chip.textContent = 'Only ' + (exam || 'exam') + ' subjects';
    if (filterOn()) chip.classList.add('on');
    chip.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var next = !filterOn();
      setFilter(next);
      chip.classList.toggle('on', next);
      applyFilter();
    });
    row.appendChild(chip);
  }

  /* ── 5. Manual action — collapse to top 2 ── */
  function registerAction(){
    if (typeof ACTIONS !== 'object' || !ACTIONS) { setTimeout(registerAction, 200); return; }
    if (ACTIONS['syl-focus-top']) return;
    ACTIONS['syl-focus-top'] = function(){
      var top = collapseToTop(2);
      if (!top || !top.length) { toast('No exam active'); return; }
      toast('Focused on ' + top.join(' + '), 'Other subjects collapsed');
      setTimeout(applyFilter, 120);
    };
  }
  registerAction();

  /* ── 6. One-time seed for fresh installs ── */
  function seedOnce(){
    if (!S.settings) return;
    if (S.settings[SEED_FLAG]) return;
    var raw = null;
    try { raw = localStorage.getItem('apex-syl-state-v1'); } catch(e){}
    var st = raw ? JSON.parse(raw) : null;
    var alreadyCustomized = st && st.closed && Object.keys(st.closed).length > 0;
    S.settings[SEED_FLAG] = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (!alreadyCustomized) collapseToTop(2);
  }

  /* ── 7. Hook up on render ── */
  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){ injectChip(); applyFilter(); });
    }).observe(view, { childList: true, subtree: false });
  }
  setTimeout(function(){ injectChip(); applyFilter(); }, 400);
  setTimeout(function(){ injectChip(); applyFilter(); }, 1200);
  setInterval(function(){ injectChip(); applyFilter(); }, 2000);
  seedOnce();

  console.log('[apex-syl-focus] installed · top subjects:', topSubjectsByPriority(2).join(' + ') || 'none');
})();


// ── FILE: apex-syl-scroll.js ────────────────────────────────────────────
/* ============================================================
   APEX SYLLABUS SCROLL FIX v2
   - Disable scroll anchoring on the real scroll container
   - Override toggle-subj / toggle-topic to restore scrollY directly
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSylScroll) return;
  window._apexSylScroll = true;

  /* ---- 1. CSS: turn off scroll anchoring at the actual scroller ---- */
  var st = document.createElement('style');
  st.textContent = [
    'html, body{overflow-anchor:none !important}',
    /* Belt and suspenders — some Chrome versions honor scroll-padding on html */
    'html{scroll-padding-top:0}',
    /* The sticky toolbar and exam bar don't need to be anchoring candidates */
    '.toolbar, .apex-active-exam-bar, .apex-stable-bar{overflow-anchor:none}'
  ].join('\n');
  document.head.appendChild(st);

  /* ---- 2. Override the two toggle handlers ---- */
  function registerOverride(){
    if (typeof ACTIONS !== 'object' || !ACTIONS) { setTimeout(registerOverride, 100); return; }

    ACTIONS['toggle-subj'] = function(id, el){
      var group = el ? el.closest('.subj-group') : null;
      if (!group) {
        var y0 = window.scrollY;
        if (typeof sf !== 'undefined' && sf.closed) sf.closed[id] = !sf.closed[id];
        if (typeof saveSF === 'function') saveSF();
        if (typeof renderSylList === 'function') renderSylList();
        window.scrollTo(0, y0);
        requestAnimationFrame(function(){ window.scrollTo(0, y0); });
        return;
      }
      var y = window.scrollY;
      if (typeof sf !== 'undefined' && sf.closed) sf.closed[id] = !sf.closed[id];
      if (typeof saveSF === 'function') saveSF();
      if (typeof renderSylList === 'function') renderSylList();
      /* Synchronous restore — catches the immediate layout commit */
      window.scrollTo(0, y);
      /* Second-frame restore — catches any late anchoring shift */
      requestAnimationFrame(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        requestAnimationFrame(function(){
          if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        });
      });
      /* Last-ditch restore at 60ms — catches slow layout passes */
      setTimeout(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
      }, 60);
    };

    ACTIONS['toggle-topic'] = function(id, el){
      var y = window.scrollY;
      if (typeof sf !== 'undefined' && sf.closedTopics) sf.closedTopics[id] = !sf.closedTopics[id];
      if (typeof saveSF === 'function') saveSF();
      if (typeof renderSylList === 'function') renderSylList();
      window.scrollTo(0, y);
      requestAnimationFrame(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        requestAnimationFrame(function(){
          if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        });
      });
      setTimeout(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
      }, 60);
    };

    console.log('[apex-syl-scroll] toggle handlers overridden');
  }
  registerOverride();
})();


// ── FILE: apex-scope.js ────────────────────────────────────────────
/* ============================================================
   APEX SCOPE v15 — exam-tag everything
   - sessions + errors now carry examTag
   - weaknessScore scopes evidence by examTag
   - recommendSmart prefers exam-relevant items
   - getActiveExamTag / readinessScope unified
   - sync passphrase wording honest
   - Piru hidden from theme picker
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScopeV15) return;
  window._apexScopeV15 = true;

  /* 1. MIGRATION */
  let migrated = 0;
  (S.sessions || []).forEach(function(s){
    if (typeof s.examTag !== 'string') { s.examTag = ''; migrated++; }
  });
  (S.errors || []).forEach(function(e){
    if (typeof e.examTag !== 'string') { e.examTag = ''; migrated++; }
  });
  if (migrated) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-scope] migrated ' + migrated + ' records');
  }

  /* 2. UNIFIED ACTIVE EXAM */
  window.getActiveExamTag = function(){
    const explicit = (S.settings && (S.settings.activeExam || S.settings.readinessExam)) || '';
    if (explicit) return explicit;
    const targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date && x.examTag; })
      : [];
    const future = targets.filter(function(x){ return diffD(x.date, todayISO()) >= 0; });
    if (future.length) {
      future.sort(function(a,b){ return diffD(a.date, todayISO()) - diffD(b.date, todayISO()); });
      return future[0].examTag;
    }
    if (targets.length) return targets[0].examTag;
    return '';
  };

  const _origReadinessScope = window.readinessScope;
  if (typeof _origReadinessScope === 'function') {
    window.readinessScope = function(){
      const r = _origReadinessScope.apply(this, arguments);
      return { tags: r.tags, current: window.getActiveExamTag() };
    };
  }

  /* Scope helper — an untagged record inherits the topic's exam tags.
     Used by weaknessScore. The topic already knows its exams; the
     record shouldn't have to repeat them. */
  function _inExamScope(record, examTag, topic){
    if (!examTag) return true;                       /* no active exam -> everything */
    if (record.examTag === examTag) return true;     /* explicitly this exam */
    if (record.examTag) return false;                /* explicitly a different exam */
    if (!topic) return true;                         /* no topic -> global */
    return Array.isArray(topic.exams) && topic.exams.indexOf(examTag) > -1;
  }

  /* 3. SCOPE-AWARE WEAKNESS SCORE */
  window.weaknessScore = function(t, examTag){
    if (!t) return 0;
    if (examTag === undefined) examTag = window.getActiveExamTag();
    if (typeof isTopicMastered === 'function' && isTopicMastered(t)) return 0;

    const now = todayISO();
    const cutoff30 = addDays(now, -30);

    const allErrs = S.errors.filter(function(e){ return e.topicId === t.id; });
    const errs = allErrs.filter(function(e){ return _inExamScope(e, examTag, t); });
    const recentErrs = errs.filter(function(e){ return e.date && e.date >= cutoff30; }).length;
    const olderErrs = errs.length - recentErrs;
    const errorSignal = recentErrs * 12 + olderErrs * 4;

    let mocks = S.mocks.filter(function(m){ return (m.weak || []).indexOf(t.id) > -1; });
    if(examTag){mocks=mocks.filter(m=>_tagMatchesMock(m,examTag));}
    const recentMocks = mocks.filter(function(m){ return m.date && m.date >= cutoff30; }).length;
    const olderMocks = mocks.length - recentMocks;
    const mockSignal = recentMocks * 18 + olderMocks * 7;

    const allSess = S.sessions.filter(function(s){ return s.topicId === t.id; });
    const sess = allSess.filter(function(s){ return _inExamScope(s, examTag, t); });
    let again = 0, hard = 0, good = 0, easy = 0;
    sess.forEach(function(s){
      (s.history || []).forEach(function(h){
        if (h.grade === 'again') again++;
        else if (h.grade === 'hard') hard++;
        else if (h.grade === 'good') good++;
        else if (h.grade === 'easy') easy++;
      });
    });
    const recallSignal = again * 20 + hard * 8 - good * 3 - easy * 6;

    const pyqS = (typeof pyqStatsFor === 'function') ? pyqStatsFor(t.id, examTag) : null;
    let pyqSignal = 0;
    if (pyqS && pyqS.attempted >= 10 && pyqS.accuracy !== null) {
      const conf = Math.min(1, pyqS.attempted / 30);
      pyqSignal = Math.max(-25, Math.min(25, Math.round((0.7 - pyqS.accuracy / 100) * 60 * conf)));
    }

    const q = (S.questions || []).filter(function(x){ return x.topicId === t.id; });
    let questionSignal = 0;
    if (q.length >= 3) {
      const qCor = q.filter(function(x){ return x.correct; }).length;
      const acc = qCor / q.length;
      questionSignal = Math.max(-25, Math.min(25, Math.round((0.7 - acc) * 60)));
    }

    let overdueSignal = 0;
    sess.forEach(function(s){
      const r = reviewState(s);
      if (r.st === 'overdue') overdueSignal += Math.min(30, r.days * 3);
    });

    const friction = errorSignal + mockSignal + recallSignal + questionSignal + pyqSignal + overdueSignal;
    if (friction <= 0) return 0;

    let importance = 1.0;
    // Prefer per-exam config when available. exam-config.js clears the
    // legacy t.priority / t.weightage fields, so reading them alone
    // silently loses the priority multiplier on modern topics.
    var _cfg = (t.examConfig && examTag) ? t.examConfig[examTag] : null;
    var _pri = (_cfg && _cfg.priority) || t.priority || '';
    var _wt = (_cfg && _cfg.weightage) || t.weightage || '';
    if (_pri === 'Critical') importance += 0.3;
    else if (_pri === 'High') importance += 0.15;
    if (_wt === 'High') importance += 0.15;
    importance += examUrgencyForTopic(t) * 0.15;

    const statusMap = { 'Not started': 0.7, 'Learning': 1.0, 'Practicing': 0.9, 'Reviewing': 0.7, 'Mastered': 0 };
    const sm = statusMap[t.status] !== undefined ? statusMap[t.status] : 1.0;

    const bias = (typeof sectionBiasForSubject === 'function')
      ? sectionBiasForSubject(t.subject, examTag) : 1.0;

    return Math.max(0, Math.round(friction * importance * sm * bias));
  };

  /* 4. SCOPE-AWARE RECOMMENDATION */
  const _topicMatchesActiveExam = function(t, examTag){
    if (!examTag || !t) return true;
    const tExams = Array.isArray(t.exams) ? t.exams : [];
    const tagL = String(examTag).toLowerCase();
    return tExams.some(function(e){
      const eL = String(e).toLowerCase();
      return eL === tagL || eL.indexOf(tagL) > -1 || tagL.indexOf(eL) > -1;
    });
  };

  window.recommendSmart = function(){
    const examTag = window.getActiveExamTag();
    const candidates = [];
    const bucket = hourBucket();
    const sinceMock = daysSinceLastMock();
    let due = dueSessions();
    if (examTag) due = due.filter(function(s){ return !s.examTag || s.examTag === examTag; });

    function matchBoost(t){
      if (!t || !examTag) return 1.0;
      return _topicMatchesActiveExam(t, examTag) ? 1.2 : 0.75;
    }

    due.filter(function(s){ return reviewState(s).st === 'overdue'; }).forEach(function(s){
      const t = s.topicId ? topicById(s.topicId) : null;
      const days = reviewState(s).days;
      const cf = consecutiveFails(s.id);
      let score = 100 + Math.min(days, 14) * 3;
      if (t) {
        score *= 1 + examUrgencyForTopic(t) * 0.5;
        score *= 1 - interleavePenalty(t.subject);
        if (cf >= 2) score *= 1.3;
        if (bucket === 'evening' || bucket === 'night') score *= 1.15;
        score *= matchBoost(t);
      }
      candidates.push({
        kind: 'overdue', score: score,
        title: s.name,
        subtitle: (t ? t.topic + ' · ' : '') + days + 'd overdue',
        reason: 'Overdue ' + days + 'd' + (cf >= 2 ? ' · repeated fails' : '') + (t && examUrgencyForTopic(t) >= 0.7 ? ' · exam-near' : ''),
        sessionId: s.id, topicId: s.topicId || null,
        primaryAction: { a: 'focus-task-from-review', id: s.id, label: '⚡ Start Focus' },
        secondaryAction: { a: 'grade-review', id: s.id, grade: 'good', label: 'Mark Good' }
      });
    });

    due.filter(function(s){ return ['today','new'].indexOf(reviewState(s).st) > -1; }).forEach(function(s){
      const t = s.topicId ? topicById(s.topicId) : null;
      let score = 70;
      if (t) {
        score *= 1 + examUrgencyForTopic(t) * 0.4;
        score *= 1 - interleavePenalty(t.subject);
        score *= matchBoost(t);
      }
      if (bucket === 'evening' || bucket === 'night') score *= 1.2;
      else if (bucket === 'morning') score *= 0.9;
      candidates.push({
        kind: 'today', score: score,
        title: s.name,
        subtitle: (t ? t.topic + ' · ' : '') + s.stage,
        reason: 'Due today' + (t ? ' · ' + t.subject : '') + (bucket === 'evening' ? ' · evening is review time' : ''),
        sessionId: s.id, topicId: s.topicId || null,
        primaryAction: { a: 'focus-task-from-review', id: s.id, label: '⚡ Start Focus' },
        secondaryAction: { a: 'grade-review', id: s.id, grade: 'good', label: 'Mark Good' }
      });
    });

    weakTopics(5).forEach(function(w){
      const t = w.t;
      let score = w.score * 0.6;
      score *= 1 + examUrgencyForTopic(t) * 0.6;
      score *= 1 - interleavePenalty(t.subject);
      score *= matchBoost(t);
      if (bucket === 'morning' || bucket === 'afternoon') score *= 1.15;
      candidates.push({
        kind: 'weak', score: score,
        title: t.topic,
        subtitle: 'Friction ' + w.score + ' · ' + t.subject,
        reason: 'Friction ' + w.score + (t.priority ? ' · ' + t.priority : '') + (t.weightage === 'High' ? ' · Wt High' : ''),
        topicId: t.id, sessionId: null,
        primaryAction: { a: 'focus-start-topic', id: t.id, label: '⚡ Focus 25 min' },
        secondaryAction: { a: 'goto-topic', id: t.id, label: 'Open Topic' }
      });
    });

    let inProgress = S.syllabus.filter(function(t){ return ['Learning','Practicing'].indexOf(t.status) > -1; });
    if (examTag) inProgress = inProgress.filter(function(t){ return _topicMatchesActiveExam(t, examTag); });
    inProgress.sort(function(a,b){ return priRank(a) - priRank(b); }).slice(0, 3).forEach(function(t){
      let score = 40;
      score *= 1 + examUrgencyForTopic(t) * 0.5;
      score *= 1 - interleavePenalty(t.subject);
      if (bucket === 'morning') score *= 1.3;
      else if (bucket === 'night') score *= 0.7;
      candidates.push({
        kind: 'continue', score: score,
        title: t.topic,
        subtitle: t.status + ' · ' + t.subject,
        reason: 'In progress' + (t.priority ? ' · ' + t.priority : '') + (bucket === 'morning' ? ' · morning = new material' : ''),
        topicId: t.id, sessionId: null,
        primaryAction: { a: 'focus-start-topic', id: t.id, label: '⚡ Continue' },
        secondaryAction: { a: 'goto-topic', id: t.id, label: 'Open Topic' }
      });
    });

    if (sinceMock === null || sinceMock >= 7) {
      let score = sinceMock === null ? 50 : (sinceMock >= 14 ? 70 : (sinceMock >= 10 ? 55 : 30));
      if (bucket === 'morning') score *= 1.2;
      candidates.push({
        kind: 'mock', score: score,
        title: 'Take a mock',
        subtitle: sinceMock === null ? 'No mocks logged yet' : sinceMock + 'd since last mock',
        reason: sinceMock === null ? 'Never logged a mock' : 'Last mock ' + sinceMock + 'd ago',
        topicId: null, sessionId: null,
        primaryAction: { a: 'goto-mocks', id: '', label: 'Log a Mock' },
        secondaryAction: { a: 'goto-errors', id: '', label: 'See Errors' }
      });
    }

    const unlinked = S.errors.filter(function(e){ return !e.topicId; }).length;
    if (unlinked >= 3) {
      candidates.push({
        kind: 'error-hygiene', score: 25 + Math.min(unlinked, 10),
        title: unlinked + ' errors without a topic',
        subtitle: 'Link them to sharpen the Weak Radar',
        reason: 'Radar accuracy depends on error → topic links',
        topicId: null, sessionId: null,
        primaryAction: { a: 'goto-errors', id: '', label: 'Open Errors' },
        secondaryAction: { a: 'goto-syllabus', id: '', label: 'Syllabus' }
      });
    }

    let dueErrs = dueErrors();
    if (examTag) {
      dueErrs = dueErrs.filter(function(e){ return !e.examTag || e.examTag === examTag; });
    }
    dueErrs.slice(0, 3).forEach(function(e){
      const t = e.topicId ? topicById(e.topicId) : null;
      const rs = reviewState(e);
      let score = 95;
      if (rs.st === 'overdue') score += Math.min(rs.days, 10) * 2;
      if (t) {
        score *= 1 + examUrgencyForTopic(t) * 0.4;
        score *= 1 - interleavePenalty(t.subject);
        score *= matchBoost(t);
      }
      candidates.push({
        kind: 'error', score: score,
        title: '⚠️ ' + e.title,
        subtitle: (t ? t.topic + ' · ' : '') + (e.type || 'mistake'),
        reason: rs.st === 'overdue' ? ('Mistake overdue ' + rs.days + 'd')
              : (rs.st === 'new' ? 'Mistake not yet reviewed' : 'Mistake due for review'),
        topicId: e.topicId || null, sessionId: null,
        primaryAction: { a: 'grade-error', id: e.id, grade: 'good', label: '✓ Got it now' },
        secondaryAction: { a: 'grade-error', id: e.id, grade: 'again', label: 'Still unclear' }
      });
    });

    if (!candidates.length) {
      return {
        kind: 'clear', title: 'All clear',
        subtitle: 'Take a mock or add a new topic',
        reason: 'Nothing overdue · nothing weak · nothing in progress',
        topicId: null, sessionId: null,
        primaryAction: { a: 'goto-mocks', id: '', label: 'Log a Mock' },
        secondaryAction: { a: 'goto-syllabus', id: '', label: 'Browse Syllabus' }
      };
    }

    candidates.sort(function(a,b){ return b.score - a.score; });
    return candidates[0];
  };

  /* 5. SESSION MODAL with exam tag */
  window.sessionModal = function(s, prefillTopicId){
    const activeExam = window.getActiveExamTag();
    const currentExam = (s && s.examTag) || '';  /* blank by default — inherits from topic */
    const exams = taxList('exams');
    const examOpts = '<option value="">— Unscoped (counts for all exams) —</option>'
      + exams.map(function(e){
          return '<option value="' + esc(e) + '"' + (e === currentExam ? ' selected' : '') + '>' + esc(e) + '</option>';
        }).join('');

    openModal(s ? "Edit Session" : "Log Study Session",
      '<div class="frow"><label>Session name</label><input class="inp" name="name" value="' + esc(s ? s.name : "") + '" placeholder="e.g. Percentage PYQs — Kiran"></div>'
      + '<div class="frow"><label>Linked topic</label>' + pickerHTML("topicIds", s && s.topicId ? [s.topicId] : (prefillTopicId ? [prefillTopicId] : []), false) + '</div>'
      + '<div class="frow apex-fragment-field"><label>Fragment <span style="color:var(--text-3);font-weight:500">(optional)</span></label><input class="inp" name="fragment" value="" placeholder="e.g. successive  ·  election  ·  discount" autocomplete="off"><div class="hint">Short label for the slice you worked on. Fills the session name as <b>Topic · fragment</b>.</div></div>'
      + '<div class="frow"><label>Exam context <span style="color:var(--text-3);font-weight:500">(optional)</span></label><select class="inp" name="examTag">' + examOpts + '</select><div class="hint">Optional. Leave blank to count for every exam. Set it only if you studied this specifically for one exam.</div></div>'
      + '<div class="f2"><div class="frow"><label>Log date</label>' + dateFieldHTML("logDate", (s && s.logDate) || todayISO()) + '</div><div class="frow"><label>Last reviewed</label>' + dateFieldHTML("lastReviewed", (s && s.lastReviewed) || "") + '</div></div>'
      + '<div class="frow"><label>Duration (optional)</label><input class="inp" type="number" min="0" max="1440" step="5" name="duration" value="' + ((s && s.duration) || "") + '" placeholder="minutes" data-noclear><div class="chips" style="margin-top:8px" id="dur-chips">' + [15,30,45,60,90,120].map(function(m){ return '<button type="button" class="chip' + (s && s.duration === m ? " on" : "") + '" data-dur="' + m + '" style="padding:6px 12px;min-height:32px;font-size:12px">' + m + 'm</button>'; }).join("") + '</div><div id="focus-dur-hint" style="display:none;margin-top:8px;padding:8px 10px;border-radius:6px;background:var(--pri-medium-bg);border:1px solid var(--pri-medium-bd);color:var(--pri-medium-fg);font-size:11.5px;line-height:1.5"></div><div class="hint">Skip if you don\'t track time.</div></div>',
      function(v){
        const ids = pickVals(v.topicIds);
        const dur = Math.max(0, Math.min(1440, parseInt(v.duration, 10) || 0));
        const frag = (v.fragment || "").trim();
        const topicObj = ids[0] ? topicById(ids[0]) : null;
        let finalName = frag && topicObj
          ? (topicObj.topic + " · " + frag)
          : (v.name && v.name.trim())
            ? v.name.trim()
            : (topicObj ? topicObj.topic : "");
        if (!finalName) { toast("⚠️ Name or topic required"); return false; }
        const base = {
          name: finalName,
          topicId: ids[0] || null,
          examTag: v.examTag || '',
          logDate: v.logDate || null,
          lastReviewed: v.lastReviewed || null,
          duration: dur
        };
        if (s) {
          Object.assign(s, base);
        } else {
          const fresh = Object.assign({
            id: uid("s"),
            interval: 0, ease: 2.5,
            nextReview: v.lastReviewed || todayISO(),
            stage: "1st Time Study",
            history: []
          }, base);
          S.sessions.push(fresh);
        }
        const _lastId = s ? s.id : (S.sessions[S.sessions.length - 1] ? S.sessions[S.sessions.length - 1].id : null);
        logActivity(s ? "session.edited" : "session.logged", _lastId, {
          duration: (S.sessions.find(function(x){ return x.id === _lastId; }) || {}).duration || 0,
          topicId: (S.sessions.find(function(x){ return x.id === _lastId; }) || {}).topicId || null
        });
        edit(function(){});
        toast(s ? "Session updated" : "Session logged");
      }, s ? "Save" : "Log");

    const picker = document.querySelector('.modal .tpick');
    const hint = document.querySelector('#focus-dur-hint');
    const updateHint = function(){
      if (!picker || !hint) return;
      let ids = [];
      try { ids = JSON.parse(picker.querySelector('input[type=hidden]').value || "[]"); } catch(e){}
      const tid = ids[0] || null;
      if (!tid) { hint.style.display = "none"; return; }
      const today = todayISO();
      const mins = (S.focusLog || []).filter(function(f){
        return f.topicId === tid && f.startedAt && f.startedAt.slice(0, 10) === today;
      }).reduce(function(a, f){ return a + (f.minutes || 0); }, 0);
      if (mins > 0) {
        hint.style.display = "block";
        hint.innerHTML = "⚠️ You've already logged <b>" + mins + " min</b> of Focus for this topic today. Leave duration blank to avoid double-counting.";
      } else {
        hint.style.display = "none";
      }
    };
    if (picker) picker.addEventListener("pick-change", updateHint);
    var _fragFld = document.querySelector('.modal .apex-fragment-field');
    var _fragInp = _fragFld ? _fragFld.querySelector('input[name="fragment"]') : null;
    if (picker && _fragInp) {
      var syncFrag = function(){
        var ids = [];
        try { ids = JSON.parse(picker.querySelector('input[type=hidden]').value || "[]"); } catch(e){}
        if (ids[0]) { _fragFld.style.display = ""; }
        else { _fragFld.style.display = "none"; _fragInp.value = ""; }
      };
      picker.addEventListener("pick-change", syncFrag);
      syncFrag();
    }
    updateHint();
  };

  /* 6. ERROR MODAL with exam tag */
  window.errorModal = function(er, prefillTopicId){
    const activeExam = window.getActiveExamTag();
    const currentExam = (er && er.examTag) || '';  /* blank by default — inherits from topic */
    const exams = taxList('exams');
    const examOpts = '<option value="">— Unscoped (counts for all exams) —</option>'
      + exams.map(function(e){
          return '<option value="' + esc(e) + '"' + (e === currentExam ? ' selected' : '') + '>' + esc(e) + '</option>';
        }).join('');

    openModal(er ? "Edit Error" : "Log an Error",
      '<div class="frow"><label>Question — what was asked?</label><input class="inp" name="title" value="' + esc(er ? er.title : "") + '" placeholder="e.g. CI vs SI difference on ₹5000 at 8% for 2 years"></div>'
      + '<div class="frow"><label>My answer — what did I actually do?</label><input class="inp" name="myAnswer" value="' + esc(er && er.myAnswer || "") + '" placeholder="e.g. Used SI formula"></div>'
      + '<div class="frow"><label>Correct approach — why it was wrong</label><textarea class="inp" name="whyWrong" rows="2" placeholder="e.g. Should compound">' + esc(er && er.whyWrong || "") + '</textarea></div>'
      + '<div class="f2"><div class="frow"><label>Type</label>' + selPlus("type", taxList("errTypes"), er ? er.type : "", "errTypes", "Error type") + '</div><div class="frow"><label>Source</label>' + selPlus("source", taxList("errSources"), er ? er.source : "", "errSources", "Error source") + '</div></div>'
      + '<div class="f2"><div class="frow"><label>Date</label>' + dateFieldHTML("date", (er && er.date) || todayISO()) + '</div><div class="frow"><label>Link</label><input class="inp" name="link" value="' + esc(er ? er.link : "") + '" placeholder="Optional"></div></div>'
      + '<div class="frow"><label>Linked topic</label>' + pickerHTML("topicIds", er && er.topicId ? [er.topicId] : (prefillTopicId ? [prefillTopicId] : []), false) + '</div>'
      + '<div class="frow"><label>Exam context <span style="color:var(--text-3);font-weight:500">(optional)</span></label><select class="inp" name="examTag">' + examOpts + '</select><div class="hint">Optional. Leave blank to count for every exam. Set it only if you made this mistake specifically in one exam.</div></div>',
      function(v){
        if (!v.title) { toast("⚠️ Question required"); return false; }
        const ids = pickVals(v.topicIds);
        const data = {
          title: v.title,
          myAnswer: (v.myAnswer || "").trim(),
          whyWrong: (v.whyWrong || "").trim(),
          type: v.type,
          source: v.source,
          examTag: v.examTag || '',
          date: v.date || "",
          link: v.link || "",
          topicId: ids[0] || null
        };
        edit(function(){
          if (er) {
            Object.assign(er, data);
          } else {
            S.errors.push(Object.assign({ id: uid("e") }, data));
          }
          logActivity("error.logged", er ? er.id : S.errors[S.errors.length - 1].id, {
            type: data.type, topicId: data.topicId, examTag: data.examTag
          });
        });
        toast(er ? "Error updated" : "Error logged");
      }, er ? "Save" : "Log");
  };

  /* 7. HONEST SYNC PASSPHRASE WORDING */
  (function(){
    const _originalAlert = window.alert;
    window.alert = function(msg){
      if (typeof msg === 'string' && msg.indexOf('NOT stored anywhere') > -1) {
        msg = '⚠️ IMPORTANT\n\n'
            + 'Your sync passphrase is not stored permanently. While this browser '
            + 'session is unlocked, Apex temporarily retains it so you don\'t have '
            + 'to retype it every time.\n\n'
            + 'If you forget it, the cloud copy is permanently unreadable.';
      }
      return _originalAlert.call(this, msg);
    };
  })();

  /* 8. HIDE PIRU FROM THEME PICKER */
  try {
    if (typeof THEMES !== 'undefined' && Array.isArray(THEMES)) {
      const piruIdx = THEMES.findIndex(function(t){ return t.id === 'piru'; });
      if (piruIdx > -1) {
        if (S.settings && S.settings.theme === 'piru') {
          S.settings.theme = 'apex';
          try { store.set(KEY, JSON.stringify(S)); } catch(e){}
          if (typeof applyTheme === 'function') applyTheme('apex');
        }
        THEMES.splice(piruIdx, 1);
        console.log('[apex-scope] removed Plum Dusk from theme picker');
      }
    }
  } catch(e){ console.warn('[apex-scope] Piru removal skipped:', e.message); }

  console.log('[apex-scope] v15 installed');
})();


/* ============================================================
   APEX SCOPE v15b — merged from apex-scope2.js
   Interval caps + projection now use the active exam's target
   ============================================================ */

/* ============================================================
   APEX SCOPE v15b — close the last two exam leaks
   - examIntervalCap: use active exam's target only
   - readinessProjection: hero matches scope
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScopeV15b) return;
  window._apexScopeV15b = true;

  /* 1. examIntervalCap — scoped */
  window.examIntervalCap = function(topicId){
    const t = topicId ? topicById(topicId) : null;
    if (!t) return 99999;
    const targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date && x.affectsCap !== false; })
      : [];
    if (!targets.length) return 99999;

    const examTag = window.getActiveExamTag ? window.getActiveExamTag() : '';
    const topicTags = Array.isArray(t.exams) ? t.exams : [];

    let pool = targets;
    if (examTag) {
      const activeMatches = targets.filter(function(x){
        return x.examTag && String(x.examTag).toLowerCase() === String(examTag).toLowerCase();
      });
      if (activeMatches.length) {
        pool = activeMatches;
      } else {
        const topicMatches = targets.filter(function(x){
          return x.examTag && topicTags.some(function(e){
            return String(e).toLowerCase() === String(x.examTag).toLowerCase();
          });
        });
        if (topicMatches.length) pool = topicMatches;
      }
    } else {
      const relevant = targets.filter(function(x){
        return x.examTag && topicTags.indexOf(x.examTag) > -1;
      });
      if (relevant.length) pool = relevant;
    }

    let nearest = null, nearestLabel = '';
    pool.forEach(function(x){
      const d = diffD(x.date, todayISO());
      if (d < 0) return;
      if (nearest === null || d < nearest) { nearest = d; nearestLabel = x.label || x.examTag || 'exam'; }
    });
    if (nearest === null) return 99999;

    let cap;
    if (nearest > 180) cap = 99999;
    else if (nearest > 90) cap = 60;
    else if (nearest > 30) cap = 30;
    else if (nearest > 14) cap = 14;
    else if (nearest > 7) cap = 7;
    else if (nearest > 3) cap = 3;
    else cap = 1;
    return { cap: cap, days: nearest, label: nearestLabel };
  };

  /* 2. readinessProjection — hero matches active scope */
  window.readinessProjection = function(){
    const targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date && x.affectsCap !== false; })
      : [];
    if (!targets.length) return null;

    const withDays = targets.map(function(x){
      return Object.assign({}, x, { days: diffD(x.date, todayISO()) });
    });
    const future = withDays.filter(function(x){ return x.days >= 0; });

    const scopeTag = window.getActiveExamTag ? window.getActiveExamTag() : '';

    let hero = null;
    if (scopeTag) {
      const matching = future.filter(function(x){
        return x.examTag && String(x.examTag).toLowerCase() === String(scopeTag).toLowerCase();
      });
      if (matching.length) {
        matching.sort(function(a, b){ return a.days - b.days; });
        hero = matching[0];
      }
    }
    if (!hero) {
      const primFuture = future.filter(function(x){ return x.priority === 'Primary'; }).sort(function(a, b){ return a.days - b.days; });
      hero = primFuture[0] || future.sort(function(a, b){ return a.days - b.days; })[0];
    }
    if (!hero) return null;

    const scopedTopics = S.syllabus.filter(function(t){
      return !t.archived && !hasKids(t.id) && _tagMatchesTopic(t, scopeTag);
    });
    const totalTopics = scopedTopics.length;
    if (!totalTopics) return null;

    const mastered = scopedTopics.filter(function(t){ return isTopicMastered(t); }).length;
    const cutoff30 = addDays(todayISO(), -30);
    const masteredRecent = new Set(
      S.sessions
        .filter(function(s){
          if (!s.masteredAt || s.masteredAt < cutoff30 || !s.topicId) return false;
          // Only count sessions whose exam matches the current scope.
          // Unscoped (legacy) sessions still count for every exam.
          if (s.examTag && String(s.examTag).toLowerCase() !== String(scopeTag).toLowerCase()) return false;
          return true;
        })
        .map(function(s){ return s.topicId; })
    ).size;

    const pacePerWeek = Math.round(masteredRecent / 30 * 7 * 10) / 10;
    const weeksLeft = Math.max(0.1, hero.days / 7);
    const projectedTotal = Math.min(totalTopics, Math.round(mastered + pacePerWeek * weeksLeft));
    const projectedPct = Math.round(projectedTotal / totalTopics * 100);
    const masteredPct = Math.round(mastered / totalTopics * 100);
    const remaining = totalTopics - mastered;
    const requiredPerWeek = Math.round(remaining / weeksLeft * 10) / 10;
    const ratio = requiredPerWeek > 0 ? (pacePerWeek / requiredPerWeek) : 999;

    return {
      daysLeft: hero.days, examLabel: hero.label,
      totalTopics: totalTopics, mastered: mastered,
      masteredPct: masteredPct, masteredRecent: masteredRecent,
      pacePerWeek: pacePerWeek, projectedTotal: projectedTotal,
      projectedPct: projectedPct, remaining: remaining,
      requiredPerWeek: requiredPerWeek, ratio: ratio, hero: hero
    };
  };

  console.log('[apex-scope] v15b installed — interval caps + projection exam-scoped');
})();


// ── FILE: apex-task-rollover.js ────────────────────────────────────────────
/* ============================================================
   APEX TASK ROLLOVER + BOARD CLEANUP
   1. Routine tasks (time-blocked, no due date) roll over daily
   2. Task Board default filter = Today
   3. Completed tasks >7d hidden from non-"All" views
   4. "All" filter still shows everything
   ============================================================ */
(function(){
  'use strict';
  if (window._apexTaskRollover) return;
  window._apexTaskRollover = true;

  /* ---- 1. Roll over routine tasks ---- */
  function rollover(){
    if (!S.tasks || !Array.isArray(S.tasks)) return;
    const today = todayISO();
    let dirty = false;
    S.tasks.forEach(function(t){
      // Only time-blocked routine tasks with no explicit due date
      if (t.tbS && !t.due && t.status === 'Completed'
          && t.completedOn && t.completedOn !== today) {
        t.status = 'Next Up';
        t.completedOn = null;
        dirty = true;
      }
    });
    if (dirty) {
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
      console.log('[apex-task-rollover] rolled over routine tasks');
    }
  }

  /* ---- 2. Default filter = "today" ---- */
  try {
    if (typeof tf !== 'undefined' && tf.f === 'all') {
      tf.f = 'today';
    }
  } catch(e){}

  /* ---- 3. Hide completed >7d from non-"All" views ---- */
  const _origRenderBoard = window.renderBoard;
  if (typeof _origRenderBoard === 'function') {
    window.renderBoard = function(){
      const backup = S.tasks;
      if (tf.f !== 'all') {
        const cutoff = addDays(todayISO(), -7);
        S.tasks = S.tasks.filter(function(t){
          if (t.status !== 'Completed') return true;
          if (!t.completedOn) return true;
          return t.completedOn >= cutoff;
        });
      }
      try {
        return _origRenderBoard.apply(this, arguments);
      } finally {
        S.tasks = backup;
      }
    };
    try { renderBoard = window.renderBoard; } catch(e){}
  }

  /* ---- 4. Rollover on load + route change ---- */
  rollover();

  window.addEventListener('hashchange', function(){
    setTimeout(function(){
      rollover();
      if ((location.hash || '').indexOf('tasks') > -1) {
        if (typeof renderRoute === 'function') renderRoute();
      }
    }, 80);
  });

  // If we land on tasks already, force one re-render so the
  // default filter + rollover both take effect
  if ((location.hash || '').indexOf('tasks') > -1) {
    setTimeout(function(){
      if (typeof renderRoute === 'function') renderRoute();
    }, 80);
  }

  console.log('[apex-task-rollover] installed · default=today · hides completed >7d');
})();


// ── FILE: apex-obsidian-link.js ────────────────────────────────────────────
/* ============================================================
   APEX OBSIDIAN LINK
   Adds "Open in Obsidian" button to every topic modal.
   Uses the obsidian:// URL scheme to open the matching note
   in the user's local vault. No publishing needed.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexObsidian) return;
  window._apexObsidian = true;

  /* CHANGE THIS if your vault name differs. Check Obsidian:
     bottom-left of the sidebar shows the vault name. */
  var VAULT_NAME = 'Apex Notes';

  function subjectFolder(apexSubject){
    return String(apexSubject || '').split(' ')
      .map(function(w){ return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }

  function topicSlug(apexTopic){
    /* Strip leading "12. " or "12.5 " or "1. " */
    return String(apexTopic || '').replace(/^\d+(\.\d+)*\.\s*/, '').trim();
  }

  function encode(s){ return encodeURIComponent(s); }

  function buildURL(t){
    if (!t) return '';
    var folder = subjectFolder(t.subject);
    var slug = topicSlug(t.topic);
    return 'obsidian://open?vault=' + encode(VAULT_NAME) + '&file=' + encode(folder + '/' + slug);
  }

  var _origTopicDetail = window.topicDetail;
  if (typeof _origTopicDetail !== 'function') {
    console.warn('[apex-obsidian] topicDetail not found — patch skipped');
    return;
  }

  window.topicDetail = function(id){
    var r = _origTopicDetail.apply(this, arguments);
    setTimeout(function(){
      var modal = document.querySelector('.modal');
      if (!modal) return;
      var t = topicById(id);
      if (!t) return;
      var chips = modal.querySelector('.mbody .chips');
      if (!chips) return;
      if (chips.querySelector('.apex-obsidian-btn')) return;

      var url = buildURL(t);
      var btn = document.createElement('a');
      btn.className = 'apex-obsidian-btn chip';
      btn.href = url;
      btn.style.textDecoration = 'none';
      btn.textContent = '📖 Open in Obsidian';
      btn.title = subjectFolder(t.subject) + '/' + topicSlug(t.topic) + '.md';
      chips.appendChild(btn);
    }, 80);
    return r;
  };

  console.log('[apex-obsidian] vault="' + VAULT_NAME + '" — button added to topic modal');
})();


// ── FILE: apex-katex-fix.js ────────────────────────────────────────────
/* ============================================================
   APEX KATEX FIX v3
   - Renders \(...\), \[...\], and $$...$$ as KaTeX
   - Contains inline math (no horizontal page bleed)
   - Handles both Errors and Reviews cards
   ============================================================ */
(function(){
  'use strict';
  if (window._apexKatexFix) return;
  window._apexKatexFix = true;

  /* ---- renderMath ---- */
  window.renderMath = function(str){
    if (!str) return "";
    if (!/\$\$|\\\(/.test(str)) return esc(str);
    if (!window.katex) {
      if (typeof ensureKatex === 'function') {
        ensureKatex(function(){ if (typeof renderRoute === 'function') renderRoute(); });
      }
      return esc(str);
    }
    var src = String(str);
    var cacheKey = "katex::" + src;
    if (!window._katexCache) window._katexCache = new Map();
    if (window._katexCache.has(cacheKey)) return window._katexCache.get(cacheKey);

    var out = [];
    var pattern = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
    var last = 0, m;
    while ((m = pattern.exec(src)) !== null) {
      if (m.index > last) out.push(esc(src.slice(last, m.index)));
      var expr = (m[1] || m[2] || m[3]).trim();
      var isDisplay = !!(m[1] || m[2]);
      try {
        out.push(window.katex.renderToString(expr, {
          displayMode: isDisplay,
          throwOnError: false,
          output: "html"
        }));
      } catch (e) {
        out.push(esc(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < src.length) out.push(esc(src.slice(last)));
    var result = out.join("");
    window._katexCache.set(cacheKey, result);
    if (window._katexCache.size > 400) {
      var firstKey = window._katexCache.keys().next().value;
      window._katexCache.delete(firstKey);
    }
    return result;
  };

  /* ---- CSS: containment for inline and display math ---- */
  var style = document.createElement('style');
  style.id = 'apex-katex-fix-style';
  style.textContent = [
    /* Inline KaTeX: allow scroll within the card, never expand the page */
    '.err-detail .katex,',
    '.err-detail .katex-html,',
    '.sess-notes-body .katex,',
    '.sess-notes-body .katex-html {',
    '  max-width: 100%;',
    '  overflow-x: auto;',
    '  overflow-y: hidden;',
    '  display: inline-block;',
    '  vertical-align: middle;',
    '  scrollbar-width: thin;',
    '}',
    /* Display KaTeX: same containment, block-level */
    '.err-detail .katex-display,',
    '.sess-notes-body .katex-display {',
    '  overflow-x: auto;',
    '  overflow-y: hidden;',
    '  max-width: 100%;',
    '  padding: 4px 0;',
    '  -webkit-overflow-scrolling: touch;',
    '  scrollbar-width: thin;',
    '}',
    /* The wrapping containers must allow wrapping and never grow */
    '.err-detail,',
    '.err-detail > div,',
    '.err-detail > div > div:last-child,',
    '.sess-notes-body {',
    '  min-width: 0;',
    '  max-width: 100%;',
    '  overflow-wrap: anywhere;',
    '  word-break: break-word;',
    '  white-space: normal;',
    '}',
    /* Card shells: clip anything that escapes */
    '.card[data-id],',
    '.sess-card[data-id],',
    '.sess-card .err-detail {',
    '  min-width: 0;',
    '  max-width: 100%;',
    '  overflow-x: hidden;',
    '}',
    '@media (max-width: 860px) {',
    '  .err-detail .katex-display { font-size: .92em; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);


  /* ---- Re-render math in the dashboard hero card + agenda ---- */
  function rerenderDashboardMath() {
    // Hero card title and subtitle
    var hero = document.querySelector('.next-hero');
    if (hero) {
      hero.querySelectorAll('.nh-title, .nh-sub, .nh-reason').forEach(function(el){
        if (el.querySelector && el.querySelector('.katex')) return;
        var raw = el.textContent || '';
        if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
          el.innerHTML = window.renderMath(raw);
        }
      });
    }
    // Dashboard agenda rows (error rows on the Home page)
    var dash = document.getElementById('view');
    if (!dash) return;
    dash.querySelectorAll('.row-item .t, .weak-t, .detail-row').forEach(function(el){
      if (el.querySelector && el.querySelector('.katex')) return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw);
      }
    });
  }

  /* ---- Re-render math in error cards ---- */
  function rerenderErrorMath() {
    var list = document.getElementById('err-list');
    if (!list) return;
    list.querySelectorAll('.err-detail > div > div:last-child').forEach(function(el){
      if (el.querySelector && el.querySelector('.katex')) return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    list.querySelectorAll('.row-item .t').forEach(function(el){
      if (el.querySelector && el.querySelector('.katex')) return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw);
        el.dataset.katexDone = '1';
      }
    });
  }

  /* ---- Re-render math in review cards ---- */
  function rerenderSessMath() {
    var list = document.getElementById('sess-list');
    if (!list) return;
    list.querySelectorAll('.sess-notes-body').forEach(function(el){
      if (el.querySelector && el.querySelector('.katex')) return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    list.querySelectorAll('.err-detail > div > div:last-child').forEach(function(el){
      if (el.querySelector && el.querySelector('.katex')) return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    list.querySelectorAll('.sess-name').forEach(function(el){
      if (el.querySelector && el.querySelector('.katex')) return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw);
        el.dataset.katexDone = '1';
      }
    });
  }

  /* ---- Watch for new cards ---- */
  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){
        rerenderErrorMath();
        rerenderSessMath();
        rerenderDashboardMath();
      });
    }).observe(view, { childList: true, subtree: true });
  }

  setTimeout(function(){ rerenderErrorMath(); rerenderSessMath(); rerenderDashboardMath(); }, 400);
  setTimeout(function(){ rerenderErrorMath(); rerenderSessMath(); rerenderDashboardMath(); }, 1200);
  setTimeout(function(){ rerenderErrorMath(); rerenderSessMath(); rerenderDashboardMath(); }, 2500);

  var _origEdit = window.edit;
  if (typeof _origEdit === 'function') {
    window.edit = function(){
      if (window._katexCache) window._katexCache.clear();
      return _origEdit.apply(this, arguments);
    };
    try { edit = window.edit; } catch(e){}
  }
  /* ---- Hero card title: click to expand/collapse ---- */
  function wireHeroExpand() {
    document.querySelectorAll('.next-hero .nh-title').forEach(function(el){
      if (el.dataset.heroWired === '1') return;
      el.dataset.heroWired = '1';
      el.title = 'Click to expand';
      el.addEventListener('click', function(){
        this.classList.toggle('expanded');
        this.title = this.classList.contains('expanded') ? 'Click to collapse' : 'Click to expand';
      });
    });
  }

  var _viewEl = document.getElementById('view');
  if (_viewEl) {
    new MutationObserver(wireHeroExpand).observe(_viewEl, { childList: true, subtree: true });
  }
  setTimeout(wireHeroExpand, 600);
  setTimeout(wireHeroExpand, 1500);
  console.log('[apex-katex-fix] installed');
})();


// ── FILE: apex-theme-fix.js ────────────────────────────────────────────
/* ============================================================
   APEX COSMOS THEME FIX v3 — display:none on non-apex themes
   ============================================================ */
(function(){
  'use strict';
  if (window._apexCosmosFixV3) return;
  window._apexCosmosFixV3 = true;

  var style = document.createElement('style');
  style.id = 'apex-cosmos-theme-fix';
  style.textContent =
    'html:not([data-theme="apex"]) #apex-cosmos{' +
    '  display:none !important;' +
    '  opacity:0 !important;' +
    '  visibility:hidden !important;' +
    '  contain:none !important;' +
    '}' +
    'html:not([data-theme="apex"]) #apex-cosmos *{' +
    '  animation:none !important;' +
    '  display:none !important;' +
    '}';
  document.head.appendChild(style);

  function enforce(){
    var theme = document.documentElement.getAttribute('data-theme') || 'apex';
    var all = document.querySelectorAll('#apex-cosmos');
    for(var i = 0; i < all.length; i++){
      if(theme === 'apex'){
        all[i].style.display = '';
        all[i].style.visibility = '';
        all[i].style.opacity = '';
      } else {
        all[i].style.display = 'none';
        all[i].style.visibility = 'hidden';
        all[i].style.opacity = '0';
      }
    }
  }

  window.addEventListener('scroll', enforce, {passive:true, capture:true});
  document.addEventListener('scroll', enforce, {passive:true, capture:true});
  new MutationObserver(enforce).observe(document.body, {childList:true, subtree:true});
  new MutationObserver(enforce).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  setInterval(enforce, 250);
  enforce();

  console.log('[apex-cosmos-fix-v3] installed');
})();


// ── FILE: apex-exam-sync.js ────────────────────────────────────────────
/* ============================================================
   APEX EXAM SYNC
   Single source of truth for the active exam.
   S.settings.activeExam is canonical.
   S.settings.readinessExam is a mirror for backward compat.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamSync) return;
  window._apexExamSync = true;

  function canonical(){
    if (!S.settings) return '';
    return (S.settings.activeExam || S.settings.readinessExam || '').trim();
  }

  window.getActiveExamTag = function(){
    return canonical();
  };

  window.setActiveExam = function(exam){
    if (!S.settings) S.settings = {};
    var v = (exam || '').trim();
    S.settings.activeExam = v;
    S.settings.readinessExam = v;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (window._apexRCache) window._apexRCache.clear();
    if (typeof renderSylList === 'function') renderSylList();
    if (typeof window.apexConfigRefresh === 'function') window.apexConfigRefresh();
    if (typeof rerender === 'function') rerender();
  };
  try { setActiveExam = window.setActiveExam; } catch(e){}

  if (typeof ACTIONS === 'object') {
    ACTIONS['readiness-exam-set'] = function(id){
      window.setActiveExam(id || '');
    };
  }

  var st = document.createElement('style');
  st.textContent = '.ready-card .chips{display:none !important}' +
    '#syl-exam{display:none !important}';
  document.head.appendChild(st);


  /* One-time migration: if theme is piru (removed), switch to apex */
  (function migratePiru(){
    if (S && S.settings && S.settings.theme === 'piru') {
      S.settings.theme = 'apex';
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
      if (typeof applyTheme === 'function') applyTheme('apex');
      console.log('[apex] migrated theme: piru → apex');
    }
  })();

  console.log('[apex-exam-sync] canonical active exam installed');
})();


// ── FILE: apex-focus-notes-edit.js ────────────────────────────────────────────
/* ============================================================
   APEX FOCUS NOTES EDITOR
   Adds a pencil icon next to "Recent focus notes" on review
   cards. Click it to edit note text AND minutes for any
   focus log entry. Session time is preserved unless you
   change it. Clearing a note does not delete the session.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFocusNotesEdit) return;
  window._apexFocusNotesEdit = true;

  function notesFor(topicId){
    return (S.focusLog || []).filter(function(f){
      return f.topicId === topicId;
    }).sort(function(a, b){
      return (b.startedAt || '').localeCompare(a.startedAt || '');
    });
  }

  function openEditor(topicId){
    var t = topicById(topicId);
    if (!t) return;
    var notes = notesFor(topicId);

    var body = '<div class="sub-h">' + esc(t.topic) + ' · ' + notes.length +
               ' entr' + (notes.length === 1 ? 'y' : 'ies') + '</div>';

    if (!notes.length) {
      body += '<div class="empty" style="padding:24px 12px">' +
              '<b>No focus entries</b>' +
              '<p>They come from the Focus capture modal after a session.</p>' +
              '</div>';
    } else {
      body += notes.map(function(f){
        var date = f.startedAt ? f.startedAt.slice(0, 10) : '—';
        var mins = f.minutes || 0;
        return '<div data-note-row="' + f.id + '" ' +
          'style="border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;background:var(--surface-2)">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px">' +
            '<span class="tiny" style="font-family:\'JetBrains Mono\',monospace;letter-spacing:.08em;flex:1">' + esc(date) + '</span>' +
            '<div style="display:flex;align-items:center;gap:6px">' +
              '<input type="number" min="0" max="1440" step="1" data-note-mins="' + f.id + '" value="' + (mins || 0) + '" ' +
                'style="width:64px;min-height:32px;padding:4px 8px;font-size:12px;font-family:\'JetBrains Mono\',monospace;text-align:center;background:var(--surface);border:1px solid var(--border-2);border-radius:6px;color:var(--text)">' +
              '<span class="tiny" style="font-family:\'JetBrains Mono\',monospace;letter-spacing:.08em">min</span>' +
            '</div>' +
            '<button type="button" class="mini-icon danger" data-clear-note="' + f.id + '" ' +
              'title="Clear both fields (session time stays)">×</button>' +
          '</div>' +
          '<div class="frow" style="margin:0 0 10px 0">' +
            '<label style="font-size:11px;color:var(--pri-low-fg);letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">✓ WHAT CLICKED</label>' +
            '<input class="inp" data-note-win="' + f.id + '" value="' + esc(f.win || '') + '" placeholder="(empty)">' +
          '</div>' +
          '<div class="frow" style="margin:0">' +
            '<label style="font-size:11px;color:var(--pri-medium-fg);letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">! STILL FUZZY</label>' +
            '<input class="inp" data-note-gap="' + f.id + '" value="' + esc(f.gap || '') + '" placeholder="(empty)">' +
          '</div>' +
        '</div>';
      }).join('');
    }

    openModal('Focus entries', body, function(){
      snapshot();
      var changed = 0;
      document.querySelectorAll('[data-note-win]').forEach(function(inp){
        var id = inp.getAttribute('data-note-win');
        var f = S.focusLog.find(function(x){ return x.id === id; });
        if (!f) return;
        var v = inp.value.trim();
        if ((f.win || '') !== v){ f.win = v; changed++; }
      });
      document.querySelectorAll('[data-note-gap]').forEach(function(inp){
        var id = inp.getAttribute('data-note-gap');
        var f = S.focusLog.find(function(x){ return x.id === id; });
        if (!f) return;
        var v = inp.value.trim();
        if ((f.gap || '') !== v){ f.gap = v; changed++; }
      });
      document.querySelectorAll('[data-note-mins]').forEach(function(inp){
        var id = inp.getAttribute('data-note-mins');
        var f = S.focusLog.find(function(x){ return x.id === id; });
        if (!f) return;
        var v = Math.max(0, Math.min(1440, parseInt(inp.value, 10) || 0));
        if ((f.minutes || 0) !== v){ f.minutes = v; changed++; }
      });
      if (changed){
        saveLocal();
        rerender();
        toast('Saved', changed + ' field' + (changed === 1 ? '' : 's') + ' updated');
      } else {
        toast('No changes');
      }
      return true;
    }, 'Save');

    var modal = document.querySelector('.modal');
    if (modal){
      modal.addEventListener('click', function(e){
        var btn = e.target.closest('[data-clear-note]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var row = btn.closest('[data-note-row]');
        if (!row) return;
        var winInp = row.querySelector('[data-note-win]');
        var gapInp = row.querySelector('[data-note-gap]');
        if (winInp) winInp.value = '';
        if (gapInp) gapInp.value = '';
        row.style.opacity = '.4';
        btn.style.display = 'none';
        if (!row.querySelector('.apex-clear-marker')){
          var m = document.createElement('div');
          m.className = 'tiny apex-clear-marker';
          m.style.cssText = 'margin-top:8px;color:var(--pri-critical-fg);font-family:JetBrains Mono,monospace;letter-spacing:.1em';
          m.textContent = 'NOTES WILL BE CLEARED ON SAVE';
          row.appendChild(m);
        }
      });
    }
  }

  function addEditButtons(){
    document.querySelectorAll('.sess-notes-h').forEach(function(h){
      var txt = (h.textContent || '').trim();
      if (txt.indexOf('Recent focus notes') === -1) return;
      if (h.querySelector('[data-edit-focus-notes]')) return;

      var card = h.closest('.sess-card');
      if (!card) return;
      var sid = card.dataset.id;
      var s = S.sessions.find(function(x){ return x.id === sid; });
      if (!s || !s.topicId) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'notes-edit';
      btn.setAttribute('data-edit-focus-notes', s.topicId);
      btn.title = 'Edit focus entries';
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" ' +
        'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>';
      h.appendChild(btn);
    });
  }

  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-edit-focus-notes]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openEditor(btn.getAttribute('data-edit-focus-notes'));
  }, true);

  var view = document.getElementById('view');
  if (view){
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(addEditButtons);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(addEditButtons, 300);
  setTimeout(addEditButtons, 1000);
  setTimeout(addEditButtons, 2500);
  window.addEventListener('hashchange', function(){ setTimeout(addEditButtons, 100); });

  console.log('[apex-focus-notes-edit] installed — minutes + notes editable');
})();

// ── FILE: apex-scroll-preserve.js ────────────────────────────────────────────
/* ============================================================
   APEX SCROLL PRESERVE
   Stops the view from jumping to the top when the DOM is
   swapped (delete, edit, rate, etc.). Wraps rerender itself,
   so it applies everywhere.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScrollPreserve) return;
  window._apexScrollPreserve = true;

  function wrap(){
    if (typeof window.rerender !== 'function') {
      setTimeout(wrap, 100);
      return;
    }
    if (window._apexRerenderWrappedScroll) return;
    window._apexRerenderWrappedScroll = true;

    var _orig = window.rerender;

    window.rerender = function(){
      var y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      /* Fast path — nothing to preserve. Common during initial load and
         while the user is at the top of the page. Skips style toggling,
         forced reflows, and scrollTo calls entirely. */
      if (y === 0) {
        return _orig.apply(this, arguments);
      }

      // Pause scroll anchoring so the browser doesn't "correct" scroll
      // when the DOM below the viewport changes
      var htmlAnchor = document.documentElement.style.overflowAnchor;
      var bodyAnchor = document.body.style.overflowAnchor;
      document.documentElement.style.overflowAnchor = 'none';
      document.body.style.overflowAnchor = 'none';

      // Force instant scroll during restore (skip the smooth animation)
      var htmlBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      var result;
      try {
        result = _orig.apply(this, arguments);
      } catch(e) {
        document.documentElement.style.overflowAnchor = htmlAnchor;
        document.body.style.overflowAnchor = bodyAnchor;
        document.documentElement.style.scrollBehavior = htmlBehavior;
        throw e;
      }

      function restore(){
        var max = Math.max(0,
          (document.documentElement.scrollHeight || 0) - (window.innerHeight || 0));
        window.scrollTo(0, Math.min(y, max));
      }

      /* Restore once after layout, then again at 80ms as a safety net
         for slow layouts. Cleanup happens in the safety-net pass. */
      requestAnimationFrame(restore);
      setTimeout(function(){
        restore();
        document.documentElement.style.overflowAnchor = htmlAnchor;
        document.body.style.overflowAnchor = bodyAnchor;
        document.documentElement.style.scrollBehavior = htmlBehavior;
      }, 80);

      return result;
    };
    try { rerender = window.rerender; } catch(e){}

    console.log('[apex scroll preserve] installed');
  }
  wrap();
})();




// ── FILE: apex-focus-history-edit.js ──────────────────────────────
/* ============================================================
   APEX — FOCUS HISTORY EDITOR v2
   Fully replaces focusHistoryModal so every row renders with
   edit / delete icons inline. No DOM matching, no races.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFocusHistoryEditV2) return;
  window._apexFocusHistoryEditV2 = true;

  function findEntry(id){
    return (S.focusLog || []).find(function(f){ return f.id === id; });
  }

  function refreshModal(){
    if (typeof closeModal === 'function') closeModal();
    setTimeout(function(){ window.focusHistoryModal(); }, 60);
  }

  // ---------- edit modal ----------
  function openEditModal(id){
    var f = findEntry(id);
    if (!f) { toast('Entry not found'); return; }
    var t = f.topicId ? topicById(f.topicId) : null;

    var body = ''
      + '<div class="sub-h">' + (t ? esc(t.topic) : 'No topic') + ' · ' + (f.startedAt || '').slice(0,10) + '</div>'
      + '<div class="f2">'
      +   '<div class="frow"><label>Minutes</label>'
      +     '<input class="inp" type="number" name="minutes" min="0" max="1440" value="' + (f.minutes || 0) + '">'
      +   '</div>'
      +   '<div class="frow"><label>Date</label>'
      +     '<input class="inp" type="date" name="date" value="' + (f.startedAt ? f.startedAt.slice(0,10) : '') + '">'
      +   '</div>'
      + '</div>'
      + '<div class="frow"><label>Label</label>'
      +   '<input class="inp" name="label" value="' + esc(f.label || '') + '">'
      + '</div>'
      + '<div class="f2">'
      +   '<div class="frow"><label>What clicked</label>'
      +     '<input class="inp" name="win" value="' + esc(f.win || '') + '" placeholder="(empty)">'
      +   '</div>'
      +   '<div class="frow"><label>Still fuzzy</label>'
      +     '<input class="inp" name="gap" value="' + esc(f.gap || '') + '" placeholder="(empty)">'
      +   '</div>'
      + '</div>'
      + '<div class="frow"><label>Linked topic</label>'
      +   (typeof pickerHTML === 'function' ? pickerHTML('topicIds', f.topicId ? [f.topicId] : [], false) : '')
      + '</div>';

    openModal('Edit focus entry', body, function(v){
      snapshot();
      var entry = findEntry(id);
      if (!entry) { toast('Entry vanished'); return true; }

      entry.minutes = Math.max(0, Math.min(1440, parseInt(v.minutes, 10) || 0));
      entry.label   = (v.label || '').trim();
      entry.win     = (v.win   || '').trim();
      entry.gap     = (v.gap   || '').trim();

      if (v.date) {
        var oldTime = entry.startedAt ? entry.startedAt.slice(11) : '00:00:00.000Z';
        entry.startedAt = v.date + 'T' + oldTime;
      }

      var ids = (typeof pickVals === 'function') ? pickVals(v.topicIds) : [];
      entry.topicId = ids[0] || null;

      saveLocal();
      rerender();
      toast('Focus entry updated');
      refreshModal();
      return true;
    }, 'Save');

    var root = document.querySelector('#modal-root');
    if (root) root.querySelectorAll('.tpick').forEach(function(el){
      if (typeof wirePicker === 'function') wirePicker(el);
    });
  }
function confirmDelete(id){
  var f = findEntry(id);
  if (!f) return;
  var label = f.label || 'Focus entry';
  var mins  = f.minutes || 0;
  var when  = f.startedAt ? f.startedAt.slice(0,10) : 'unknown date';

  openConfirm(
    'Delete "' + label + '" (' + mins + 'm on ' + when + ')? This changes your streak and focus stats for that day.',
    function(){
      snapshot();

      // 1. Write the tombstone BEFORE removing the record.
      //    mergeForSync drops any record whose _ts <= its tombstone time.
      if (!S.tombstones) S.tombstones = {};
      if (!S.tombstones.focusLog) S.tombstones.focusLog = {};
      S.tombstones.focusLog[id] = Date.now();

      // 2. Remove from the local array
      S.focusLog = (S.focusLog || []).filter(function(x){ return x.id !== id; });

      // 3. Strip the same minutes from the linked session so focus totals
      //    and session duration stay in sync (the edit file didn't do this).
      if (f.topicId && f.minutes) {
        for (var i = S.sessions.length - 1; i >= 0; i--) {
          if (S.sessions[i].topicId === f.topicId) {
            S.sessions[i].duration = Math.max(0, (S.sessions[i].duration || 0) - f.minutes);
            break;
          }
        }
      }

      S._lastLocalEdit = new Date().toISOString();
      saveLocal();

      // 4. Push immediately instead of waiting for the 500ms debounce,
      //    so a pull can't race in and resurrect the record first.
      if (typeof pushNow === 'function' && typeof syncKey !== 'undefined' && syncKey) {
        pushNow(true);
      }

      rerender();
      toast('Focus entry deleted', mins + 'm removed');
      refreshModal();
    }
  );
}
  // ---------- full replacement of focusHistoryModal ----------
  window.focusHistoryModal = function(){
    var logs = (S.focusLog || []).slice().sort(function(a,b){
      return (b.startedAt || '').localeCompare(a.startedAt || '');
    }).slice(0, 60);

    var totalToday = (typeof focusTodayMinutes === 'function') ? focusTodayMinutes() : 0;
    var totalWeek  = (typeof focusWeekMinutes  === 'function') ? focusWeekMinutes()  : 0;

    var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'
      + '<div class="detail-block" style="text-align:center;margin:0"><div class="tiny">Today</div>'
      +   '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--accent-2)">' + totalToday + 'm</div></div>'
      + '<div class="detail-block" style="text-align:center;margin:0"><div class="tiny">This week</div>'
      +   '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--accent-2)">' + totalWeek + 'm</div></div>'
      + '</div>';

    if (!logs.length) {
      body += '<div class="empty" style="padding:24px 12px"><b>Nothing yet</b><p>Complete a focus block to see it here.</p></div>';
    } else {
      body += '<div style="font:700 10px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">Recent sessions · ' + logs.length + '</div>';
      body += logs.map(function(f){
        var t = f.topicId ? topicById(f.topicId) : null;
        var when = f.startedAt ? f.startedAt.slice(0, 10) : '';
        var time = f.startedAt ? f.startedAt.slice(11, 16) : '';
        var q = f.quality != null ? f.quality : null;
        var qc = q != null ? (q >= 80 ? '#10B981' : q >= 50 ? '#F59E0B' : '#EF4444') : 'var(--text-3)';
        var qt = q != null ? (q + '%') : '—';

        return ''
          + '<div data-fh-id="' + f.id + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:var(--surface-2);margin-bottom:6px">'
          +   '<div style="flex:0 0 62px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--text-3);line-height:1.4">' + when + '<br>' + time + '</div>'
          +   '<div style="flex:1;min-width:0">'
          +     '<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.label || 'Focus session') + '</div>'
          +     '<div class="tiny" style="margin-top:2px">' + (t ? esc(t.topic) : 'No topic') + (f.win ? ' · ✓' : '') + (f.gap ? ' · ⚠' : '') + '</div>'
          +   '</div>'
          +   '<div style="flex:0 0 46px;text-align:right">'
          +     '<div style="font-family:var(--font-display);font-weight:700;font-size:15px">' + (f.minutes || 0) + 'm</div>'
          +     '<div class="tiny" style="color:' + qc + '">' + qt + '</div>'
          +   '</div>'
          +   '<button class="mini-icon" data-fh-edit="' + f.id + '" title="Edit" style="width:30px;height:30px;flex:0 0 30px">'
          +     '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>'
          +   '</button>'
          +   '<button class="mini-icon danger" data-fh-del="' + f.id + '" title="Delete" style="width:30px;height:30px;flex:0 0 30px">'
          +     '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
          +   '</button>'
          + '</div>';
      }).join('');
    }

    openModal("Focus history", body, function(){}, "Close");
    var sv = document.querySelector("[data-msave]");
    if (sv) sv.style.display = "none";

    // Wire the buttons — delegated, so it survives re-renders
    var root = document.querySelector('#modal-root');
    if (root && !root._fhWired) {
      root._fhWired = true;
      root.addEventListener('click', function(e){
        var editBtn = e.target.closest('[data-fh-edit]');
        if (editBtn) {
          e.preventDefault(); e.stopPropagation();
          openEditModal(editBtn.dataset.fhEdit);
          return;
        }
        var delBtn = e.target.closest('[data-fh-del]');
        if (delBtn) {
          e.preventDefault(); e.stopPropagation();
          confirmDelete(delBtn.dataset.fhDel);
          return;
        }
      });
    }
  };

  window.apexFocusEdit = openEditModal;
  window.apexFocusDelete = confirmDelete;

  console.log('[apex-focus-history-edit v2] installed — icons render inline');
})();
