/* ============================================================
   APEX — scroll-free expand + colored status
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScrollFix) return;
  window._apexScrollFix = true;

  /* ---- 1. Intercept expand clicks BEFORE the app handler runs ---- */
  document.addEventListener('click', function(e){
    var sub = e.target.closest('[data-action="toggle-subj"]');
    if (sub) {
      if (e.target.closest('.subj-actions')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var subj = sub.dataset.id;
      var grp = sub.closest('.subj-group');
      if (grp) grp.classList.toggle('closed');
      try {
        sf.closed[subj] = grp ? grp.classList.contains('closed') : false;
        if (typeof saveSF === 'function') saveSF();
      } catch(err){}
      return;
    }
    var top = e.target.closest('[data-action="toggle-topic"]');
    if (top) {
      var tid = top.dataset.id;
      var list = document.getElementById('syl-list');
      if (!list) return;
      var rowBefore = list.querySelector('.topic-row[data-id="' + tid + '"]');
      if (!rowBefore) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var topBefore = rowBefore.getBoundingClientRect().top;
      try {
        sf.closedTopics[tid] = !sf.closedTopics[tid];
        if (typeof saveSF === 'function') saveSF();
      } catch(err){}
      if (typeof renderSylList === 'function') renderSylList();
      var rowAfter = list.querySelector('.topic-row[data-id="' + tid + '"]');
      if (rowAfter) {
        window.scrollBy(0, rowAfter.getBoundingClientRect().top - topBefore);
      }
      return;
    }
  }, true);

  /* ---- 2. Color status dropdowns by their value ---- */
  function colorStatuses(){
    var list = document.getElementById('syl-list');
    if (!list) return;
    list.querySelectorAll('select[data-change="syl-status"]').forEach(function(sel){
      var v = sel.value;
      var color = v === 'Mastered' ? '#10B981'
                : v === 'Reviewing' ? '#7DD3FC'
                : v === 'Practicing' ? '#3B82F6'
                : v === 'Learning'   ? '#EAB308'
                : '#EF4444';
      sel.style.color = color;
      sel.style.fontWeight = '600';
    });
    /* Parent pills already colored by statusColor() — no change needed */
  }
  window.apexColorStatuses = colorStatuses;

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(colorStatuses);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(colorStatuses, 300);
  setTimeout(colorStatuses, 1000);

  console.log('[apex-scroll-fix] installed');
})();
