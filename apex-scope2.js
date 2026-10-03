/* ============================================================
   APEX SCOPE v15b — close the last two exam leaks
   - examIntervalCap: use active exam's target only
   - readinessProjection: hero matches scope
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScopeV15b) return;
  window._apexScopeV15b = true;

  /* 1. examIntervalCap — scoped */
  window.examIntervalCap = function(topicId){
    const t = topicId ? topicById(topicId) : null;
    if (!t) return 99999;
    const targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date; })
      : [];
    if (!targets.length) return 99999;

    const examTag = window.getActiveExamTag ? window.getActiveExamTag() : '';
    const topicTags = Array.isArray(t.exams) ? t.exams : [];

    let pool = targets;
    if (examTag) {
      const activeMatches = targets.filter(function(x){
        return x.examTag && String(x.examTag).toLowerCase() === String(examTag).toLowerCase();
      });
      if (activeMatches.length) {
        pool = activeMatches;
      } else {
        const topicMatches = targets.filter(function(x){
          return x.examTag && topicTags.some(function(e){
            return String(e).toLowerCase() === String(x.examTag).toLowerCase();
          });
        });
        if (topicMatches.length) pool = topicMatches;
      }
    } else {
      const relevant = targets.filter(function(x){
        return x.examTag && topicTags.indexOf(x.examTag) > -1;
      });
      if (relevant.length) pool = relevant;
    }

    let nearest = null, nearestLabel = '';
    pool.forEach(function(x){
      const d = diffD(x.date, todayISO());
      if (d < 0) return;
      if (nearest === null || d < nearest) { nearest = d; nearestLabel = x.label || x.examTag || 'exam'; }
    });
    if (nearest === null) return 99999;

    let cap;
    if (nearest > 180) cap = 99999;
    else if (nearest > 90) cap = 60;
    else if (nearest > 30) cap = 30;
    else if (nearest > 14) cap = 14;
    else if (nearest > 7) cap = 7;
    else if (nearest > 3) cap = 3;
    else cap = 1;
    return { cap: cap, days: nearest, label: nearestLabel };
  };

  /* 2. readinessProjection — hero matches active scope */
  window.readinessProjection = function(){
    const targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date; })
      : [];
    if (!targets.length) return null;

    const withDays = targets.map(function(x){
      return Object.assign({}, x, { days: diffD(x.date, todayISO()) });
    });
    const future = withDays.filter(function(x){ return x.days >= 0; });

    const scopeTag = window.getActiveExamTag ? window.getActiveExamTag() : '';

    let hero = null;
    if (scopeTag) {
      const matching = future.filter(function(x){
        return x.examTag && String(x.examTag).toLowerCase() === String(scopeTag).toLowerCase();
      });
      if (matching.length) {
        matching.sort(function(a, b){ return a.days - b.days; });
        hero = matching[0];
      }
    }
    if (!hero) {
      const primFuture = future.filter(function(x){ return x.priority === 'Primary'; }).sort(function(a, b){ return a.days - b.days; });
      hero = primFuture[0] || future.sort(function(a, b){ return a.days - b.days; })[0];
    }
    if (!hero) return null;

    const scopedTopics = S.syllabus.filter(function(t){
      return !t.archived && !hasKids(t.id) && _tagMatchesTopic(t, scopeTag);
    });
    const totalTopics = scopedTopics.length;
    if (!totalTopics) return null;

    const mastered = scopedTopics.filter(function(t){ return isTopicMastered(t); }).length;
    const cutoff30 = addDays(todayISO(), -30);
    const masteredRecent = new Set(
      S.sessions
        .filter(function(s){ return s.masteredAt && s.masteredAt >= cutoff30 && s.topicId; })
        .map(function(s){ return s.topicId; })
    ).size;

    const pacePerWeek = Math.round(masteredRecent / 30 * 7 * 10) / 10;
    const weeksLeft = Math.max(0.1, hero.days / 7);
    const projectedTotal = Math.min(totalTopics, Math.round(mastered + pacePerWeek * weeksLeft));
    const projectedPct = Math.round(projectedTotal / totalTopics * 100);
    const masteredPct = Math.round(mastered / totalTopics * 100);
    const remaining = totalTopics - mastered;
    const requiredPerWeek = Math.round(remaining / weeksLeft * 10) / 10;
    const ratio = requiredPerWeek > 0 ? (pacePerWeek / requiredPerWeek) : 999;

    return {
      daysLeft: hero.days, examLabel: hero.label,
      totalTopics: totalTopics, mastered: mastered,
      masteredPct: masteredPct, masteredRecent: masteredRecent,
      pacePerWeek: pacePerWeek, projectedTotal: projectedTotal,
      projectedPct: projectedPct, remaining: remaining,
      requiredPerWeek: requiredPerWeek, ratio: ratio, hero: hero
    };
  };

  console.log('[apex-scope] v15b installed — interval caps + projection exam-scoped');
})();
