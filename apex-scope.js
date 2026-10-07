/* ============================================================
   APEX SCOPE v15 — exam-tag everything
   - sessions + errors now carry examTag
   - weaknessScore scopes evidence by examTag
   - recommendSmart prefers exam-relevant items
   - getActiveExamTag / readinessScope unified
   - sync passphrase wording honest
   - Piru hidden from theme picker
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScopeV15) return;
  window._apexScopeV15 = true;

  /* 1. MIGRATION */
  let migrated = 0;
  (S.sessions || []).forEach(function(s){
    if (typeof s.examTag !== 'string') { s.examTag = ''; migrated++; }
  });
  (S.errors || []).forEach(function(e){
    if (typeof e.examTag !== 'string') { e.examTag = ''; migrated++; }
  });
  if (migrated) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    console.log('[apex-scope] migrated ' + migrated + ' records');
  }

  /* 2. UNIFIED ACTIVE EXAM */
  window.getActiveExamTag = function(){
    const explicit = (S.settings && (S.settings.activeExam || S.settings.readinessExam)) || '';
    if (explicit) return explicit;
    const targets = (S.settings && Array.isArray(S.settings.exams))
      ? S.settings.exams.filter(function(x){ return x.date && x.examTag; })
      : [];
    const future = targets.filter(function(x){ return diffD(x.date, todayISO()) >= 0; });
    if (future.length) {
      future.sort(function(a,b){ return diffD(a.date, todayISO()) - diffD(b.date, todayISO()); });
      return future[0].examTag;
    }
    if (targets.length) return targets[0].examTag;
    return '';
  };

  const _origReadinessScope = window.readinessScope;
  if (typeof _origReadinessScope === 'function') {
    window.readinessScope = function(){
      const r = _origReadinessScope.apply(this, arguments);
      return { tags: r.tags, current: window.getActiveExamTag() };
    };
  }

  /* 3. SCOPE-AWARE WEAKNESS SCORE */
  window.weaknessScore = function(t, examTag){
    if (!t) return 0;
    if (examTag === undefined) examTag = window.getActiveExamTag();
    if (typeof isTopicMastered === 'function' && isTopicMastered(t)) return 0;

    const now = todayISO();
    const cutoff30 = addDays(now, -30);

    const allErrs = S.errors.filter(function(e){ return e.topicId === t.id; });
    const errs = examTag
      ? allErrs.filter(function(e){ return !e.examTag || e.examTag === examTag; })
      : allErrs;
    const recentErrs = errs.filter(function(e){ return e.date && e.date >= cutoff30; }).length;
    const olderErrs = errs.length - recentErrs;
    const errorSignal = recentErrs * 12 + olderErrs * 4;

    let mocks = S.mocks.filter(function(m){ return (m.weak || []).indexOf(t.id) > -1; });
    if(examTag){mocks=mocks.filter(m=>_tagMatchesMock(m,examTag));}
    const recentMocks = mocks.filter(function(m){ return m.date && m.date >= cutoff30; }).length;
    const olderMocks = mocks.length - recentMocks;
    const mockSignal = recentMocks * 18 + olderMocks * 7;

    const allSess = S.sessions.filter(function(s){ return s.topicId === t.id; });
    const sess = examTag
      ? allSess.filter(function(s){ return !s.examTag || s.examTag === examTag; })
      : allSess;
    let again = 0, hard = 0, good = 0, easy = 0;
    sess.forEach(function(s){
      (s.history || []).forEach(function(h){
        if (h.grade === 'again') again++;
        else if (h.grade === 'hard') hard++;
        else if (h.grade === 'good') good++;
        else if (h.grade === 'easy') easy++;
      });
    });
    const recallSignal = again * 20 + hard * 8 - good * 3 - easy * 6;

    const pyqS = (typeof pyqStatsFor === 'function') ? pyqStatsFor(t.id, examTag) : null;
    let pyqSignal = 0;
    if (pyqS && pyqS.attempted >= 10 && pyqS.accuracy !== null) {
      const conf = Math.min(1, pyqS.attempted / 30);
      pyqSignal = Math.max(-25, Math.min(25, Math.round((0.7 - pyqS.accuracy / 100) * 60 * conf)));
    }

    const q = (S.questions || []).filter(function(x){ return x.topicId === t.id; });
    let questionSignal = 0;
    if (q.length >= 3) {
      const qCor = q.filter(function(x){ return x.correct; }).length;
      const acc = qCor / q.length;
      questionSignal = Math.max(-25, Math.min(25, Math.round((0.7 - acc) * 60)));
    }

    let overdueSignal = 0;
    sess.forEach(function(s){
      const r = reviewState(s);
      if (r.st === 'overdue') overdueSignal += Math.min(30, r.days * 3);
    });

    const friction = errorSignal + mockSignal + recallSignal + questionSignal + pyqSignal + overdueSignal;
    if (friction <= 0) return 0;

    let importance = 1.0;
    if (t.priority === 'Critical') importance += 0.3;
    else if (t.priority === 'High') importance += 0.15;
    if (t.weightage === 'High') importance += 0.15;
    importance += examUrgencyForTopic(t) * 0.15;

    const statusMap = { 'Not started': 0.7, 'Learning': 1.0, 'Practicing': 0.9, 'Reviewing': 0.7, 'Mastered': 0 };
    const sm = statusMap[t.status] !== undefined ? statusMap[t.status] : 1.0;

    const bias = (typeof sectionBiasForSubject === 'function')
      ? sectionBiasForSubject(t.subject, examTag) : 1.0;

    return Math.max(0, Math.round(friction * importance * sm * bias));
  };

  /* 4. SCOPE-AWARE RECOMMENDATION */
  const _topicMatchesActiveExam = function(t, examTag){
    if (!examTag || !t) return true;
    const tExams = Array.isArray(t.exams) ? t.exams : [];
    const tagL = String(examTag).toLowerCase();
    return tExams.some(function(e){
      const eL = String(e).toLowerCase();
      return eL === tagL || eL.indexOf(tagL) > -1 || tagL.indexOf(eL) > -1;
    });
  };

  window.recommendSmart = function(){
    const examTag = window.getActiveExamTag();
    const candidates = [];
    const bucket = hourBucket();
    const sinceMock = daysSinceLastMock();
    let due = dueSessions();
    if (examTag) due = due.filter(function(s){ return !s.examTag || s.examTag === examTag; });

    function matchBoost(t){
      if (!t || !examTag) return 1.0;
      return _topicMatchesActiveExam(t, examTag) ? 1.2 : 0.75;
    }

    due.filter(function(s){ return reviewState(s).st === 'overdue'; }).forEach(function(s){
      const t = s.topicId ? topicById(s.topicId) : null;
      const days = reviewState(s).days;
      const cf = consecutiveFails(s.id);
      let score = 100 + Math.min(days, 14) * 3;
      if (t) {
        score *= 1 + examUrgencyForTopic(t) * 0.5;
        score *= 1 - interleavePenalty(t.subject);
        if (cf >= 2) score *= 1.3;
        if (bucket === 'evening' || bucket === 'night') score *= 1.15;
        score *= matchBoost(t);
      }
      candidates.push({
        kind: 'overdue', score: score,
        title: s.name,
        subtitle: (t ? t.topic + ' · ' : '') + days + 'd overdue',
        reason: 'Overdue ' + days + 'd' + (cf >= 2 ? ' · repeated fails' : '') + (t && examUrgencyForTopic(t) >= 0.7 ? ' · exam-near' : ''),
        sessionId: s.id, topicId: s.topicId || null,
        primaryAction: { a: 'focus-task-from-review', id: s.id, label: '⚡ Start Focus' },
        secondaryAction: { a: 'grade-review', id: s.id, grade: 'good', label: 'Mark Good' }
      });
    });

    due.filter(function(s){ return ['today','new'].indexOf(reviewState(s).st) > -1; }).forEach(function(s){
      const t = s.topicId ? topicById(s.topicId) : null;
      let score = 70;
      if (t) {
        score *= 1 + examUrgencyForTopic(t) * 0.4;
        score *= 1 - interleavePenalty(t.subject);
        score *= matchBoost(t);
      }
      if (bucket === 'evening' || bucket === 'night') score *= 1.2;
      else if (bucket === 'morning') score *= 0.9;
      candidates.push({
        kind: 'today', score: score,
        title: s.name,
        subtitle: (t ? t.topic + ' · ' : '') + s.stage,
        reason: 'Due today' + (t ? ' · ' + t.subject : '') + (bucket === 'evening' ? ' · evening is review time' : ''),
        sessionId: s.id, topicId: s.topicId || null,
        primaryAction: { a: 'focus-task-from-review', id: s.id, label: '⚡ Start Focus' },
        secondaryAction: { a: 'grade-review', id: s.id, grade: 'good', label: 'Mark Good' }
      });
    });

    weakTopics(5).forEach(function(w){
      const t = w.t;
      let score = w.score * 0.6;
      score *= 1 + examUrgencyForTopic(t) * 0.6;
      score *= 1 - interleavePenalty(t.subject);
      score *= matchBoost(t);
      if (bucket === 'morning' || bucket === 'afternoon') score *= 1.15;
      candidates.push({
        kind: 'weak', score: score,
        title: t.topic,
        subtitle: 'Friction ' + w.score + ' · ' + t.subject,
        reason: 'Friction ' + w.score + (t.priority ? ' · ' + t.priority : '') + (t.weightage === 'High' ? ' · Wt High' : ''),
        topicId: t.id, sessionId: null,
        primaryAction: { a: 'focus-start-topic', id: t.id, label: '⚡ Focus 25 min' },
        secondaryAction: { a: 'goto-topic', id: t.id, label: 'Open Topic' }
      });
    });

    let inProgress = S.syllabus.filter(function(t){ return ['Learning','Practicing'].indexOf(t.status) > -1; });
    if (examTag) inProgress = inProgress.filter(function(t){ return _topicMatchesActiveExam(t, examTag); });
    inProgress.sort(function(a,b){ return priRank(a) - priRank(b); }).slice(0, 3).forEach(function(t){
      let score = 40;
      score *= 1 + examUrgencyForTopic(t) * 0.5;
      score *= 1 - interleavePenalty(t.subject);
      if (bucket === 'morning') score *= 1.3;
      else if (bucket === 'night') score *= 0.7;
      candidates.push({
        kind: 'continue', score: score,
        title: t.topic,
        subtitle: t.status + ' · ' + t.subject,
        reason: 'In progress' + (t.priority ? ' · ' + t.priority : '') + (bucket === 'morning' ? ' · morning = new material' : ''),
        topicId: t.id, sessionId: null,
        primaryAction: { a: 'focus-start-topic', id: t.id, label: '⚡ Continue' },
        secondaryAction: { a: 'goto-topic', id: t.id, label: 'Open Topic' }
      });
    });

    if (sinceMock === null || sinceMock >= 7) {
      let score = sinceMock === null ? 50 : (sinceMock >= 14 ? 70 : (sinceMock >= 10 ? 55 : 30));
      if (bucket === 'morning') score *= 1.2;
      candidates.push({
        kind: 'mock', score: score,
        title: 'Take a mock',
        subtitle: sinceMock === null ? 'No mocks logged yet' : sinceMock + 'd since last mock',
        reason: sinceMock === null ? 'Never logged a mock' : 'Last mock ' + sinceMock + 'd ago',
        topicId: null, sessionId: null,
        primaryAction: { a: 'goto-mocks', id: '', label: 'Log a Mock' },
        secondaryAction: { a: 'goto-errors', id: '', label: 'See Errors' }
      });
    }

    const unlinked = S.errors.filter(function(e){ return !e.topicId; }).length;
    if (unlinked >= 3) {
      candidates.push({
        kind: 'error-hygiene', score: 25 + Math.min(unlinked, 10),
        title: unlinked + ' errors without a topic',
        subtitle: 'Link them to sharpen the Weak Radar',
        reason: 'Radar accuracy depends on error → topic links',
        topicId: null, sessionId: null,
        primaryAction: { a: 'goto-errors', id: '', label: 'Open Errors' },
        secondaryAction: { a: 'goto-syllabus', id: '', label: 'Syllabus' }
      });
    }

    let dueErrs = dueErrors();
    if (examTag) {
      dueErrs = dueErrs.filter(function(e){ return !e.examTag || e.examTag === examTag; });
    }
    dueErrs.slice(0, 3).forEach(function(e){
      const t = e.topicId ? topicById(e.topicId) : null;
      const rs = reviewState(e);
      let score = 95;
      if (rs.st === 'overdue') score += Math.min(rs.days, 10) * 2;
      if (t) {
        score *= 1 + examUrgencyForTopic(t) * 0.4;
        score *= 1 - interleavePenalty(t.subject);
        score *= matchBoost(t);
      }
      candidates.push({
        kind: 'error', score: score,
        title: '⚠️ ' + e.title,
        subtitle: (t ? t.topic + ' · ' : '') + (e.type || 'mistake'),
        reason: rs.st === 'overdue' ? ('Mistake overdue ' + rs.days + 'd')
              : (rs.st === 'new' ? 'Mistake not yet reviewed' : 'Mistake due for review'),
        topicId: e.topicId || null, sessionId: null,
        primaryAction: { a: 'grade-error', id: e.id, grade: 'good', label: '✓ Got it now' },
        secondaryAction: { a: 'grade-error', id: e.id, grade: 'again', label: 'Still unclear' }
      });
    });

    if (!candidates.length) {
      return {
        kind: 'clear', title: 'All clear',
        subtitle: 'Take a mock or add a new topic',
        reason: 'Nothing overdue · nothing weak · nothing in progress',
        topicId: null, sessionId: null,
        primaryAction: { a: 'goto-mocks', id: '', label: 'Log a Mock' },
        secondaryAction: { a: 'goto-syllabus', id: '', label: 'Browse Syllabus' }
      };
    }

    candidates.sort(function(a,b){ return b.score - a.score; });
    return candidates[0];
  };

  /* 5. SESSION MODAL with exam tag */
  window.sessionModal = function(s, prefillTopicId){
    const activeExam = window.getActiveExamTag();
    const currentExam = (s && s.examTag) || activeExam || '';
    const exams = taxList('exams');
    const examOpts = '<option value="">— Unscoped (counts for all exams) —</option>'
      + exams.map(function(e){
          return '<option value="' + esc(e) + '"' + (e === currentExam ? ' selected' : '') + '>' + esc(e) + '</option>';
        }).join('');

    openModal(s ? "Edit Session" : "Log Study Session",
      '<div class="frow"><label>Session name</label><input class="inp" name="name" value="' + esc(s ? s.name : "") + '" placeholder="e.g. Percentage PYQs — Kiran"></div>'
      + '<div class="frow"><label>Linked topic</label>' + pickerHTML("topicIds", s && s.topicId ? [s.topicId] : (prefillTopicId ? [prefillTopicId] : []), false) + '</div>'
      + '<div class="frow"><label>Exam context <span style="color:var(--text-3);font-weight:500">(optional)</span></label><select class="inp" name="examTag">' + examOpts + '</select><div class="hint">Tags this session for a specific exam. Unscoped counts for all exams in Weak Radar and recommendations.</div></div>'
      + '<div class="f2"><div class="frow"><label>Log date</label>' + dateFieldHTML("logDate", (s && s.logDate) || todayISO()) + '</div><div class="frow"><label>Last reviewed</label>' + dateFieldHTML("lastReviewed", (s && s.lastReviewed) || "") + '</div></div>'
      + '<div class="frow"><label>Duration (optional)</label><input class="inp" type="number" min="0" max="1440" step="5" name="duration" value="' + ((s && s.duration) || "") + '" placeholder="minutes" data-noclear><div class="chips" style="margin-top:8px" id="dur-chips">' + [15,30,45,60,90,120].map(function(m){ return '<button type="button" class="chip' + (s && s.duration === m ? " on" : "") + '" data-dur="' + m + '" style="padding:6px 12px;min-height:32px;font-size:12px">' + m + 'm</button>'; }).join("") + '</div><div id="focus-dur-hint" style="display:none;margin-top:8px;padding:8px 10px;border-radius:6px;background:var(--pri-medium-bg);border:1px solid var(--pri-medium-bd);color:var(--pri-medium-fg);font-size:11.5px;line-height:1.5"></div><div class="hint">Skip if you don\'t track time.</div></div>',
      function(v){
        if (!v.name) { toast("⚠️ Name required"); return false; }
        const ids = pickVals(v.topicIds);
        const dur = Math.max(0, Math.min(1440, parseInt(v.duration, 10) || 0));
        const base = {
          name: v.name,
          topicId: ids[0] || null,
          examTag: v.examTag || '',
          logDate: v.logDate || null,
          lastReviewed: v.lastReviewed || null,
          duration: dur
        };
        if (s) {
          Object.assign(s, base);
        } else {
          const fresh = Object.assign({
            id: uid("s"),
            interval: 0, ease: 2.5,
            nextReview: v.lastReviewed || todayISO(),
            stage: "1st Time Study",
            history: []
          }, base);
          S.sessions.push(fresh);
        }
        const _lastId = s ? s.id : (S.sessions[S.sessions.length - 1] ? S.sessions[S.sessions.length - 1].id : null);
        logActivity(s ? "session.edited" : "session.logged", _lastId, {
          duration: (S.sessions.find(function(x){ return x.id === _lastId; }) || {}).duration || 0,
          topicId: (S.sessions.find(function(x){ return x.id === _lastId; }) || {}).topicId || null
        });
        edit(function(){});
        toast(s ? "Session updated" : "Session logged");
      }, s ? "Save" : "Log");

    const picker = document.querySelector('.modal .tpick');
    const hint = document.querySelector('#focus-dur-hint');
    const updateHint = function(){
      if (!picker || !hint) return;
      let ids = [];
      try { ids = JSON.parse(picker.querySelector('input[type=hidden]').value || "[]"); } catch(e){}
      const tid = ids[0] || null;
      if (!tid) { hint.style.display = "none"; return; }
      const today = todayISO();
      const mins = (S.focusLog || []).filter(function(f){
        return f.topicId === tid && f.startedAt && f.startedAt.slice(0, 10) === today;
      }).reduce(function(a, f){ return a + (f.minutes || 0); }, 0);
      if (mins > 0) {
        hint.style.display = "block";
        hint.innerHTML = "⚠️ You've already logged <b>" + mins + " min</b> of Focus for this topic today. Leave duration blank to avoid double-counting.";
      } else {
        hint.style.display = "none";
      }
    };
    if (picker) picker.addEventListener("pick-change", updateHint);
    updateHint();
  };

  /* 6. ERROR MODAL with exam tag */
  window.errorModal = function(er, prefillTopicId){
    const activeExam = window.getActiveExamTag();
    const currentExam = (er && er.examTag) || activeExam || '';
    const exams = taxList('exams');
    const examOpts = '<option value="">— Unscoped (counts for all exams) —</option>'
      + exams.map(function(e){
          return '<option value="' + esc(e) + '"' + (e === currentExam ? ' selected' : '') + '>' + esc(e) + '</option>';
        }).join('');

    openModal(er ? "Edit Error" : "Log an Error",
      '<div class="frow"><label>Question — what was asked?</label><input class="inp" name="title" value="' + esc(er ? er.title : "") + '" placeholder="e.g. CI vs SI difference on ₹5000 at 8% for 2 years"></div>'
      + '<div class="frow"><label>My answer — what did I actually do?</label><input class="inp" name="myAnswer" value="' + esc(er && er.myAnswer || "") + '" placeholder="e.g. Used SI formula"></div>'
      + '<div class="frow"><label>Correct approach — why it was wrong</label><textarea class="inp" name="whyWrong" rows="2" placeholder="e.g. Should compound">' + esc(er && er.whyWrong || "") + '</textarea></div>'
      + '<div class="f2"><div class="frow"><label>Type</label>' + selPlus("type", taxList("errTypes"), er ? er.type : "", "errTypes", "Error type") + '</div><div class="frow"><label>Source</label>' + selPlus("source", taxList("errSources"), er ? er.source : "", "errSources", "Error source") + '</div></div>'
      + '<div class="f2"><div class="frow"><label>Date</label>' + dateFieldHTML("date", (er && er.date) || todayISO()) + '</div><div class="frow"><label>Link</label><input class="inp" name="link" value="' + esc(er ? er.link : "") + '" placeholder="Optional"></div></div>'
      + '<div class="frow"><label>Linked topic</label>' + pickerHTML("topicIds", er && er.topicId ? [er.topicId] : (prefillTopicId ? [prefillTopicId] : []), false) + '</div>'
      + '<div class="frow"><label>Exam context <span style="color:var(--text-3);font-weight:500">(optional)</span></label><select class="inp" name="examTag">' + examOpts + '</select><div class="hint">Tags this mistake for a specific exam. Unscoped counts for all exams.</div></div>',
      function(v){
        if (!v.title) { toast("⚠️ Question required"); return false; }
        const ids = pickVals(v.topicIds);
        const data = {
          title: v.title,
          myAnswer: (v.myAnswer || "").trim(),
          whyWrong: (v.whyWrong || "").trim(),
          type: v.type,
          source: v.source,
          examTag: v.examTag || '',
          date: v.date || "",
          link: v.link || "",
          topicId: ids[0] || null
        };
        edit(function(){
          if (er) {
            Object.assign(er, data);
          } else {
            S.errors.push(Object.assign({ id: uid("e") }, data));
          }
          logActivity("error.logged", er ? er.id : S.errors[S.errors.length - 1].id, {
            type: data.type, topicId: data.topicId, examTag: data.examTag
          });
        });
        toast(er ? "Error updated" : "Error logged");
      }, er ? "Save" : "Log");
  };

  /* 7. HONEST SYNC PASSPHRASE WORDING */
  (function(){
    const _originalAlert = window.alert;
    window.alert = function(msg){
      if (typeof msg === 'string' && msg.indexOf('NOT stored anywhere') > -1) {
        msg = '⚠️ IMPORTANT\n\n'
            + 'Your sync passphrase is not stored permanently. While this browser '
            + 'session is unlocked, Apex temporarily retains it so you don\'t have '
            + 'to retype it every time.\n\n'
            + 'If you forget it, the cloud copy is permanently unreadable.';
      }
      return _originalAlert.call(this, msg);
    };
  })();

  /* 8. HIDE PIRU FROM THEME PICKER */
  try {
    if (typeof THEMES !== 'undefined' && Array.isArray(THEMES)) {
      const piruIdx = THEMES.findIndex(function(t){ return t.id === 'piru'; });
      if (piruIdx > -1) {
        if (S.settings && S.settings.theme === 'piru') {
          S.settings.theme = 'apex';
          try { store.set(KEY, JSON.stringify(S)); } catch(e){}
          if (typeof applyTheme === 'function') applyTheme('apex');
        }
        THEMES.splice(piruIdx, 1);
        console.log('[apex-scope] removed Plum Dusk from theme picker');
      }
    }
  } catch(e){ console.warn('[apex-scope] Piru removal skipped:', e.message); }

  console.log('[apex-scope] v15 installed');
})();


/* ============================================================
   APEX SCOPE v15b — merged from apex-scope2.js
   Interval caps + projection now use the active exam's target
   ============================================================ */

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
