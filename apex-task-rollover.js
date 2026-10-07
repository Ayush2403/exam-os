/* ============================================================
   APEX TASK ROLLOVER + BOARD CLEANUP
   1. Routine tasks (time-blocked, no due date) roll over daily
   2. Task Board default filter = Today
   3. Completed tasks >7d hidden from non-"All" views
   4. "All" filter still shows everything
   ============================================================ */
(function(){
  'use strict';
  if (window._apexTaskRollover) return;
  window._apexTaskRollover = true;

  /* ---- 1. Roll over routine tasks ---- */
  function rollover(){
    if (!S.tasks || !Array.isArray(S.tasks)) return;
    const today = todayISO();
    let dirty = false;
    S.tasks.forEach(function(t){
      // Only time-blocked routine tasks with no explicit due date
      if (t.tbS && !t.due && t.status === 'Completed'
          && t.completedOn && t.completedOn !== today) {
        t.status = 'Next Up';
        t.completedOn = null;
        dirty = true;
      }
    });
    if (dirty) {
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
      console.log('[apex-task-rollover] rolled over routine tasks');
    }
  }

  /* ---- 2. Default filter = "today" ---- */
  try {
    if (typeof tf !== 'undefined' && tf.f === 'all') {
      tf.f = 'today';
    }
  } catch(e){}

  /* ---- 3. Hide completed >7d from non-"All" views ---- */
  const _origRenderBoard = window.renderBoard;
  if (typeof _origRenderBoard === 'function') {
    window.renderBoard = function(){
      const backup = S.tasks;
      if (tf.f !== 'all') {
        const cutoff = addDays(todayISO(), -7);
        S.tasks = S.tasks.filter(function(t){
          if (t.status !== 'Completed') return true;
          if (!t.completedOn) return true;
          return t.completedOn >= cutoff;
        });
      }
      try {
        return _origRenderBoard.apply(this, arguments);
      } finally {
        S.tasks = backup;
      }
    };
    try { renderBoard = window.renderBoard; } catch(e){}
  }

  /* ---- 4. Rollover on load + route change ---- */
  rollover();

  window.addEventListener('hashchange', function(){
    setTimeout(function(){
      rollover();
      if ((location.hash || '').indexOf('tasks') > -1) {
        if (typeof renderRoute === 'function') renderRoute();
      }
    }, 80);
  });

  // If we land on tasks already, force one re-render so the
  // default filter + rollover both take effect
  if ((location.hash || '').indexOf('tasks') > -1) {
    setTimeout(function(){
      if (typeof renderRoute === 'function') renderRoute();
    }, 80);
  }

  console.log('[apex-task-rollover] installed · default=today · hides completed >7d');
})();
