/* ============================================================
   APEX FOCUS NOTES EDITOR
   Adds a pencil icon next to "Recent focus notes" on review
   cards. Click it to edit or clear focus notes on that topic.
   Session time is preserved — only the note text changes.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFocusNotesEdit) return;
  window._apexFocusNotesEdit = true;

  function notesFor(topicId){
    return (S.focusLog || []).filter(function(f){
      return f.topicId === topicId && (f.win || f.gap);
    }).sort(function(a, b){
      return (b.startedAt || '').localeCompare(a.startedAt || '');
    });
  }

  function openEditor(topicId){
    var t = topicById(topicId);
    if (!t) return;
    var notes = notesFor(topicId);

    var body = '<div class="sub-h">' + esc(t.topic) + ' · ' + notes.length +
               ' note' + (notes.length === 1 ? '' : 's') + '</div>';

    if (!notes.length) {
      body += '<div class="empty" style="padding:24px 12px">' +
              '<b>No focus notes</b>' +
              '<p>They come from the Focus capture modal after a session.</p>' +
              '</div>';
    } else {
      body += notes.map(function(f){
        var date = f.startedAt ? f.startedAt.slice(0, 10) : '—';
        var mins = f.minutes || 0;
        return '<div data-note-row="' + f.id + '" ' +
          'style="border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;background:var(--surface-2)">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">' +
            '<span class="tiny" style="font-family:\'JetBrains Mono\',monospace;letter-spacing:.08em">' +
              esc(date) + ' · ' + mins + 'm' +
            '</span>' +
            '<button type="button" class="mini-icon danger" data-clear-note="' + f.id + '" ' +
              'title="Clear both fields (session time stays)">×</button>' +
          '</div>' +
          '<div class="frow" style="margin:0 0 10px 0">' +
            '<label style="font-size:11px;color:var(--pri-low-fg);letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">✓ WHAT CLICKED</label>' +
            '<input class="inp" data-note-win="' + f.id + '" value="' + esc(f.win || '') + '" placeholder="(empty)">' +
          '</div>' +
          '<div class="frow" style="margin:0">' +
            '<label style="font-size:11px;color:var(--pri-medium-fg);letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">! STILL FUZZY</label>' +
            '<input class="inp" data-note-gap="' + f.id + '" value="' + esc(f.gap || '') + '" placeholder="(empty)">' +
          '</div>' +
        '</div>';
      }).join('');
    }

    openModal('Focus notes', body, function(){
      snapshot();
      var changed = 0;
      document.querySelectorAll('[data-note-win]').forEach(function(inp){
        var id = inp.getAttribute('data-note-win');
        var f = S.focusLog.find(function(x){ return x.id === id; });
        if (!f) return;
        var v = inp.value.trim();
        if ((f.win || '') !== v){ f.win = v; changed++; }
      });
      document.querySelectorAll('[data-note-gap]').forEach(function(inp){
        var id = inp.getAttribute('data-note-gap');
        var f = S.focusLog.find(function(x){ return x.id === id; });
        if (!f) return;
        var v = inp.value.trim();
        if ((f.gap || '') !== v){ f.gap = v; changed++; }
      });
      if (changed){
        saveLocal();
        rerender();
        toast('Saved', changed + ' note' + (changed === 1 ? '' : 's') + ' updated');
      } else {
        toast('No changes');
      }
      return true;
    }, 'Save');

    // Wire the × clear buttons inside the modal
    var modal = document.querySelector('.modal');
    if (modal){
      modal.addEventListener('click', function(e){
        var btn = e.target.closest('[data-clear-note]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var row = btn.closest('[data-note-row]');
        if (!row) return;
        var winInp = row.querySelector('[data-note-win]');
        var gapInp = row.querySelector('[data-note-gap]');
        if (winInp) winInp.value = '';
        if (gapInp) gapInp.value = '';
        row.style.opacity = '.4';
        btn.style.display = 'none';
        if (!row.querySelector('.apex-clear-marker')){
          var m = document.createElement('div');
          m.className = 'tiny apex-clear-marker';
          m.style.cssText = 'margin-top:8px;color:var(--pri-critical-fg);font-family:JetBrains Mono,monospace;letter-spacing:.1em';
          m.textContent = 'WILL BE CLEARED ON SAVE';
          row.appendChild(m);
        }
      });
    }
  }

  /* Inject the pencil icon into each "Recent focus notes" header */
  function addEditButtons(){
    document.querySelectorAll('.sess-notes-h').forEach(function(h){
      var txt = (h.textContent || '').trim();
      if (txt.indexOf('Recent focus notes') === -1) return;
      if (h.querySelector('[data-edit-focus-notes]')) return;

      var card = h.closest('.sess-card');
      if (!card) return;
      var sid = card.dataset.id;
      var s = S.sessions.find(function(x){ return x.id === sid; });
      if (!s || !s.topicId) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'notes-edit';
      btn.setAttribute('data-edit-focus-notes', s.topicId);
      btn.title = 'Edit focus notes';
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" ' +
        'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>';
      h.appendChild(btn);
    });
  }

  /* Click handler — open editor */
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-edit-focus-notes]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openEditor(btn.getAttribute('data-edit-focus-notes'));
  }, true);

  /* Re-run on every render */
  var view = document.getElementById('view');
  if (view){
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(addEditButtons);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(addEditButtons, 300);
  setTimeout(addEditButtons, 1000);
  setTimeout(addEditButtons, 2500);
  window.addEventListener('hashchange', function(){ setTimeout(addEditButtons, 100); });

  console.log('[apex-focus-notes-edit] installed');
})();