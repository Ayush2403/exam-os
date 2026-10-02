/* ============================================================
   APEX — scroll + tag cleanup
   - Kills content-visibility scroll-anchor jump on Syllabus
   - Narrows exam tags: only tag a topic for exams that test it
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFixes) return;
  window._apexFixes = true;

  /* ---- 1. Scroll anchoring + content-visibility fix ---- */
  var st = document.createElement('style');
  st.textContent = [
    /* Anchor the syllabus list. Browser scroll anchoring fights DOM swaps. */
    '#syl-list{overflow-anchor:none}',
    '#view{overflow-anchor:none}',
    /* content-visibility on 500 rows + innerHTML rebuild = scroll jumps.
       The perf gain wasn't real on Safari anyway. Kill it. */
    '.topic-row{content-visibility:visible !important;contain-intrinsic-size:auto !important}',
    /* Also kill it on any sess-card/task-card which has the same issue on route swap */
    '#sess-list > .card, #err-list > .card, #task-board .task-card{content-visibility:visible !important}'
  ].join('\n');
  document.head.appendChild(st);

  /* ---- 2. Narrow the exam tag mapping ---- */
  /* Which exams actually test which subjects */
  var SUBJECT_EXAMS = {
    'maths':               ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'],
    'reasoning':           ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'],
    'english grammar':     ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'],
    'descriptive english': ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'general science':     ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'],
    'geography':           ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','IBPS PO','RRB PO'],
    'history':             ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','IBPS PO','RRB PO'],
    'polity':              ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','IBPS PO','RRB PO'],
    'economics':           ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','IBPS PO','RRB PO'],
    'economical issues':   ['RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A'],
    'finance':             ['RBI GRADE B','RBI GRADE A','RBI ASSISTANT'],
    'management':          ['RBI GRADE B','RBI GRADE A'],
    'social issues':       ['RBI GRADE B','RBI GRADE A','NABARD GRADE A'],
    'environment':         ['CGL','CHSL','IB ACIO','RBI GRADE B','NABARD GRADE A','SBI PO','IBPS PO'],
    'ca':                  ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'],
    'misc gk':             ['CGL','CHSL','IB ACIO','RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'],
    'defence':             ['CGL','CHSL','IB ACIO'],
    'ard':                 ['NABARD GRADE A']
  };

  /* Topics that shouldn't be in banking exams even though their subject is */
  var BANKING_EXCLUDE = [
    'trigonometry','geometry','mensuration','coordinate geometry',
    'height and distance','logarithm'
  ];

  /* Topics that shouldn't be in SSC exams even though their subject is */
  var SSC_EXCLUDE = [
    'financial statement','income statement','balance sheet','cash flow',
    'ratio analysis','time value of money','basics of accounting',
    'nbcf','financial risk','forex market','derivatives','equity market',
    'debt market','rbi and its functions','banking system',
    'financial inclusion','financial institution','corporate governance'
  ];

  function shouldExcludeTopic(topic, exam){
    var name = String(topic.topic || '').toLowerCase();
    var isBanking = ['RBI GRADE B','RBI GRADE A','RBI ASSISTANT','NABARD GRADE A','SBI PO','SBI CLERK','IBPS PO','IBPS CLERK','RRB PO','RRB CLERK'].indexOf(exam) > -1;
    var isSSC = ['CGL','CHSL','IB ACIO'].indexOf(exam) > -1;
    if (isBanking) {
      for (var i = 0; i < BANKING_EXCLUDE.length; i++) {
        if (name.indexOf(BANKING_EXCLUDE[i]) > -1) return true;
      }
    }
    if (isSSC) {
      for (var j = 0; j < SSC_EXCLUDE.length; j++) {
        if (name.indexOf(SSC_EXCLUDE[j]) > -1) return true;
      }
    }
    return false;
  }

  function narrowTags(){
    var changed = 0;
    S.syllabus.forEach(function(t){
      var subj = String(t.subject || '').toLowerCase();
      var allowed = SUBJECT_EXAMS[subj];
      if (!allowed) return;
      var current = Array.isArray(t.exams) ? t.exams : [];
      var narrowed = current.filter(function(ex){
        if (allowed.indexOf(ex) === -1) return false;
        if (shouldExcludeTopic(t, ex)) return false;
        return true;
      });
      if (narrowed.length !== current.length) {
        t.exams = narrowed;
        changed++;
      }
      /* Also prune examConfig for exams no longer tagged */
      if (t.examConfig) {
        Object.keys(t.examConfig).forEach(function(ex){
          if (narrowed.indexOf(ex) === -1) delete t.examConfig[ex];
        });
      }
    });
    return changed;
  }

  /* Run once on load, only if not already run */
  if (!S.settings._apexTagsNarrowed) {
    var n = narrowTags();
    S.settings._apexTagsNarrowed = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-fixes] narrowed tags on ' + n + ' topics');
  }

  /* Also re-run if migration ever adds new tags (defensive) */
  window.apexNarrowTags = narrowTags;

  console.log('[apex-fixes] scroll anchoring + tag narrowing installed');
})();
