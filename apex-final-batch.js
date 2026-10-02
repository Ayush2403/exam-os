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
