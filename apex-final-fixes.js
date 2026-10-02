/* APEX — final fixes: scroll-restore + pill sweep + status colors */
(function(){
  'use strict';
  if (window._apexFinalFixes) return;
  window._apexFinalFixes = true;

  /* 1. Wrap renderSylList to snapshot & restore scroll */
  function wrapRender(){
    if (typeof window.renderSylList !== 'function') { setTimeout(wrapRender, 100); return; }
    if (window._apexWrappedRenderSyl) return;
    window._apexWrappedRenderSyl = true;
    var orig = window.renderSylList;
    window.renderSylList = function(){
      var y = window.scrollY;
      var r;
      try { r = orig.apply(this, arguments); }
      catch(e){ console.error('[apex] renderSylList error', e); }
      window.scrollTo(0, y);
      requestAnimationFrame(function(){
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
      });
      setTimeout(function(){
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
      }, 60);
      return r;
    };
    console.log('[apex-final-fixes] renderSylList wrapped');
  }
  wrapRender();

  /* 2. Priority pill sweep — rewrite with computed value */
  function sweepPills(){
    var list = document.getElementById('syl-list');
    if (!list) return;
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return;
    list.querySelectorAll('.topic-row').forEach(function(row){
      var id = row.dataset.id;
      if (!id) return;
      var t = (typeof window.topicById === 'function') ? window.topicById(id) : null;
      if (!t) return;
      var isTagged = Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
      var score = isTagged && typeof window.computeTopicPriority === 'function'
                  ? window.computeTopicPriority(t, exam) : 0;
      var lbl = score >= 70 ? 'CRIT' : score >= 50 ? 'HIGH' : score >= 30 ? 'MED' : 'LOW';
      var sig = exam + ':' + score + ':' + (isTagged ? '1' : '0');
      var nameRow = row.querySelector('.topic-body > div:first-child');
      if (!nameRow) return;
      var pill = nameRow.querySelector('.apex-cfg-pri, .apex-computed-pri');
      if (!pill) return;
      if (pill.dataset.sweptSig === sig) return;
      pill.dataset.sweptSig = sig;
      if (!isTagged) {
        pill.style.background = 'rgba(120,120,120,.08)';
        pill.style.borderColor = 'rgba(120,120,120,.25)';
        pill.style.color = '#6b7280';
        pill.textContent = '— ' + exam;
        pill.title = 'Not tagged for ' + exam;
      } else {
        var bg, bd, fg;
        if (score >= 70) { bg="rgba(248,113,113,.18)"; bd="rgba(248,113,113,.5)"; fg="#fca5a5"; }
        else if (score >= 50) { bg="rgba(250,204,21,.18)"; bd="rgba(250,204,21,.5)"; fg="#fde68a"; }
        else if (score >= 30) { bg="rgba(96,165,250,.18)"; bd="rgba(96,165,250,.5)"; fg="#93c5fd"; }
        else { bg="rgba(74,222,128,.15)"; bd="rgba(74,222,128,.45)"; fg="#86efac"; }
        pill.style.background = bg;
        pill.style.borderColor = bd;
        pill.style.color = fg;
        pill.textContent = lbl + ' ' + score;
        pill.title = 'Computed: ' + score + '/100\n= weightage × D-Day × status';
      }
    });
  }
  setInterval(sweepPills, 300);
  setTimeout(sweepPills, 400);
  setTimeout(sweepPills, 1200);

  /* 3. Colored status dropdowns */
  function colorStatuses(){
    var list = document.getElementById('syl-list');
    if (!list) return;
    list.querySelectorAll('select[data-change="syl-status"]').forEach(function(sel){
      var v = sel.value;
      var c = v === 'Mastered' ? '#10B981'
            : v === 'Reviewing' ? '#7DD3FC'
            : v === 'Practicing' ? '#3B82F6'
            : v === 'Learning'   ? '#EAB308'
            : '#EF4444';
      if (sel.dataset.colored !== v) {
        sel.dataset.colored = v;
        sel.style.color = c;
        sel.style.fontWeight = '600';
      }
    });
  }
  setInterval(colorStatuses, 400);

  console.log('[apex-final-fixes] installed');
})();
