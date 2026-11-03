/* ============================================================
   APEX AUTO-STAGE SWEEPER v3
   Scans data on boot, route change, and session creation to
   ensure any topic with a session is promoted to "Learning".
   ============================================================ */
(function(){
  if (window._apexAutoStageV3) return;
  window._apexAutoStageV3 = true;

  function sweep() {
    if (!window.S || !S.sessions || !S.syllabus) return;
    
    // 1. Collect all topic IDs that have a logged session
    const activeIds = new Set();
    S.sessions.forEach(s => { 
      if (s.topicId) activeIds.add(s.topicId); 
    });
    
    // 2. Find any "Not started" topic that is in that set
    let changed = 0;
    S.syllabus.forEach(t => {
      if (t.status === "Not started" && activeIds.has(t.id)) {
        t.status = "Learning";
        changed++;
      }
    });

    // 3. Save if anything changed
    if (changed > 0) {
      console.log(`[auto-stage] Promoted ${changed} topic(s) to Learning`);
      S._lastLocalEdit = new Date().toISOString();
      if (window.idb) window.idb.set(KEY, JSON.stringify(S));
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
      if (typeof renderSylList === 'function') renderSylList();
      if (typeof queueSync === 'function') queueSync();
    }
  }

  // 1. Run on boot (fixes existing data like your "Boat and Stream")
  setTimeout(sweep, 1500);
  setTimeout(sweep, 3500);

  // 2. Run on route change
  window.addEventListener('hashchange', () => setTimeout(sweep, 500));

  // 3. Hook into the specific actions that log time
  if (typeof ACTIONS === 'object') {
    // When Quick Log is used
    const _origQl = ACTIONS['quicklog-go'];
    if (_origQl) {
      ACTIONS['quicklog-go'] = function() {
        const res = _origQl.apply(this, arguments);
        setTimeout(sweep, 200); // wait for the app to save, then sweep
        return res;
      };
    }
    // When Focus Timer is completed
    const _origFocus = ACTIONS['focus-complete'];
    if (_origFocus) {
      ACTIONS['focus-complete'] = function() {
        const res = _origFocus.apply(this, arguments);
        setTimeout(sweep, 200);
        return res;
      };
    }
  }

  // 4. Run when you open a Topic Detail modal (catches the screenshot case immediately)
  if (typeof window.topicDetail === 'function') {
    const _origDetail = window.topicDetail;
    window.topicDetail = function() {
      sweep(); // sweep before showing the modal
      return _origDetail.apply(this, arguments);
    };
    try { topicDetail = window.topicDetail; } catch(e){}
  }

  console.log('[apex-auto-stage v3] Sweeper installed');
})();