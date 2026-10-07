/* ============================================================
   APEX EXAM SYNC
   The only fix needed for the readiness chip bug.
   Makes activeExam and readinessExam act as one field, so:
     - clicking a readiness chip changes scope
     - changing the syllabus exam bar changes scope
     - everything else reads the same value
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamSync) return;
  window._apexExamSync = true;

  /* Chip click writes both fields */
  var _origChip = ACTIONS['readiness-exam-set'];
  if (typeof _origChip === 'function') {
    ACTIONS['readiness-exam-set'] = function(id){
      if (!S.settings) S.settings = {};
      S.settings.readinessExam = id || '';
      S.settings.activeExam = id || '';
      return _origChip.apply(this, arguments);
    };
  }

  /* Exam bar dropdown writes both fields */
  var _origSet = window.setActiveExam;
  if (typeof _origSet === 'function') {
    window.setActiveExam = function(exam){
      if (!S.settings) S.settings = {};
      S.settings.readinessExam = exam;
      return _origSet.apply(this, arguments);
    };
    try { setActiveExam = window.setActiveExam; } catch(e){}
  }

  /* Read: whichever field is set, use it */
  var _origGet = window.getActiveExamTag;
  if (typeof _origGet === 'function') {
    window.getActiveExamTag = function(){
      var v = (S.settings && (S.settings.activeExam || S.settings.readinessExam)) || '';
      if (v) return v;
      return _origGet.apply(this, arguments);
    };
  }
  /* Hide the scope chips — the exam bar on Syllabus is the single picker */
var st = document.createElement('style');
st.textContent = '.ready-card .chips{display:none !important}';
document.head.appendChild(st);

  console.log('[apex-exam-sync] installed — activeExam ↔ readinessExam unified');
})();