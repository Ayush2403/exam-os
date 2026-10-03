/* Restore CHSL to Coordinate Geometry. Sources: PW, Oliveboard, Sathee IIT-K, Testbook PYQ. */
(function(){
  if (window._apexFixCoordGeo) return;
  window._apexFixCoordGeo = true;
  if (typeof S === 'undefined' || !Array.isArray(S.syllabus)) return;

  var changed = 0;
  S.syllabus.forEach(function(t){
    if (!t || t.topic !== 'Coordinate Geometry') return;
    if (!Array.isArray(t.exams)) t.exams = [];
    if (t.exams.indexOf('CHSL') === -1) {
      t.exams.push('CHSL');
      t.exams.sort();
      changed++;
      console.log('[apex-fix-coordgeo] added CHSL to Coordinate Geometry');
    }
  });

  if (changed) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-fix-coordgeo] total:', changed, 'topic(s) fixed');
  } else {
    console.log('[apex-fix-coordgeo] already correct');
  }
})();
