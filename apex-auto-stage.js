/* ============================================================
   APEX AUTO-STAGE SYNC V2
   Hooks into saveLocal() to ensure any topic with a logged
   session is automatically moved from "Not started" to "Learning".
   ============================================================ */
(function(){
  if (window._apexAutoStageV2) return;
  window._apexAutoStageV2 = true;

  function promoteTopics() {
    if (!window.S || !S.sessions || !S.syllabus) return;
    
    // 1. Find every topicId that has a logged session
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

    if (changed > 0) {
      console.log(`[auto-stage] Promoted ${changed} topic(s) to Learning`);
    }
  }

  // 3. Wrap saveLocal (which is called after every data mutation)
  const _origSave = window.saveLocal || saveLocal;
  window.saveLocal = function() {
    promoteTopics();
    return _origSave.apply(this, arguments);
  };
  try { saveLocal = window.saveLocal; } catch(e){}
  
  // 4. Run once on boot just in case there are existing unsynced topics
  setTimeout(promoteTopics, 2000);
  
  console.log('[apex-auto-stage v2] installed — wrapping saveLocal');
})();