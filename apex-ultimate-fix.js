/* ============================================================
   APEX ULTIMATE FIX v1
   1. Auto-Stage Sweeper (fixes window.S bug)
   2. Quick Log Single-Enter UX
   ============================================================ */
(function(){
  if (window._apexUltimateFix) return;
  window._apexUltimateFix = true;

  // --- 1. AUTO-STAGE SWEEPER ---
  function sweep() {
    // We use typeof S, not window.S, because S is a global let variable
    if (typeof S === 'undefined' || !S || !S.sessions || !S.syllabus) return;
    
    let changed = 0;
    const activeIds = new Set(S.sessions.map(s => s.topicId).filter(Boolean));
    
    S.syllabus.forEach(t => {
      if (t.status === "Not started" && activeIds.has(t.id)) {
        t.status = "Learning";
        changed++;
      }
    });

    if (changed > 0) {
      console.log(`[auto-stage] Promoted ${changed} topic(s) to Learning`);
      
      // Save
      if (typeof saveLocal === 'function') saveLocal();
      else if (window.saveLocal) window.saveLocal();
      
      // Re-render
      if (typeof renderSylList === 'function') renderSylList();
      if (typeof rerender === 'function') rerender();
    }
  }

  // Run on boot, interval, and hashchange
  setTimeout(sweep, 1000);
  setTimeout(sweep, 2500);
  setInterval(sweep, 3000);
  window.addEventListener('hashchange', () => setTimeout(sweep, 200));

  // Hook into the Topic Detail modal specifically
  if (typeof ACTIONS === 'object') {
    const _origDetail = ACTIONS['topic-detail'];
    if (_origDetail) {
      ACTIONS['topic-detail'] = function(id) {
        sweep(); // Sweep right before the modal opens
        return _origDetail(id);
      };
    }
  }

  // --- 2. QUICK LOG UX FIX ---
  // Intercept the Enter key in the capture phase before the app does
  document.addEventListener('keydown', function(e) {
    const inp = e.target.closest('[data-quicklog-input]');
    if (!inp) return;
    
    if (e.key === 'Enter') {
      const box = document.querySelector('[data-quicklog-suggest]');
      if (box && box.classList.contains('on')) {
        const items = box.querySelectorAll('.ql-sug-item');
        if (items.length > 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
          
          // Pick the highlighted item, or just the first one
          const target = box.querySelector('.ql-sug-item.hl') || items[0];
          target.click(); // Fills the input and closes the box
          return;
        }
      }
    }
  }, true); // Capture phase is crucial here

  console.log('[apex-ultimate-fix] installed');
})();