/* ============================================================
   APEX READINESS FIX v2
   - Card never disappears on empty scopes
   - Chips list every exam that has a target OR tagged topics
   - Each chip has an asterisk-style tooltip showing what
     clicking will reveal: tagged / sessions / errors / mocks
   ============================================================ */
(function(){
  'use strict';
  if (window._apexReadinessFixV2) return;
  window._apexReadinessFixV2 = true;
  window._apexReadinessFix = true; // suppress v1 if it loads

  function statsFor(examTag){
    var topics = S.syllabus.filter(function(t){
      return !t.archived && Array.isArray(t.exams) && t.exams.indexOf(examTag) > -1;
    });
    var topicIds = topics.map(function(t){ return t.id; });
    var sess = S.sessions.filter(function(s){ return topicIds.indexOf(s.topicId) > -1; }).length;
    var errs = S.errors.filter(function(e){ return topicIds.indexOf(e.topicId) > -1; }).length;
    var mocks = S.mocks.filter(function(m){
      return (m.weak || []).some(function(w){ return topicIds.indexOf(w) > -1; });
    }).length;
    return { topics: topics.length, sessions: sess, errors: errs, mocks: mocks };
  }

  function allRelevantExams(){
    var set = [];
    (S.settings.exams || []).forEach(function(x){
      if (x.examTag && set.indexOf(x.examTag) === -1) set.push(x.examTag);
    });
    (S.tax.exams || []).forEach(function(e){
      if (set.indexOf(e) !== -1) return;
      var has = S.syllabus.some(function(t){
        return !t.archived && Array.isArray(t.exams) && t.exams.indexOf(e) > -1;
      });
      if (has) set.push(e);
    });
    return set;
  }

  function targetFor(tag){
    var m = (S.settings.exams || []).filter(function(x){
      return x.date && x.examTag &&
        String(x.examTag).toLowerCase() === String(tag).toLowerCase();
    });
    if (!m.length) return null;
    return m.reduce(function(a,b){
      return Math.abs(diffD(a.date, todayISO())) < Math.abs(diffD(b.date, todayISO())) ? a : b;
    });
  }

  function tooltipFor(examTag){
    var st = statsFor(examTag);
    var t = targetFor(examTag);
    var dTxt = t
      ? ('D-' + diffD(t.date, todayISO()) + ' · ' + t.label)
      : 'No target date set';
    if (st.topics === 0) {
      return 'No topics tagged for ' + examTag + ' yet\n' +
             'Click to see how to fix this\n' +
             '· ' + dTxt;
    }
    return 'Scope: ' + examTag + ' — ' + dTxt + '\n' +
           '· ' + st.topics + ' topic' + (st.topics === 1 ? '' : 's') + ' tagged\n' +
           '· ' + st.sessions + ' session' + (st.sessions === 1 ? '' : 's') + ' recorded\n' +
           '· ' + st.errors + ' error' + (st.errors === 1 ? '' : 's') + ' logged\n' +
           '· ' + st.mocks + ' mock tag' + (st.mocks === 1 ? '' : 's') + '\n' +
           'Click to switch scope to this exam';
  }

  function chipHTMLFor(activeTag){
    var exams = allRelevantExams();
    if (!exams.length) return '';
    return '<div class="chips" style="margin-bottom:10px">' + exams.map(function(e){
      var isActive = e === activeTag;
      var st = statsFor(e);
      var hasData = st.topics > 0;
      // Asterisk for exams with no topics — signals "empty scope"
      var star = hasData ? '' : '<span style="color:var(--pri-medium-fg);margin-left:4px">*</span>';
      return '<button class="chip' + (isActive ? ' on' : '') + '"' +
        ' data-action="readiness-exam-set" data-id="' + esc(e) + '"' +
        ' title="' + esc(tooltipFor(e)) + '"' +
        ' style="padding:5px 11px;font-size:11.5px;min-height:30px">' +
        esc(e) + ' · ' + st.topics + star +
        '</button>';
    }).join('') + '</div>';
  }

  var _orig = window.readinessHTML;
  if (typeof _orig !== 'function') {
    console.warn('[apex-readiness-fix] readinessHTML not found');
    return;
  }

  window.readinessHTML = function(){
    var scope = window.readinessScope();
    var scopeTag = scope.current;
    var ready = examReadiness();

    if (ready) {
      var orig = _orig.apply(this, arguments);
      var re = /<div class="chips"[^>]*>[\s\S]*?<\/div>/;
      if (re.test(orig)) return orig.replace(re, chipHTMLFor(scopeTag));
      return orig;
    }

    var t = scopeTag ? targetFor(scopeTag) : null;
    var dLine = t ? ('D-' + diffD(t.date, todayISO()) + ' · ' + esc(t.label)) : 'no target set';

    return '<div class="ready-card behind" style="padding:22px 26px">' +
      '<div class="ready-head" style="margin-bottom:10px">' +
        '<div>' +
          '<div class="ready-title">Exam Readiness</div>' +
          '<div class="ready-sub">Scope: ' + esc(scopeTag || '—') + ' — ' + dLine + '</div>' +
        '</div>' +
        '<div class="ready-pct" style="opacity:.35">0<span class="ready-pct-sign">%</span></div>' +
      '</div>' +
      chipHTMLFor(scopeTag) +
      '<div style="padding:18px 4px;text-align:center">' +
        '<div style="font-size:13.5px;line-height:1.6;color:var(--text-2);margin-bottom:8px">' +
          '<b style="color:var(--text)">No topics tagged for ' + esc(scopeTag || 'this exam') + '.</b>' +
        '</div>' +
        '<div class="tiny" style="line-height:1.55;margin-bottom:14px">' +
          'Tag syllabus topics for this exam, or add an exam target, and readiness will compute.' +
        '</div>' +
        '<button class="btn sm primary" data-action="fix-tags">Fix exam tags →</button>' +
        ' <button class="btn sm" data-action="open-exams-manager">Manage targets</button>' +
      '</div>' +
      '<div class="tiny" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);line-height:1.5;opacity:.7">' +
        '<b style="color:var(--pri-medium-fg)">*</b> = no topics tagged for this exam yet' +
      '</div>' +
    '</div>';
  };

  console.log('[apex-readiness-fix] v2 installed · chips: ' + allRelevantExams().length);
})();