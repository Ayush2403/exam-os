/* ============================================================
   APEX AUTO-STAGE SYNC
   Logging a session for a "Not started" topic automatically
   moves it to "Learning" in the syllabus.
   ============================================================ */
(function(){
  if (window._apexAutoStage) return;
  window._apexAutoStage = true;

  function promoteTopic(topicId) {
    if (!topicId) return;
    const t = topicById(topicId);
    if (t && t.status === "Not started") {
      t.status = "Learning";
      // We don't call saveLocal() here because the caller (session creation) will handle it.
      console.log("[auto-stage] Promoted topic to Learning:", t.topic);
    }
  }

  // 1. Hook into manual Session Modal
  const _origSessionModal = window.sessionModal || sessionModal;
  window.sessionModal = function(s, prefillTopicId) {
    // Pass a wrapped callback if the original function allows it, 
    // but since we can't easily intercept the inner save function, 
    // we intercept the creation globally instead.
    return _origSessionModal.apply(this, arguments);
  };

  // 2. Intercept the global `edit` function which is called when sessions are saved
  const _origEdit = window.edit || edit;
  window.edit = function(fn) {
    // We wrap the edit function to check if a session was just added/updated
    _origEdit(function() {
      fn();
      
      // After the edit, scan for "Not started" topics that have sessions
      // (This is a bit heavy, so we only do it if we suspect a session was added)
      if (S.sessions.length > 0) {
        const recentlyTouched = new Set();
        // Look at the last 3 sessions (newest first)
        for (let i = S.sessions.length - 1; i >= Math.max(0, S.sessions.length - 3); i--) {
          if (S.sessions[i].topicId) recentlyTouched.add(S.sessions[i].topicId);
        }
        
        recentlyTouched.forEach(id => promoteTopic(id));
      }
    });
  };
  try { edit = window.edit; } catch(e){}

  // 3. Hook directly into Quick Log for immediate feedback
  const _origQuickLogDo = window.quickLogDo || quickLogDo;
  window.quickLogDo = function(forcedTopicId) {
    // We can intercept the input before it processes to grab the topic ID
    const inp = document.querySelector("[data-quicklog-input]");
    let targetTopicId = forcedTopicId;

    // If no forced ID, try to guess it from the input text using the same logic
    if (!targetTopicId && inp && inp.value) {
      const parsed = quickLogParse(inp.value);
      const split = _fragmentSplit(parsed.topicText);
      const matches = quickLogSuggest(split.topicText);
      if (matches.length > 0) targetTopicId = matches[0].id;
    }

    if (targetTopicId) promoteTopic(targetTopicId);

    return _origQuickLogDo.apply(this, arguments);
  };
  try { quickLogDo = window.quickLogDo; } catch(e){}

  console.log('[apex-auto-stage] installed — sessions will auto-promote syllabus topics');
})();