/* ============================================================
   APEX — SYNC-SAFE DELETE + TOMBSTONE-AWARE MERGE
   Fixes: focus entries "coming back" after delete because the
   merge unioned by ID with the server's stale copy.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexFocusSyncSafe) return;
  window._apexFocusSyncSafe = true;

  if (!S.tombstones) S.tombstones = {};
  if (!S.tombstones.focusLog) S.tombstones.focusLog = {};

  // ---------- tombstone-aware merge ----------
  window.mergeForSync = function(local, remote){
    var COLLECTIONS = [
      "syllabus","sessions","errors","mocks","tasks","links",
      "focusLog","pyqLog","activity","resources","questions","scratch"
    ];

    function mergeByIdTs(a, b){
      if(!Array.isArray(a) && !Array.isArray(b)) return a || b || [];
      if(!Array.isArray(a)) return b || [];
      if(!Array.isArray(b)) return a || [];
      var map = new Map();
      b.forEach(function(x){ if (x && x.id) map.set(x.id, x); });
      a.forEach(function(x){
        if (!x || !x.id) return;
        var ex = map.get(x.id);
        if (!ex) { map.set(x.id, x); return; }
        var tA = x._ts || 0, tB = ex._ts || 0;
        if (tA >= tB) map.set(x.id, x);
      });
      return Array.from(map.values());
    }

    var out = Object.assign({}, remote, local);
    out._deviceId = local._deviceId || remote._deviceId;
    out._lastLocalEdit = local._lastLocalEdit || remote._lastLocalEdit;
    out._lastSync = new Date().toISOString();

    COLLECTIONS.forEach(function(k){
      out[k] = mergeByIdTs(local[k], remote[k]);
    });

    out.tombstones = {};
    COLLECTIONS.forEach(function(coll){
      var rt = (remote.tombstones && remote.tombstones[coll]) || {};
      var lt = (local.tombstones  && local.tombstones[coll])  || {};
      var merged = Object.assign({}, rt, lt);
      Object.keys(rt).forEach(function(id){
        if (!merged[id] || rt[id] > merged[id]) merged[id] = rt[id];
      });
      out.tombstones[coll] = merged;
    });

    COLLECTIONS.forEach(function(coll){
      if (!Array.isArray(out[coll])) return;
      var t = out.tombstones[coll] || {};
      out[coll] = out[coll].filter(function(rec){
        if (!rec || !rec.id) return true;
        var ts  = rec._ts || 0;
        var del = t[rec.id] || 0;
        return !(del && ts <= del);
      });
    });

    out.habits = Object.assign({}, remote.habits || {});
    Object.keys(local.habits || {}).forEach(function(date){
      if (!out.habits[date]) out.habits[date] = local.habits[date];
      else out.habits[date] = Object.assign({}, out.habits[date], local.habits[date]);
    });
    out.tax = Object.assign({}, remote.tax || {});
    Object.keys(local.tax || {}).forEach(function(k){
      var s = new Set([].concat(out.tax[k] || [], local.tax[k] || []));
      out.tax[k] = Array.from(s);
    });
    out.habitDefs = local.habitDefs && local.habitDefs.length
      ? local.habitDefs
      : (remote.habitDefs || []);
    out.settings = Object.assign({}, remote.settings || {}, local.settings || {});
    out.sync = local.sync || remote.sync;
    return out;
  };

  // ---------- sync-safe delete ----------
  function _deleteWithTombstone(id){
    var f = (S.focusLog || []).find(function(x){ return x.id === id; });
    if (!f) return;
    var label = f.label || 'Focus entry';
    var mins  = f.minutes || 0;
    var when  = f.startedAt ? f.startedAt.slice(0,10) : 'unknown date';

    openConfirm(
      'Delete "' + label + '" (' + mins + 'm on ' + when + ')? This changes your streak and focus stats.',
      function(){
        snapshot();
        S.focusLog = (S.focusLog || []).filter(function(x){ return x.id !== id; });

        // Tombstone it so the next merge drops it
        if (!S.tombstones) S.tombstones = {};
        if (!S.tombstones.focusLog) S.tombstones.focusLog = {};
        S.tombstones.focusLog[id] = Date.now();

        // Strip the same minutes from the linked session card
        if (f.topicId && f.minutes) {
          var cand = null;
          for (var i = S.sessions.length - 1; i >= 0; i--) {
            if (S.sessions[i].topicId === f.topicId) { cand = S.sessions[i]; break; }
          }
          if (cand && (cand.duration || 0) > 0) {
            cand.duration = Math.max(0, (cand.duration || 0) - f.minutes);
          }
        }

        S._lastLocalEdit = new Date().toISOString();
        saveLocal();

        // Push IMMEDIATELY, not after 500ms
        if (typeof pushNow === 'function' && typeof syncKey !== 'undefined' && syncKey) {
          pushNow(true);
        }

        rerender();
        toast('Focus entry deleted', mins + 'm removed');
        closeModal();
        setTimeout(function(){
          if (typeof window.focusHistoryModal === 'function') window.focusHistoryModal();
        }, 60);
      }
    );
  }

  window.apexFocusDelete = _deleteWithTombstone;

  console.log('[apex-focus-sync] sync-safe delete + tombstone-aware merge installed');
})();