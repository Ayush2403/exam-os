/* ============================================================
   APEX NEW EXAM — add arbitrary exam tags from the UI
   ============================================================ */
(function(){
  'use strict';
  if (window._apexNewExam) return;
  window._apexNewExam = true;

  /* ---- 1. Inject "+ Add a new exam tag" into Exam Target modals ---- */
  function injectButton(modal){
    var h3 = modal.querySelector('h3');
    if (!h3) return;
    if (!/exam target/i.test(h3.textContent)) return;
    if (modal.querySelector('.apex-new-exam-btn')) return;

    var sel = modal.querySelector('select[name="examTag"]');
    if (!sel) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'apex-new-exam-btn btn ghost sm';
    btn.style.cssText = 'margin-top:8px;font-size:11px;letter-spacing:.08em';
    btn.textContent = '+ Add a new exam tag';
    sel.parentElement.appendChild(btn);

    btn.addEventListener('click', function(){
      var name = prompt('New exam tag — e.g. "SSC MTS", "RRB NTPC", "IBPS SO":');
      if (!name) return;
      name = name.trim().toUpperCase();
      if (!name) return;
      if (!Array.isArray(S.tax.exams)) S.tax.exams = [];

      if (S.tax.exams.indexOf(name) === -1) {
        S.tax.exams.push(name);
        try { store.set(KEY, JSON.stringify(S)); } catch(e){}
        toast('Added', '"' + name + '" is now available everywhere');
      } else {
        toast('Already exists', 'Selecting "' + name + '"');
      }

      /* Rebuild the select options */
      sel.innerHTML = '<option value="">— None (generic) —</option>';
      S.tax.exams.forEach(function(e){
        var o = document.createElement('option');
        o.value = e;
        o.textContent = e;
        sel.appendChild(o);
      });
      sel.value = name;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }

  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    new MutationObserver(function(){
      var modal = modalRoot.querySelector('.modal');
      if (modal) injectButton(modal);
    }).observe(modalRoot, { childList: true, subtree: true });
  }

  /* ---- 2. Auto-discover exam tags from syllabus (bulk import path) ---- */
  function scanUntrackedTags(){
    if (!S.syllabus || !Array.isArray(S.syllabus)) return 0;
    if (!Array.isArray(S.tax.exams)) S.tax.exams = [];
    var seen = {};
    S.tax.exams.forEach(function(e){ if (e) seen[e.toLowerCase()] = e; });
    var added = 0;
    S.syllabus.forEach(function(t){
      if (!Array.isArray(t.exams)) return;
      t.exams.forEach(function(e){
        if (!e || typeof e !== 'string') return;
        var k = e.toLowerCase();
        if (seen[k]) return;
        seen[k] = e;
        S.tax.exams.push(e);
        added++;
      });
    });
    if (added) {
      try { store.set(KEY, JSON.stringify(S)); } catch(err){}
      console.log('[apex-new-exam] discovered ' + added + ' new exam tag' + (added === 1 ? '' : 's') + ' from syllabus');
    }
    return added;
  }

  window.apexScanExamTags = scanUntrackedTags;

  /* Run once on load and every few seconds to catch bulk imports */
  setTimeout(scanUntrackedTags, 1500);
  setInterval(scanUntrackedTags, 3000);

  console.log('[apex-new-exam] installed');
})();
