/* ============================================================
   APEX SCOPE UNIFY v2
   Trust the user's explicit pick. Only auto-bootstrap when
   nothing is set at all. Never rewrite a chosen exam to
   "nearest target".
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScopeUnifyV2) return;
  window._apexScopeUnifyV2 = true;
  window._apexScopeUnify = true;

  function getTargets(){
    return (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date && x.examTag; })
      : [];
  }

  function findTargetFor(tag){
    if (!tag) return null;
    var t = getTargets().filter(function(x){
      return String(x.examTag).toLowerCase() === String(tag).toLowerCase();
    });
    if (!t.length) return null;
    return t.reduce(function(a,b){
      return Math.abs(diffD(a.date, todayISO())) < Math.abs(diffD(b.date, todayISO())) ? a : b;
    });
  }

  /* Trust the pick. Only bootstrap if user has never picked. */
  window.getActiveExamTag = function(){
    var active = (S.settings.activeExam || S.settings.readinessExam || '').trim();
    if (active) return active;

    var future = getTargets().filter(function(x){ return diffD(x.date, todayISO()) >= 0; });
    if (future.length) {
      future.sort(function(a,b){ return diffD(a.date, todayISO()) - diffD(b.date, todayISO()); });
      return future[0].examTag;
    }
    var past = getTargets();
    if (past.length) {
      past.sort(function(a,b){ return diffD(b.date, todayISO()) - diffD(a.date, todayISO()); });
      return past[0].examTag;
    }
    return '';
  };

  window.readinessScope = function(){
    var tags = [];
    (S.settings.exams || []).forEach(function(x){
      if (x.examTag && tags.indexOf(x.examTag) === -1) tags.push(x.examTag);
    });
    (S.tax.exams || []).forEach(function(e){
      if (tags.indexOf(e) !== -1) return;
      if (S.syllabus.some(function(t){
        return !t.archived && Array.isArray(t.exams) && t.exams.indexOf(e) > -1;
      })) tags.push(e);
    });
    return { tags: tags, current: window.getActiveExamTag() };
  };

  window.readinessProjection = function(){
    var scopeTag = window.getActiveExamTag();
    if (!scopeTag) return null;
    var target = findTargetFor(scopeTag);
    if (!target) return null;
    var days = diffD(target.date, todayISO());
    if (days < 0) return null;

    var scopedTopics = S.syllabus.filter(function(t){
      return !t.archived && !hasKids(t.id) && _tagMatchesTopic(t, scopeTag);
    });
    var total = scopedTopics.length;
    if (!total) return null;

    var mastered = scopedTopics.filter(function(t){ return isTopicMastered(t); }).length;
    var cutoff30 = addDays(todayISO(), -30);
    var recentMastered = new Set(
      S.sessions
        .filter(function(s){ return s.masteredAt && s.masteredAt >= cutoff30 && s.topicId; })
        .map(function(s){ return s.topicId; })
    ).size;

    var pacePerWeek = Math.round(recentMastered / 30 * 7 * 10) / 10;
    var weeksLeft = Math.max(0.1, days / 7);
    var projectedTotal = Math.min(total, Math.round(mastered + pacePerWeek * weeksLeft));
    var projectedPct = Math.round(projectedTotal / total * 100);
    var masteredPct = Math.round(mastered / total * 100);
    var remaining = total - mastered;
    var requiredPerWeek = Math.round(remaining / weeksLeft * 10) / 10;
    var ratio = requiredPerWeek > 0 ? (pacePerWeek / requiredPerWeek) : 999;

    return {
      daysLeft: days, examLabel: target.label,
      totalTopics: total, mastered: mastered,
      masteredPct: masteredPct, masteredRecent: recentMastered,
      pacePerWeek: pacePerWeek, projectedTotal: projectedTotal,
      projectedPct: projectedPct, remaining: remaining,
      requiredPerWeek: requiredPerWeek, ratio: ratio, hero: target
    };
  };

  /* Chip click — sets both, clears cache, rerenders */
  ACTIONS['readiness-exam-set'] = function(id){
    if (!S.settings) S.settings = {};
    var exam = id || '';
    S.settings.readinessExam = exam;
    S.settings.activeExam = exam;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (window._apexRCache) window._apexRCache.clear();
    rerender();
    console.log('[scope] switched to', exam);
  };

  /* Exam bar dropdown — same sync */
  var _origSetActive = window.setActiveExam;
  if (typeof _origSetActive === 'function') {
    window.setActiveExam = function(exam){
      S.settings.readinessExam = exam;
      if (window._apexRCache) window._apexRCache.clear();
      return _origSetActive.apply(this, arguments);
    };
    try { setActiveExam = window.setActiveExam; } catch(e){}
  }

  console.log('[apex-scope-unify] v2 installed · scope=' + window.getActiveExamTag());
})();