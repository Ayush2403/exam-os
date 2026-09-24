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

    installEl.querySelector('.ib-body b{color:#C4B5FD;font-weight:700}');
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

  console.log('[apex-mobile] installed · iOS:', isIOS, '· Android:', isAndroid, '· Standalone:', isStandalone);
})();