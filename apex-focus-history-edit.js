/* ============================================================
   APEX — FOCUS HISTORY EDITOR v2
   Fully replaces focusHistoryModal so every row renders with
   edit / delete icons inline. No DOM matching, no races.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFocusHistoryEditV2) return;
  window._apexFocusHistoryEditV2 = true;

  function findEntry(id){
    return (S.focusLog || []).find(function(f){ return f.id === id; });
  }

  function refreshModal(){
    if (typeof closeModal === 'function') closeModal();
    setTimeout(function(){ window.focusHistoryModal(); }, 60);
  }

  // ---------- edit modal ----------
  function openEditModal(id){
    var f = findEntry(id);
    if (!f) { toast('Entry not found'); return; }
    var t = f.topicId ? topicById(f.topicId) : null;

    var body = ''
      + '<div class="sub-h">' + (t ? esc(t.topic) : 'No topic') + ' · ' + (f.startedAt || '').slice(0,10) + '</div>'
      + '<div class="f2">'
      +   '<div class="frow"><label>Minutes</label>'
      +     '<input class="inp" type="number" name="minutes" min="0" max="1440" value="' + (f.minutes || 0) + '">'
      +   '</div>'
      +   '<div class="frow"><label>Date</label>'
      +     '<input class="inp" type="date" name="date" value="' + (f.startedAt ? f.startedAt.slice(0,10) : '') + '">'
      +   '</div>'
      + '</div>'
      + '<div class="frow"><label>Label</label>'
      +   '<input class="inp" name="label" value="' + esc(f.label || '') + '">'
      + '</div>'
      + '<div class="f2">'
      +   '<div class="frow"><label>What clicked</label>'
      +     '<input class="inp" name="win" value="' + esc(f.win || '') + '" placeholder="(empty)">'
      +   '</div>'
      +   '<div class="frow"><label>Still fuzzy</label>'
      +     '<input class="inp" name="gap" value="' + esc(f.gap || '') + '" placeholder="(empty)">'
      +   '</div>'
      + '</div>'
      + '<div class="frow"><label>Linked topic</label>'
      +   (typeof pickerHTML === 'function' ? pickerHTML('topicIds', f.topicId ? [f.topicId] : [], false) : '')
      + '</div>';

    openModal('Edit focus entry', body, function(v){
      snapshot();
      var entry = findEntry(id);
      if (!entry) { toast('Entry vanished'); return true; }

      entry.minutes = Math.max(0, Math.min(1440, parseInt(v.minutes, 10) || 0));
      entry.label   = (v.label || '').trim();
      entry.win     = (v.win   || '').trim();
      entry.gap     = (v.gap   || '').trim();

      if (v.date) {
        var oldTime = entry.startedAt ? entry.startedAt.slice(11) : '00:00:00.000Z';
        entry.startedAt = v.date + 'T' + oldTime;
      }

      var ids = (typeof pickVals === 'function') ? pickVals(v.topicIds) : [];
      entry.topicId = ids[0] || null;

      saveLocal();
      rerender();
      toast('Focus entry updated');
      refreshModal();
      return true;
    }, 'Save');

    var root = document.querySelector('#modal-root');
    if (root) root.querySelectorAll('.tpick').forEach(function(el){
      if (typeof wirePicker === 'function') wirePicker(el);
    });
  }
function confirmDelete(id){
  var f = findEntry(id);
  if (!f) return;
  var label = f.label || 'Focus entry';
  var mins  = f.minutes || 0;
  var when  = f.startedAt ? f.startedAt.slice(0,10) : 'unknown date';

  openConfirm(
    'Delete "' + label + '" (' + mins + 'm on ' + when + ')? This changes your streak and focus stats for that day.',
    function(){
      snapshot();

      // 1. Write the tombstone BEFORE removing the record.
      //    mergeForSync drops any record whose _ts <= its tombstone time.
      if (!S.tombstones) S.tombstones = {};
      if (!S.tombstones.focusLog) S.tombstones.focusLog = {};
      S.tombstones.focusLog[id] = Date.now();

      // 2. Remove from the local array
      S.focusLog = (S.focusLog || []).filter(function(x){ return x.id !== id; });

      // 3. Strip the same minutes from the linked session so focus totals
      //    and session duration stay in sync (the edit file didn't do this).
      if (f.topicId && f.minutes) {
        for (var i = S.sessions.length - 1; i >= 0; i--) {
          if (S.sessions[i].topicId === f.topicId) {
            S.sessions[i].duration = Math.max(0, (S.sessions[i].duration || 0) - f.minutes);
            break;
          }
        }
      }

      S._lastLocalEdit = new Date().toISOString();
      saveLocal();

      // 4. Push immediately instead of waiting for the 500ms debounce,
      //    so a pull can't race in and resurrect the record first.
      if (typeof pushNow === 'function' && typeof syncKey !== 'undefined' && syncKey) {
        pushNow(true);
      }

      rerender();
      toast('Focus entry deleted', mins + 'm removed');
      refreshModal();
    }
  );
}
  // ---------- full replacement of focusHistoryModal ----------
  window.focusHistoryModal = function(){
    var logs = (S.focusLog || []).slice().sort(function(a,b){
      return (b.startedAt || '').localeCompare(a.startedAt || '');
    }).slice(0, 60);

    var totalToday = (typeof focusTodayMinutes === 'function') ? focusTodayMinutes() : 0;
    var totalWeek  = (typeof focusWeekMinutes  === 'function') ? focusWeekMinutes()  : 0;

    var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'
      + '<div class="detail-block" style="text-align:center;margin:0"><div class="tiny">Today</div>'
      +   '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--accent-2)">' + totalToday + 'm</div></div>'
      + '<div class="detail-block" style="text-align:center;margin:0"><div class="tiny">This week</div>'
      +   '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--accent-2)">' + totalWeek + 'm</div></div>'
      + '</div>';

    if (!logs.length) {
      body += '<div class="empty" style="padding:24px 12px"><b>Nothing yet</b><p>Complete a focus block to see it here.</p></div>';
    } else {
      body += '<div style="font:700 10px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">Recent sessions · ' + logs.length + '</div>';
      body += logs.map(function(f){
        var t = f.topicId ? topicById(f.topicId) : null;
        var when = f.startedAt ? f.startedAt.slice(0, 10) : '';
        var time = f.startedAt ? f.startedAt.slice(11, 16) : '';
        var q = f.quality != null ? f.quality : null;
        var qc = q != null ? (q >= 80 ? '#10B981' : q >= 50 ? '#F59E0B' : '#EF4444') : 'var(--text-3)';
        var qt = q != null ? (q + '%') : '—';

        return ''
          + '<div data-fh-id="' + f.id + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:var(--surface-2);margin-bottom:6px">'
          +   '<div style="flex:0 0 62px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--text-3);line-height:1.4">' + when + '<br>' + time + '</div>'
          +   '<div style="flex:1;min-width:0">'
          +     '<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.label || 'Focus session') + '</div>'
          +     '<div class="tiny" style="margin-top:2px">' + (t ? esc(t.topic) : 'No topic') + (f.win ? ' · ✓' : '') + (f.gap ? ' · ⚠' : '') + '</div>'
          +   '</div>'
          +   '<div style="flex:0 0 46px;text-align:right">'
          +     '<div style="font-family:var(--font-display);font-weight:700;font-size:15px">' + (f.minutes || 0) + 'm</div>'
          +     '<div class="tiny" style="color:' + qc + '">' + qt + '</div>'
          +   '</div>'
          +   '<button class="mini-icon" data-fh-edit="' + f.id + '" title="Edit" style="width:30px;height:30px;flex:0 0 30px">'
          +     '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>'
          +   '</button>'
          +   '<button class="mini-icon danger" data-fh-del="' + f.id + '" title="Delete" style="width:30px;height:30px;flex:0 0 30px">'
          +     '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
          +   '</button>'
          + '</div>';
      }).join('');
    }

    openModal("Focus history", body, function(){}, "Close");
    var sv = document.querySelector("[data-msave]");
    if (sv) sv.style.display = "none";

    // Wire the buttons — delegated, so it survives re-renders
    var root = document.querySelector('#modal-root');
    if (root && !root._fhWired) {
      root._fhWired = true;
      root.addEventListener('click', function(e){
        var editBtn = e.target.closest('[data-fh-edit]');
        if (editBtn) {
          e.preventDefault(); e.stopPropagation();
          openEditModal(editBtn.dataset.fhEdit);
          return;
        }
        var delBtn = e.target.closest('[data-fh-del]');
        if (delBtn) {
          e.preventDefault(); e.stopPropagation();
          confirmDelete(delBtn.dataset.fhDel);
          return;
        }
      });
    }
  };

  window.apexFocusEdit = openEditModal;
  window.apexFocusDelete = confirmDelete;

  console.log('[apex-focus-history-edit v2] installed — icons render inline');
})();