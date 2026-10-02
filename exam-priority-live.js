/* ============================================================
   APEX PRIORITY — LIVE
   Priority is computed: weightage × D-Day proximity × status gap
   Weightage stays per-exam (fact about exam).
   Priority is a consequence (fact about you right now).
   ============================================================ */
(function(){
  'use strict';
  if (window._apexPriorityLive) return;
  window._apexPriorityLive = true;

  var _origCompute = window.computeTopicPriority;
  if (typeof _origCompute === 'function') {
    window.computeTopicPriority = function(topic, activeExamTag) {
      if (!topic) return 0;
      if (topic.examConfig && activeExamTag && topic.examConfig[activeExamTag]) {
        var override = topic.examConfig[activeExamTag].weightage;
        if (override) {
          var w = override === 'High' ? 5 : override === 'Medium' ? 3 : override === 'Low' ? 2 : null;
          if (w !== null) {
            var proximity = 0.5;
            if (typeof S !== 'undefined' && S.settings && Array.isArray(S.settings.exams)) {
              var matching = S.settings.exams.filter(function(x){
                return x.date && x.examTag &&
                       String(x.examTag).toLowerCase() === String(activeExamTag).toLowerCase();
              });
              if (matching.length) {
                var now = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0,10);
                var nearest = matching.reduce(function(a, b){
                  return Math.abs(diffD(a.date, now)) < Math.abs(diffD(b.date, now)) ? a : b;
                });
                var days = diffD(nearest.date, now);
                if (days <= 7) proximity = 1.0;
                else if (days <= 14) proximity = 0.95;
                else if (days <= 30) proximity = 0.85;
                else if (days <= 60) proximity = 0.70;
                else if (days <= 90) proximity = 0.55;
                else if (days <= 180) proximity = 0.35;
                else if (days <= 365) proximity = 0.20;
                else proximity = 0.10;
              }
            }
            var gapMap = { "Not started": 1.0, "Learning": 0.9, "Practicing": 0.7,
                           "Reviewing": 0.5, "Mastered": 0.15 };
            var gap = gapMap[topic.status] || 0.8;
            return Math.round((w / 5) * proximity * gap * 100);
          }
        }
      }
      return _origCompute(topic, activeExamTag);
    };
  }

  function colorFor(score) {
    if (score >= 70) return { bg:"rgba(248,113,113,.18)", bd:"rgba(248,113,113,.5)", fg:"#fca5a5", label:"CRIT" };
    if (score >= 50) return { bg:"rgba(250,204,21,.18)", bd:"rgba(250,204,21,.5)", fg:"#fde68a", label:"HIGH" };
    if (score >= 30) return { bg:"rgba(96,165,250,.18)", bd:"rgba(96,165,250,.5)", fg:"#93c5fd", label:"MED" };
    return { bg:"rgba(74,222,128,.15)", bd:"rgba(74,222,128,.45)", fg:"#86efac", label:"LOW" };
  }

  function repaint() {
    var list = document.getElementById('syl-list');
    if (!list) return;
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return;

    list.querySelectorAll('.topic-row').forEach(function(row){
      var id = row.dataset.id;
      if (!id) return;
      var t = (typeof topicById === 'function') ? topicById(id) : null;
      if (!t) return;
      var nameRow = row.querySelector('.topic-body > div:first-child');
      if (!nameRow) return;

      nameRow.querySelectorAll('.apex-computed-pri, .apex-cfg-pri').forEach(function(p){ p.remove(); });

      var isTagged = Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
      var score = isTagged && typeof window.computeTopicPriority === 'function'
                    ? window.computeTopicPriority(t, exam) : 0;

      var pill = document.createElement('span');
      pill.className = 'pill apex-computed-pri';
      pill.style.cssText = 'margin-left:auto;flex-shrink:0;font-size:9.5px;padding:2px 9px;font-family:"JetBrains Mono",monospace;letter-spacing:.08em;font-weight:600';

      if (!isTagged) {
        pill.style.background = 'rgba(120,120,120,.08)';
        pill.style.borderColor = 'rgba(120,120,120,.25)';
        pill.style.color = '#6b7280';
        pill.textContent = '— ' + exam;
        pill.title = 'Not tagged for ' + exam;
      } else {
        var c = colorFor(score);
        pill.style.background = c.bg;
        pill.style.borderColor = c.bd;
        pill.style.color = c.fg;
        pill.textContent = c.label + ' ' + score;
        pill.title = 'Computed priority ' + score + '/100\n= weightage × D-Day proximity × status gap\nExam: ' + exam + ' · Status: ' + (t.status || '?');
      }
      nameRow.appendChild(pill);
    });
  }
  window.apexPriorityRefresh = repaint;

  function hideManualPriority() {
    document.querySelectorAll('.modal [data-exam-row]').forEach(function(row){
      var sels = row.querySelectorAll('select');
      if (sels.length >= 2) {
        sels[0].style.display = 'none';
        row.style.gridTemplateColumns = '110px 1fr';
      }
    });
    document.querySelectorAll('.modal .frow > label').forEach(function(lbl){
      if (/per-exam priority/i.test(lbl.textContent)) lbl.textContent = 'Per-exam weightage';
    });
    document.querySelectorAll('.modal .hint').forEach(function(h){
      if (/Each tagged exam gets its own priority and weightage/i.test(h.textContent)) {
        h.textContent = 'Each tagged exam gets its own weightage. Priority is computed live: weightage × D-Day proximity × status gap.';
      }
    });
  }

  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) new MutationObserver(hideManualPriority).observe(modalRoot, { childList: true, subtree: true });

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(repaint);
    }).observe(view, { childList: true, subtree: true });
  }

  setTimeout(repaint, 400);
  setTimeout(repaint, 1200);
  console.log('[apex-priority-live] priority is now computed from weightage × D-Day × status');
})();
