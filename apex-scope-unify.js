/* ============================================================
   APEX SCOPE UNIFY v1
   - One source of truth: activeExam
   - readinessScope, readinessProjection, ddayBannerHTML all follow it
   - Orphan activeExam (no exam target) auto-heals to nearest target
   - Chip click updates both activeExam and readinessExam
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScopeUnify) return;
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

  /* ---- 1. Unified active exam ---- */
  window.getActiveExamTag = function(){
    var active = (S.settings.activeExam || S.settings.readinessExam || '');
    if (active && findTargetFor(active)) return active;

    // Auto-heal: nearest future target
    var future = getTargets().filter(function(x){ return diffD(x.date, todayISO()) >= 0; });
    if (future.length) {
      future.sort(function(a,b){ return diffD(a.date, todayISO()) - diffD(b.date, todayISO()); });
      return future[0].examTag;
    }
    // Fall back to nearest past target
    var past = getTargets();
    if (past.length) {
      past.sort(function(a,b){ return diffD(b.date, todayISO()) - diffD(a.date, todayISO()); });
      return past[0].examTag;
    }
    return '';
  };

  /* ---- 2. Heal orphan activeExam on load ---- */
  (function healOrphan(){
    var cur = S.settings.activeExam || S.settings.readinessExam;
    if (cur && findTargetFor(cur)) return;
    var fixed = window.getActiveExamTag();
    if (fixed && fixed !== cur) {
      S.settings.activeExam = fixed;
      S.settings.readinessExam = fixed;
      try { store.set(KEY, JSON.stringify(S)); } catch(e){}
      console.log('[apex-scope-unify] healed orphan activeExam → ' + fixed);
    }
  })();

  /* ---- 3. Scope: tags come from targets, current from active ---- */
  window.readinessScope = function(){
    var tags = [];
    getTargets().forEach(function(x){
      if (tags.indexOf(x.examTag) === -1) tags.push(x.examTag);
    });
    return { tags: tags, current: window.getActiveExamTag() };
  };

  /* ---- 4. Projection: only when scope has a target ---- */
  window.readinessProjection = function(){
    var scopeTag = window.getActiveExamTag();
    if (!scopeTag) return null;
    var target = findTargetFor(scopeTag);
    if (!target) return null;

    var scopedTopics = S.syllabus.filter(function(t){
      return !t.archived && !hasKids(t.id) && _tagMatchesTopic(t, scopeTag);
    });
    var total = scopedTopics.length;
    if (!total) return null;

    var mastered = scopedTopics.filter(function(t){ return isTopicMastered(t); }).length;
    var days = diffD(target.date, todayISO());
    if (days < 0) return null;

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

  /* ---- 5. D-Day banner follows scope ---- */
  window.ddayBannerHTML = function(){
    var scopeTag = window.getActiveExamTag();
    var scopeTarget = scopeTag ? findTargetFor(scopeTag) : null;

    var allTargets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date; })
      : [];

    if (!allTargets.length) {
      return '<button class="dday-empty" data-action="open-exams-manager">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px">' +
        '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>' +
        '</svg>Add an exam target to unlock the D-Day counter</button>';
    }

    if (!scopeTarget) {
      return '<button class="dday-empty" data-action="open-exams-manager">' +
        'No exam target for <b style="color:var(--accent-2);margin:0 4px">' + esc(scopeTag || 'this scope') + '</b> — click to add</button>';
    }

    var withDays = allTargets.map(function(x){
      return Object.assign({}, x, { days: diffD(x.date, todayISO()) });
    });

    var hero = withDays.find(function(x){ return x.id === scopeTarget.id; });
    var rest = withDays.filter(function(x){ return x.id !== hero.id; });

    // Sort rest: future soonest first, then past most-recent
    rest.sort(function(a,b){
      var aF = a.days >= 0, bF = b.days >= 0;
      if (aF && !bF) return -1;
      if (!aF && bF) return 1;
      if (aF && bF) return a.days - b.days;
      return b.days - a.days;
    });

    var isPast = hero.days < 0;
    var cls = isPast ? 'past'
            : hero.days === 0 ? 'urgent'
            : hero.days <= 30 ? 'urgent'
            : hero.days <= 90 ? 'soon'
            : 'ok';

    var labelLine = esc(hero.label) + (hero.examTag ? ' · ' + esc(hero.examTag) : '');

    var subLine;
    if (isPast) {
      var dPast = Math.abs(hero.days);
      subLine = (dPast === 1 ? '1 day since' : dPast + ' days since') + ' · ' + fmtDY(hero.date);
    } else if (hero.days === 0) {
      subLine = 'today — go get it · ' + fmtDY(hero.date);
    } else {
      subLine = (hero.days === 1 ? '1 day to go' : hero.days + ' days to go') + ' · ' + fmtDY(hero.date);
    }

    var numDisplay = isPast
      ? '<span style="font-size:.55em;letter-spacing:.08em;opacity:.7">✓</span>'
      : Math.abs(hero.days);

    var html = '<div class="dday-wrap">' +
      '<div class="dday-banner ' + cls + '" data-action="open-exams-manager" style="cursor:pointer" title="Click to edit exam dates">' +
        '<div class="dday-num">' + numDisplay + '</div>' +
        '<div class="dday-info">' +
          '<div class="dday-label">' + labelLine + '</div>' +
          '<div class="dday-sub">' + subLine + '</div>' +
        '</div>' +
      '</div>';

    if (rest.length) {
      html += '<div class="dday-rest">' + rest.map(function(x){
        var isPastX = x.days < 0;
        var c = isPastX ? 'var(--text-3)'
              : x.days <= 30 ? 'var(--pri-critical-fg)'
              : x.days <= 90 ? 'var(--pri-medium-fg)'
              : 'var(--text-2)';
        var num = isPastX
          ? '<span style="opacity:.7">✓ ' + Math.abs(x.days) + 'd</span>'
          : Math.abs(x.days) + 'd';
        return '<span class="dday-rest-item" data-action="open-exams-manager" style="cursor:pointer" title="Click to edit exam dates">' +
          '<span class="dday-rest-num" style="color:' + c + '">' + num + '</span>' +
          '<span class="dday-rest-label">' + esc(x.label) + '</span>' +
        '</span>';
      }).join('') + '</div>';
    }

    html += '</div>';
    return html;
  };

  /* ---- 6. Chip click writes both fields and clears cache ---- */
  var _origSetActive = window.setActiveExam;
  if (typeof _origSetActive === 'function') {
    window.setActiveExam = function(exam){
      S.settings.readinessExam = exam;
      if (window._apexRCache) window._apexRCache.clear();
      return _origSetActive.apply(this, arguments);
    };
    try { setActiveExam = window.setActiveExam; } catch(e){}
  }

  /* ---- 7. readiness-exam-set also clears the render cache ---- */
  var _origChipSet = ACTIONS['readiness-exam-set'];
  if (typeof _origChipSet === 'function') {
    ACTIONS['readiness-exam-set'] = function(id){
      if (window._apexRCache) window._apexRCache.clear();
      return _origChipSet.apply(this, arguments);
    };
  }

  console.log('[apex-scope-unify] installed · scope=' + window.getActiveExamTag());
})();