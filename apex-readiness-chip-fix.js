/* ============================================================
   APEX READINESS CHIP FIX
   Bug: apex-scope.js overrides readinessScope() to read
   activeExam instead of readinessExam. So clicking a readiness
   chip sets readinessExam, but scope resolution keeps returning
   activeExam (which stays at CGL). Chips appear frozen.
   Fix: set both fields so the readiness card and the exam bar
   stay in sync.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexReadinessChipFix) return;
  window._apexReadinessChipFix = true;

  var _orig = ACTIONS['readiness-exam-set'];
  if (typeof _orig !== 'function') {
    console.warn('[apex-readiness-chip-fix] action not found');
    return;
  }

  ACTIONS['readiness-exam-set'] = function(id){
    if (!S.settings) S.settings = {};
    var exam = id || '';
    S.settings.readinessExam = exam;
    if (exam) S.settings.activeExam = exam;   // ← the fix
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}

    // Clear the per-render cache so examReadiness() recomputes
    if (window._apexRCache) window._apexRCache.clear();

    rerender();
    console.log('[readiness-chip] scope →', exam);
  };

  console.log('[apex-readiness-chip-fix] installed');
})();