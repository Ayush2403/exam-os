/* ============================================================
   APEX SYLLABUS FOCUS — priority auto-expand + exam-only filter
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSylFocus) return;
  window._apexSylFocus = true;

  var FILTER_KEY = 'apex-syl-only-exam';
  var SEED_FLAG = '_apexPriorityExpandV1';

  /* ── 1. Top-N subjects by average computed priority for active exam ── */
  function topSubjectsByPriority(n){
    if (!S.syllabus) return [];
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return [];
    var bySub = {};
    S.syllabus.forEach(function(t){
      if (t.archived) return;
      if (!Array.isArray(t.exams) || t.exams.indexOf(exam) === -1) return;
      var score = 0;
      try {
        if (typeof window.computeTopicPriority === 'function') {
          score = window.computeTopicPriority(t, exam) || 0;
        }
      } catch(e){}
      if (!bySub[t.subject]) bySub[t.subject] = { sum:0, count:0 };
      bySub[t.subject].sum += score;
      bySub[t.subject].count++;
    });
    return Object.keys(bySub)
      .map(function(s){ return { sub:s, avg: bySub[s].sum / Math.max(1, bySub[s].count) }; })
      .sort(function(a,b){ return b.avg - a.avg; })
      .slice(0, n)
      .map(function(x){ return x.sub; });
  }

  function allSubjects(){
    var set = {};
    S.syllabus.forEach(function(t){ if (t.subject && !t.archived) set[t.subject] = 1; });
    return Object.keys(set);
  }

  /* ── 2. Collapse all but top N ── */
  function collapseToTop(n){
    var top = topSubjectsByPriority(n);
    if (!top.length) return null;
    var closed = {};
    allSubjects().forEach(function(s){ if (top.indexOf(s) === -1) closed[s] = true; });
    var st = { closed: closed, closedTopics: {} };
    try {
      var raw = localStorage.getItem('apex-syl-state-v1');
      if (raw) {
        var prev = JSON.parse(raw);
        if (prev && prev.closedTopics) st.closedTopics = prev.closedTopics;
      }
      localStorage.setItem('apex-syl-state-v1', JSON.stringify(st));
    } catch(e){}
    if (typeof renderSylList === 'function') renderSylList();
    return top;
  }

  /* ── 3. Exam-only filter ── */
  function filterOn(){
    try { return localStorage.getItem(FILTER_KEY) === '1'; } catch(e){ return false; }
  }
  function setFilter(on){
    try { localStorage.setItem(FILTER_KEY, on ? '1' : '0'); } catch(e){}
  }
  function activeExamSubjects(){
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return null;
    var subs = {};
    S.syllabus.forEach(function(t){
      if (t.archived) return;
      if (Array.isArray(t.exams) && t.exams.indexOf(exam) > -1) subs[t.subject] = 1;
    });
    return subs;
  }
  function applyFilter(){
    var list = document.getElementById('syl-list');
    if (!list) return;
    var on = filterOn();
    var groups = list.querySelectorAll('.subj-group');
    if (!on) {
      for (var i=0;i<groups.length;i++) groups[i].style.display = '';
      return;
    }
    var subs = activeExamSubjects();
    if (!subs) { for (var j=0;j<groups.length;j++) groups[j].style.display = ''; return; }
    for (var k=0;k<groups.length;k++) {
      groups[k].style.display = subs[groups[k].dataset.subj] ? '' : 'none';
    }
  }

  /* ── 4. Toolbar chip ── */
  function injectChip(){
    var row = document.querySelector('.toolbar .chips-scroll') || document.querySelector('.toolbar .row');
    if (!row) return;
    if (row.querySelector('.apex-only-exam-chip')) {
      var existing = row.querySelector('.apex-only-exam-chip');
      var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
      var label = 'Only ' + (exam || 'exam') + ' subjects';
      if (existing.textContent !== label) existing.textContent = label;
      return;
    }
    var chip = document.createElement('button');
    chip.className = 'chip apex-only-exam-chip';
    chip.style.cssText = 'flex-shrink:0;margin-left:auto';
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    chip.textContent = 'Only ' + (exam || 'exam') + ' subjects';
    if (filterOn()) chip.classList.add('on');
    chip.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var next = !filterOn();
      setFilter(next);
      chip.classList.toggle('on', next);
      applyFilter();
    });
    row.appendChild(chip);
  }

  /* ── 5. Manual action — collapse to top 2 ── */
  function registerAction(){
    if (typeof ACTIONS !== 'object' || !ACTIONS) { setTimeout(registerAction, 200); return; }
    if (ACTIONS['syl-focus-top']) return;
    ACTIONS['syl-focus-top'] = function(){
      var top = collapseToTop(2);
      if (!top || !top.length) { toast('No exam active'); return; }
      toast('Focused on ' + top.join(' + '), 'Other subjects collapsed');
      setTimeout(applyFilter, 120);
    };
  }
  registerAction();

  /* ── 6. One-time seed for fresh installs ── */
  function seedOnce(){
    if (!S.settings) return;
    if (S.settings[SEED_FLAG]) return;
    var raw = null;
    try { raw = localStorage.getItem('apex-syl-state-v1'); } catch(e){}
    var st = raw ? JSON.parse(raw) : null;
    var alreadyCustomized = st && st.closed && Object.keys(st.closed).length > 0;
    S.settings[SEED_FLAG] = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (!alreadyCustomized) collapseToTop(2);
  }

  /* ── 7. Hook up on render ── */
  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){ injectChip(); applyFilter(); });
    }).observe(view, { childList: true, subtree: false });
  }
  setTimeout(function(){ injectChip(); applyFilter(); }, 400);
  setTimeout(function(){ injectChip(); applyFilter(); }, 1200);
  setInterval(function(){ injectChip(); applyFilter(); }, 2000);
  seedOnce();

  console.log('[apex-syl-focus] installed · top subjects:', topSubjectsByPriority(2).join(' + ') || 'none');
})();
