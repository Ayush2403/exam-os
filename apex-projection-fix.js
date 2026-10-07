/* ============================================================
   APEX PROJECTION FIX
   Bug: when activeExam has no matching exam target, the readiness
   card's D-Day falls back to the nearest Primary — producing
   "Scope: X / D-N · Y" where X and Y are unrelated exams.
   Fix: hide the projection when no exam target matches the scope.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexProjectionFix) return;
  window._apexProjectionFix = true;

  var _orig = window.readinessProjection;
  if (typeof _orig !== 'function') {
    console.warn('[apex-projection-fix] readinessProjection not found');
    return;
  }

  window.readinessProjection = function(){
    var proj = _orig.apply(this, arguments);
    if (!proj) return proj;

    var scopeTag = (typeof window.getActiveExamTag === 'function')
      ? window.getActiveExamTag()
      : '';

    if (!scopeTag) return null;

    var targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date && x.examTag; })
      : [];

    var matching = targets.filter(function(x){
      return String(x.examTag).toLowerCase() === String(scopeTag).toLowerCase();
    });

    // No exam target for this scope — suppress the projection rather
    // than showing an unrelated exam's D-Day.
    if (!matching.length) return null;

    return proj;
  };

  console.log('[apex-projection-fix] installed');
})();