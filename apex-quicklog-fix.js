/* ============================================================
   APEX QUICK LOG UX FIX
   Stops the dropdown from instantly submitting the log.
   Instead, it fills the input so you can add duration/fragments.
   ============================================================ */
(function(){
  if (window._apexQuickLogFix) return;
  window._apexQuickLogFix = true;

  // Use capture phase to beat the old listeners in index.html
  document.addEventListener('click', function(e) {
    
    // 1. Handle Topic Pick
    const topicPick = e.target.closest('[data-quicklog-pick]');
    if (topicPick) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();

      const inp = document.querySelector('[data-quicklog-input]');
      if (!inp) return;

      const t = topicById(topicPick.dataset.quicklogPick);
      if (!t) return;

      // Parse what they already typed to keep the duration
      const parsed = quickLogParse(inp.value);
      let suffix = "";
      if (parsed.minutes > 0) {
          suffix = " " + parsed.minutes + "m";
      }

      // Fill the input: "TopicName 45m "
      inp.value = t.topic + suffix + " ";
      inp.focus();

      // Close the dropdown
      const box = document.querySelector('[data-quicklog-suggest]');
      if (box) { box.innerHTML = ''; box.classList.remove('on'); }
      return;
    }

    // 2. Handle Fragment Pick (from the fragment picker script)
    const fragPick = e.target.closest('[data-apex-frag]');
    if (fragPick) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();

      const inp = document.querySelector('[data-quicklog-input]');
      if (!inp) return;

      const frag = fragPick.getAttribute('data-apex-frag');
      const topicId = fragPick.getAttribute('data-apex-topic');
      const t = topicById(topicId);

      // Parse what they already typed to keep the duration
      const parsed = quickLogParse(inp.value);
      let suffix = "";
      if (parsed.minutes > 0) {
          suffix = " " + parsed.minutes + "m";
      }

      // Fill the input: "TopicName: fragment 45m "
      inp.value = (t ? t.topic : "") + ": " + frag + suffix + " ";
      inp.focus();

      // Close the dropdown
      const box = document.querySelector('[data-quicklog-suggest]');
      if (box) { box.innerHTML = ''; box.classList.remove('on'); }
      return;
    }
  }, true); // True = capture phase

  console.log('[apex-quicklog-fix] installed');
})();