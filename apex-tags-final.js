/* ============================================================
   APEX TAGS — comprehensive subject + topic level correction
   Based on official syllabus documents for all 13 exams.
   Idempotent — running twice gives the same result.
   ============================================================ */
(function(){
  if (window._apexTagsFinal) return;
  window._apexTagsFinal = true;
  if (typeof S === 'undefined' || !Array.isArray(S.syllabus)) return;

  var ALL_EXAMS = ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'];
  var BANKING = ['RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'];

  var SUBJECT_EXAMS = {
    'maths': ALL_EXAMS,
    'reasoning': ALL_EXAMS,
    'english grammar': ALL_EXAMS,
    'descriptive english': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'general science': ['CGL','CHSL','IB ACIO'],
    'geography': ['CGL','CHSL','IB ACIO'],
    'history': ['CGL','CHSL','IB ACIO'],
    'polity': ['CGL','CHSL','IB ACIO'],
    'economics': ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','IBPS PO','RRB PO'],
    'economical issues': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'finance': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'management': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'social issues': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'environment': ['CGL','CHSL','IB ACIO','RBI GRADE B','NABARD GRADE A'],
    'ca': ALL_EXAMS,
    'misc gk': ['CGL','CHSL','IB ACIO'],
    'defence': ['CGL','CHSL','IB ACIO'],
    'ard': ['NABARD GRADE A'],
    'banking awareness': BANKING,
    'computer awareness': ['SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK','RBI ASSISTANT']
  };

  function shouldTag(topic, exam){
    var name = (topic.topic || '').toLowerCase();
    var subj = (topic.subject || '').toLowerCase();
    var allowed = SUBJECT_EXAMS[subj];
    if (!allowed) return true;
    if (allowed.indexOf(exam) === -1) return false;
    if (BANKING.indexOf(exam) > -1) {
      if (/geometry|trigonometry|mensuration|height and distance|logarithm/.test(name)) return false;
    }
    return true;
  }

  var changed = 0, sampleChanges = [];
  S.syllabus.forEach(function(t){
    if (!t || t.archived) return;
    var current = Array.isArray(t.exams) ? t.exams.slice() : [];
    var next = [];
    ALL_EXAMS.forEach(function(ex){ if (shouldTag(t, ex)) next.push(ex); });
    current.forEach(function(ex){
      if (ALL_EXAMS.indexOf(ex) === -1 && next.indexOf(ex) === -1) next.push(ex);
    });
    var a = current.slice().sort().join('|');
    var b = next.slice().sort().join('|');
    if (a !== b) {
      if (sampleChanges.length < 20) {
        sampleChanges.push(t.topic + ': [' + current.join(',') + '] -> [' + next.join(',') + ']');
      }
      t.exams = next;
      changed++;
    }
  });

  if (changed) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-tags-final] corrected ' + changed + ' topic(s)');
    sampleChanges.forEach(function(line){ console.log('  ' + line); });
  } else {
    console.log('[apex-tags-final] all tags already correct');
  }
})();
