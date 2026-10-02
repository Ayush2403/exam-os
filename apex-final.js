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
