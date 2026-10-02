/* Correct math tags for geometry-heavy topics.
   Banking exams + IB ACIO + NABARD don't test them. Only SSC does. */
(function(){
  if (window._apexMathTags) return;
  window._apexMathTags = true;
  if (typeof S === 'undefined' || !Array.isArray(S.syllabus)) return;

  var CORRECT = {
    "coordinate geometry": ["CGL"],
    "trigonometry":        ["CGL","CHSL"],
    "mensuration 2d 3d":   ["CGL","CHSL"],
    "height and distance": ["CGL","CHSL"],
    "geometry":            ["CGL","CHSL"]
  };

  var changed = 0;
  S.syllabus.forEach(function(t){
    if (!t || !t.topic) return;
    var name = t.topic.toLowerCase().trim();
    var fix = CORRECT[name];
    if (!fix) return;
    var cur = Array.isArray(t.exams) ? t.exams.slice().sort().join(",") : "";
    var want = fix.slice().sort().join(",");
    if (cur !== want) {
      t.exams = fix.slice();
      changed++;
      console.log('[apex-math-tags] fixed:', t.topic, "->", fix.join("+"));
    }
  });

  if (changed) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-math-tags] total:', changed, "topic(s) corrected");
  } else {
    console.log('[apex-math-tags] all correct already');
  }
})();

/* Re-render syllabus if the fix changed anything, so the DOM
   reflects the corrected tags without needing a manual reload. */
(function(){
  if (window._apexMathTagsRendered) return;
  window._apexMathTagsRendered = true;
  if (typeof S === 'undefined' || !Array.isArray(S.syllabus)) return;
  /* Only re-render if the syllabus page is visible */
  if ((location.hash || '').replace(/^#\/?/, '') !== 'syllabus') return;
  setTimeout(function(){
    if (typeof window.renderSylList === 'function') {
      try { window.renderSylList(); } catch(e){}
    }
    if (typeof window.apexPillSweep === 'function') {
      try { window.apexPillSweep(); } catch(e){}
    }
  }, 400);
})();
