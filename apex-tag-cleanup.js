/* Fix wrong exam tags. Runs once. */
(function(){
  if (window._apexTagCleanup) return;
  window._apexTagCleanup = true;
  if (typeof S === 'undefined' || !Array.isArray(S.syllabus)) return;

  /* topic substring -> exams to REMOVE */
  var REMOVE = {
    "coordinate geometry": ["CHSL"],
    "trigonometry":        ["SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK","RBI ASSISTANT","RBI GRADE A","RBI GRADE B","NABARD GRADE A"],
    "mensuration":         ["SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK","RBI ASSISTANT"],
    "height and distance": ["SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK","RBI ASSISTANT","RBI GRADE A","RBI GRADE B","NABARD GRADE A"]
  };

  var changed = 0;
  S.syllabus.forEach(function(t){
    if (!t || !t.topic || !Array.isArray(t.exams)) return;
    var name = t.topic.toLowerCase();
    Object.keys(REMOVE).forEach(function(key){
      if (name.indexOf(key) === -1) return;
      var before = t.exams.length;
      t.exams = t.exams.filter(function(e){ return REMOVE[key].indexOf(e) === -1; });
      if (t.exams.length !== before) changed++;
    });
  });
  if (changed) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[tag-cleanup] cleaned ' + changed + ' topic(s)');
  }
})();
