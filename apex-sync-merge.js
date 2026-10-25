/* APEX SYNC MERGE */
(function(){
  if (window.mergeForSync) return;

  window.mergeForSync = function(local, remote){
    function mergeByIdTs(a,b){
      if(!Array.isArray(a)&&!Array.isArray(b))return a||b||[];
      if(!Array.isArray(a))return b||[];
      if(!Array.isArray(b))return a||[];
      var map = new Map();
      b.forEach(function(x){if(x&&x.id)map.set(x.id,x);});
      a.forEach(function(x){
        if(!x||!x.id)return;
        var ex = map.get(x.id);
        if(!ex){map.set(x.id,x);return;}
        var tA = x._ts||0, tB = ex._ts||0;
        if(tA >= tB)map.set(x.id,x);
      });
      return Array.from(map.values());
    }

    var out = Object.assign({}, remote, local);
    out._deviceId = local._deviceId||remote._deviceId;
    out._lastLocalEdit = local._lastLocalEdit||remote._lastLocalEdit;
    out._lastSync = new Date().toISOString();

    var collections = ["syllabus","sessions","errors","mocks","tasks","links","scratch","focusLog","pyqLog","activity","resources","questions"];
    collections.forEach(function(k){
      out[k] = mergeByIdTs(local[k], remote[k]);
    });

    out.habits = Object.assign({}, remote.habits||{});
    Object.keys(local.habits||{}).forEach(function(date){
      if(!out.habits[date])out.habits[date]=local.habits[date];
      else out.habits[date]=Object.assign({},out.habits[date],local.habits[date]);
    });

    out.tax = Object.assign({}, remote.tax||{});
    Object.keys(local.tax||{}).forEach(function(k){
      var s = new Set([].concat(out.tax[k]||[], local.tax[k]||[]));
      out.tax[k] = Array.from(s);
    });

    var lS = local._lastLocalEdit ? new Date(local._lastLocalEdit).getTime() : 0;
    var rS = remote._lastLocalEdit ? new Date(remote._lastLocalEdit).getTime() : 0;
    var lH = local.habitDefs && local.habitDefs.length ? local.habitDefs : null;
    var rH = remote.habitDefs && remote.habitDefs.length ? remote.habitDefs : null;
    if (lH && !rH) out.habitDefs = lH;
    else if (rH && !lH) out.habitDefs = rH;
    else if (lS > rS) out.habitDefs = lH || rH || [];
    else out.habitDefs = rH || lH || [];

    if (lS >= rS) {
      out.settings = Object.assign({}, remote.settings || {}, local.settings || {});
    } else {
      out.settings = Object.assign({}, local.settings || {}, remote.settings || {});
    }

    out.sync = local.sync||remote.sync;
    return out;
  };
  console.log("[apex-sync-merge] mergeForSync installed");
})();