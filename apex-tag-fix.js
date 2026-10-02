/* ============================================================
   APEX TAG FIX — bulk edit exam tags per topic
   ============================================================ */
(function(){
  'use strict';
  if (window._apexTagFix) return;
  window._apexTagFix = true;

  var state = { exam: '', search: '', changes: {} };

  function ensureAction(){
    if (typeof ACTIONS !== 'object') { setTimeout(ensureAction, 200); return; }
    if (ACTIONS['fix-tags']) return;
    ACTIONS['fix-tags'] = function(){ openFixer(); };
  }
  ensureAction();

  function examList(){
    var list = (S.tax && Array.isArray(S.tax.exams)) ? S.tax.exams.slice() : [];
    return list;
  }

  function isTagged(t, exam){
    return Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
  }

  function dirtyCount(){
    return Object.keys(state.changes).length;
  }

  function renderList(){
    var list = document.getElementById('tagfix-list');
    if (!list) return;
    if (!state.exam) {
      list.innerHTML = '<div class="tiny" style="padding:24px;text-align:center;color:var(--text-3)">Pick an exam to start editing its tags.</div>';
      return;
    }
    var q = state.search.toLowerCase();
    var topics = S.syllabus.filter(function(t){
      if (t.archived) return false;
      if (q && t.topic.toLowerCase().indexOf(q) === -1 && (t.subject||'').toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    topics.sort(function(a,b){
      var sa = (a.subject||'').toLowerCase(), sb = (b.subject||'').toLowerCase();
      if (sa !== sb) return sa < sb ? -1 : 1;
      return (a.topic||'').localeCompare(b.topic||'');
    });
    if (!topics.length) {
      list.innerHTML = '<div class="tiny" style="padding:24px;text-align:center;color:var(--text-3)">No topics match.</div>';
      return;
    }
    var curSubject = '';
    var html = '';
    topics.forEach(function(t){
      var subj = t.subject || '(no subject)';
      if (subj !== curSubject) {
        curSubject = subj;
        html += '<div style="font:700 10px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);padding:12px 8px 6px;border-bottom:1px solid var(--border)">' + esc(subj) + '</div>';
      }
      var tagged = isTagged(t, state.exam);
      if (state.changes[t.id] !== undefined) tagged = state.changes[t.id];
      var dirty = state.changes[t.id] !== undefined;
      html += '<label data-tagfix-row="' + esc(t.id) + '" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;' + (dirty ? 'background:rgba(167,139,250,.08);' : '') + '">';
      html += '<input type="checkbox" ' + (tagged ? 'checked' : '') + ' data-tagfix-cb="' + esc(t.id) + '" style="accent-color:var(--accent);flex-shrink:0">';
      html += '<span style="flex:1;min-width:0;font-size:13.5px;' + (dirty ? 'color:var(--accent-2);font-weight:500' : 'color:var(--text)') + '">' + esc(t.topic) + '</span>';
      if (dirty) html += '<span class="tiny" style="color:var(--accent-2);font-family:JetBrains Mono,monospace">EDIT</span>';
      html += '</label>';
    });
    list.innerHTML = html;
  }

  function renderExams(){
    var el = document.getElementById('tagfix-exams');
    if (!el) return;
    var exams = examList();
    el.innerHTML = exams.map(function(ex){
      var on = state.exam === ex;
      return '<button class="chip' + (on ? ' on' : '') + '" data-tagfix-exam="' + esc(ex) + '" style="padding:6px 12px;min-height:32px;font-size:11.5px">' + esc(ex) + '</button>';
    }).join('');
  }

  function refreshDirty(){
    var d = document.getElementById('tagfix-dirty');
    if (!d) return;
    var n = dirtyCount();
    d.textContent = n === 0 ? 'No changes yet' : (n + ' topic' + (n === 1 ? '' : 's') + ' changed');
    d.style.color = n === 0 ? 'var(--text-3)' : 'var(--accent-2)';
    d.style.fontWeight = n === 0 ? '400' : '600';
  }

  function openFixer(){
    var body = ''
      + '<div style="font-size:13px;line-height:1.7;color:var(--text-2);margin-bottom:16px">'
      +   'Pick an exam. Toggle topics to add or remove that exam tag. Save applies all changes in one go.'
      + '</div>'
      + '<div id="tagfix-exams" class="chips" style="gap:6px;margin-bottom:16px"></div>'
      + '<div class="inp-wrap" style="margin-bottom:12px">'
      +   '<input class="inp" id="tagfix-search" placeholder="Search topics or subjects…" autocomplete="off">'
      + '</div>'
      + '<div id="tagfix-list" style="max-height:56vh;overflow-y:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)"></div>'
      + '<div id="tagfix-dirty" class="tiny" style="margin-top:12px;font-family:JetBrains Mono,monospace;letter-spacing:.1em">No changes yet</div>';

    openModal('Fix exam tags', body, function(){
      var n = dirtyCount();
      if (!n) { toast('Nothing to save'); return true; }
      snapshot();
      var applied = 0;
      Object.keys(state.changes).forEach(function(id){
        var t = S.syllabus.find(function(x){ return x.id === id; });
        if (!t) return;
        var want = state.changes[id];
        if (!Array.isArray(t.exams)) t.exams = [];
        var has = t.exams.indexOf(state.exam) > -1;
        if (want && !has) { t.exams.push(state.exam); applied++; }
        else if (!want && has) { t.exams = t.exams.filter(function(e){ return e !== state.exam; }); applied++; }
      });
      saveLocal();
      state.changes = {};
      toast('Saved ' + applied + ' change' + (applied === 1 ? '' : 's'));
      rerender();
      return true;
    }, 'Save all');

    state.exam = state.exam || (examList()[0] || '');
    state.search = '';
    state.changes = {};

    renderExams();
    renderList();
    refreshDirty();

    var modal = document.querySelector('.modal');
    if (!modal) return;
    var mbody = modal.querySelector('.mbody');
    if (mbody) mbody.style.maxHeight = '70vh';

    var examsEl = document.getElementById('tagfix-exams');
    if (examsEl) examsEl.addEventListener('click', function(e){
      var b = e.target.closest('[data-tagfix-exam]');
      if (!b) return;
      state.exam = b.getAttribute('data-tagfix-exam');
      state.changes = {};
      renderExams();
      renderList();
      refreshDirty();
    });

    var searchEl = document.getElementById('tagfix-search');
    if (searchEl) searchEl.addEventListener('input', function(e){
      state.search = e.target.value;
      renderList();
    });

    var listEl = document.getElementById('tagfix-list');
    if (listEl) listEl.addEventListener('change', function(e){
      var cb = e.target.closest('[data-tagfix-cb]');
      if (!cb) return;
      var id = cb.getAttribute('data-tagfix-cb');
      var t = S.syllabus.find(function(x){ return x.id === id; });
      if (!t) return;
      var orig = isTagged(t, state.exam);
      var want = cb.checked;
      if (want === orig) delete state.changes[id];
      else state.changes[id] = want;
      renderList();
      refreshDirty();
    });

    console.log('[apex-tag-fix] fixer opened for', state.exam);
  }
})();
