/* Task Board — daily rollover for completed time-blocked tasks */
(function(){
  'use strict';
  if (window._apexTaskRollover) return;
  window._apexTaskRollover = true;

  function rollover(){
    if (!S.tasks) return;
    const today = todayISO();
    let dirty = false;
    S.tasks.forEach(function(t){
      if (t.tbS && !t.due && t.status === 'Completed'
          && t.completedOn && t.completedOn !== today) {
        t.status = 'Next Up';
        t.completedOn = null;
        dirty = true;
      }
    });
    if (dirty) {
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    }
  }

  /* Run on load + on every route change */
  rollover();
  window.addEventListener('hashchange', function(){ setTimeout(rollover, 80); });

  /* Also run before the task board renders */
  const _origRender = window.renderRoute;
  if (typeof _origRender === 'function') {
    window.renderRoute = function(){
      rollover();
      return _origRender.apply(this, arguments);
    };
  }

  console.log('[apex-task-rollover] installed');
})();
