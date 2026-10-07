/* ============================================================
   APEX EXAM SYNC
   Single source of truth for the active exam.
   S.settings.activeExam is canonical.
   S.settings.readinessExam is a mirror for backward compat.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamSync) return;
  window._apexExamSync = true;

  function canonical(){
    if (!S.settings) return '';
    return (S.settings.activeExam || S.settings.readinessExam || '').trim();
  }

  window.getActiveExamTag = function(){
    return canonical();
  };

  window.setActiveExam = function(exam){
    if (!S.settings) S.settings = {};
    var v = (exam || '').trim();
    S.settings.activeExam = v;
    S.settings.readinessExam = v;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (window._apexRCache) window._apexRCache.clear();
    if (typeof renderSylList === 'function') renderSylList();
    if (typeof window.apexConfigRefresh === 'function') window.apexConfigRefresh();
    if (typeof rerender === 'function') rerender();
  };
  try { setActiveExam = window.setActiveExam; } catch(e){}

  if (typeof ACTIONS === 'object') {
    ACTIONS['readiness-exam-set'] = function(id){
      window.setActiveExam(id || '');
    };
  }

  var st = document.createElement('style');
  st.textContent = '.ready-card .chips{display:none !important}' +
    '#syl-exam{display:none !important}';
  document.head.appendChild(st);


  /* One-time migration: if theme is piru (removed), switch to apex */
  (function migratePiru(){
    if (S && S.settings && S.settings.theme === 'piru') {
      S.settings.theme = 'apex';
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
      if (typeof applyTheme === 'function') applyTheme('apex');
      console.log('[apex] migrated theme: piru → apex');
    }
  })();

  console.log('[apex-exam-sync] canonical active exam installed');
})();
