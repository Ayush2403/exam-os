/* ============================================================
   APEX TAG FIX v2 — bulk-first
   - Click a subject header → select/deselect all its topics
   - "Select all visible" respects search filter
   - Live counter: X of Y tagged for this exam
   - Save applies every pending change in one pass
   ============================================================ */
(function(){
  'use strict';
  if (window._apexTagFixV2) return;
  window._apexTagFixV2 = true;
  window._apexTagFix = true;

  var state = { exam: '', search: '', changes: {} };

  function examList(){
    return (S.tax && Array.isArray(S.tax.exams)) ? S.tax.exams.slice() : [];
  }
  function isTagged(t, exam){
    return Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
  }
  function dirtyCount(){ return Object.keys(state.changes).length; }

  function filteredTopics(){
    var q = state.search.toLowerCase();
    return S.syllabus.filter(function(t){
      if (t.archived) return false;
      if (q && t.topic.toLowerCase().indexOf(q) === -1
            && (t.subject||'').toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function(a,b){
      var sa = (a.subject||'').toLowerCase(), sb = (b.subject||'').toLowerCase();
      if (sa !== sb) return sa < sb ? -1 : 1;
      return (a.topic||'').localeCompare(b.topic||'');
    });
  }

  function renderList(){
    var list = document.getElementById('tagfix-list');
    if (!list) return;
    if (!state.exam) {
      list.innerHTML = '<div class="tiny" style="padding:24px;text-align:center;color:var(--text-3)">Pick an exam to start editing its tags.</div>';
      return;
    }

    var topics = filteredTopics();
    if (!topics.length) {
      list.innerHTML = '<div class="tiny" style="padding:24px;text-align:center;color:var(--text-3)">No topics match.</div>';
      return;
    }

    // Group by subject
    var bySub = {};
    topics.forEach(function(t){
      var s = t.subject || '(no subject)';
      if (!bySub[s]) bySub[s] = [];
      bySub[s].push(t);
    });

    var html = '';
    Object.keys(bySub).sort().forEach(function(sub){
      var items = bySub[sub];
      var tagged = items.filter(function(t){
        return state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
      }).length;
      var allOn = tagged === items.length;
      var someOn = tagged > 0 && !allOn;

      html += '<div style="border-bottom:1px solid var(--border)">';
      html += '<div data-tagfix-sub="' + esc(sub) + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;background:var(--surface-3);position:sticky;top:0;z-index:2">';
      html += '<input type="checkbox" data-tagfix-sub-cb="' + esc(sub) + '" ' + (allOn ? 'checked' : '') + (someOn ? ' data-indeterminate="1"' : '') + ' style="accent-color:var(--accent);flex-shrink:0;pointer-events:none">';
      html += '<span style="flex:1;font-weight:600;font-size:13px;text-transform:capitalize">' + esc(sub) + '</span>';
      html += '<span class="tiny" style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--text-3)">' + tagged + '/' + items.length + '</span>';
      html += '</div>';

      items.forEach(function(t){
        var on = state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
        var dirty = state.changes[t.id] !== undefined;
        html += '<label data-tagfix-row="' + esc(t.id) + '" style="display:flex;align-items:center;gap:12px;padding:8px 12px 8px 34px;border-top:1px solid var(--border);cursor:pointer;' + (dirty ? 'background:rgba(167,139,250,.07);' : '') + '">';
        html += '<input type="checkbox" ' + (on ? 'checked' : '') + ' data-tagfix-cb="' + esc(t.id) + '" style="accent-color:var(--accent);flex-shrink:0">';
        html += '<span style="flex:1;min-width:0;font-size:13px;' + (dirty ? 'color:var(--accent-2);font-weight:500' : 'color:var(--text)') + '">' + esc(t.topic) + '</span>';
        if (dirty) html += '<span class="tiny" style="color:var(--accent-2);font-family:JetBrains Mono,monospace">EDIT</span>';
        html += '</label>';
      });
      html += '</div>';
    });

    list.innerHTML = html;

    // Apply indeterminate state via JS (can't be set via HTML attr)
    Object.keys(bySub).forEach(function(sub){
      var items = bySub[sub];
      var tagged = items.filter(function(t){
        return state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
      }).length;
      var cb = list.querySelector('[data-tagfix-sub-cb="' + sub.replace(/"/g, '\\"') + '"]');
      if (cb) cb.indeterminate = tagged > 0 && tagged < items.length;
    });
  }

  function renderExams(){
    var el = document.getElementById('tagfix-exams');
    if (!el) return;
    el.innerHTML = examList().map(function(ex){
      return '<button class="chip' + (state.exam === ex ? ' on' : '') + '" data-tagfix-exam="' + esc(ex) + '" style="padding:6px 12px;min-height:32px;font-size:11.5px">' + esc(ex) + '</button>';
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
      +   'Pick an exam, then <b>click a subject header to toggle every topic in that subject</b>. '
      +   'Or tick individual topics. Save applies all changes at once.'
      + '</div>'
      + '<div id="tagfix-exams" class="chips" style="gap:6px;margin-bottom:14px"></div>'
      + '<div style="display:flex;gap:8px;margin-bottom:12px">'
      +   '<input class="inp" id="tagfix-search" placeholder="Search topics or subjects…" autocomplete="off" style="flex:1">'
      +   '<button class="btn sm" id="tagfix-selectall">All visible</button>'
      +   '<button class="btn sm ghost" id="tagfix-clearall">None</button>'
      + '</div>'
      + '<div id="tagfix-list" style="max-height:52vh;overflow-y:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface-2)"></div>'
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
    if (modal) {
      var mbody = modal.querySelector('.mbody');
      if (mbody) mbody.style.maxHeight = '72vh';
    }

    // Exam picker
    document.getElementById('tagfix-exams').addEventListener('click', function(e){
      var b = e.target.closest('[data-tagfix-exam]');
      if (!b) return;
      state.exam = b.getAttribute('data-tagfix-exam');
      state.changes = {};
      renderExams();
      renderList();
      refreshDirty();
    });

    // Search
    document.getElementById('tagfix-search').addEventListener('input', function(e){
      state.search = e.target.value;
      renderList();
    });

    // Select all visible
    document.getElementById('tagfix-selectall').addEventListener('click', function(){
      var topics = filteredTopics();
      topics.forEach(function(t){
        var orig = isTagged(t, state.exam);
        if (!orig) state.changes[t.id] = true;
        else if (state.changes[t.id] === false) delete state.changes[t.id];
      });
      renderList();
      refreshDirty();
    });

    // Clear all visible
    document.getElementById('tagfix-clearall').addEventListener('click', function(){
      var topics = filteredTopics();
      topics.forEach(function(t){
        var orig = isTagged(t, state.exam);
        if (orig) state.changes[t.id] = false;
        else if (state.changes[t.id] === true) delete state.changes[t.id];
      });
      renderList();
      refreshDirty();
    });

    // List interactions
    document.getElementById('tagfix-list').addEventListener('click', function(e){
      // Subject header click — toggle whole subject
      var subHead = e.target.closest('[data-tagfix-sub]');
      if (subHead) {
        var sub = subHead.getAttribute('data-tagfix-sub');
        var items = S.syllabus.filter(function(t){
          return !t.archived && (t.subject || '(no subject)') === sub;
        });
        var tagged = items.filter(function(t){
          return state.changes[t.id] !== undefined ? state.changes[t.id] : isTagged(t, state.exam);
        }).length;
        var wantOn = tagged < items.length;  // if not all on, turn all on; else turn all off
        items.forEach(function(t){
          var orig = isTagged(t, state.exam);
          if (wantOn && !orig) state.changes[t.id] = true;
          else if (!wantOn && orig) state.changes[t.id] = false;
          else delete state.changes[t.id];
        });
        renderList();
        refreshDirty();
        return;
      }
      // Individual checkbox
      var cb = e.target.closest('[data-tagfix-cb]');
      if (cb) {
        e.preventDefault();
        var id = cb.getAttribute('data-tagfix-cb');
        var t = S.syllabus.find(function(x){ return x.id === id; });
        if (!t) return;
        var orig = isTagged(t, state.exam);
        var want = !cb.checked;  // will flip
        if (want === orig) delete state.changes[id];
        else state.changes[id] = want;
        renderList();
        refreshDirty();
      }
    });
  }

  if (typeof ACTIONS === 'object') {
    ACTIONS['fix-tags'] = openFixer;
  }

  console.log('[apex-tag-fix] v2 installed — bulk subject toggles');
})();