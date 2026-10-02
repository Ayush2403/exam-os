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
      if (typeof pruneOldData !== 'function') return;
      var r = pruneOldData();
      if (r.pruned > 0) {
        console.log('[apex] auto-pruned ' + r.pruned + ' entries at ' + h.pct + '%');
        setTimeout(function(){ if (typeof rerender === 'function') rerender(); }, 200);
      }
    } catch(e) { console.warn('[apex] auto-prune skipped:', e.message); }
  }, 3000);
})();

console.log('[apex-final-batch] leech reset + auto-prune added');

/* ---- 6. beforeunload: flush pending sync push ---- */
(function(){
  if (window._apexFlushOnUnload) return;
  window._apexFlushOnUnload = true;
  window.addEventListener('beforeunload', function(){
    try {
      /* Make sure the latest state is on disk synchronously */
      if (typeof S !== 'undefined' && typeof KEY !== 'undefined') {
        localStorage.setItem(KEY, JSON.stringify(S));
      }
      /* Fire the push. Sync flush on hide already handles most cases;
         this covers the "close tab within the debounce window" edge. */
      if (typeof S !== 'undefined' && S && S.sync && S.sync.enabled && syncKey) {
        pushNow(true);
      }
    } catch(e) {}
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
