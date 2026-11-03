#!/usr/bin/env node
/* ============================================================
   APEX AUDIT FIXES (Data Integrity & Recall Gating)
   ============================================================ */

'use strict';
const fs = require('fs');

const patchCode = `
/* ============================================================
   APEX AUDIT PATCH v1
   Fixes: Auto-dedupe, Recall Gating, First Review Scheduling,
          Cue Leaks, Focus Attribution, Study Logs.
   ============================================================ */
(function(){
  if (window._apexAuditPatch) return;
  window._apexAuditPatch = true;

  // 1. DISABLE AUTO-DEDUPE (Dangerous for FSRS state)
  if (window.apexDedupeFragments) {
    window.apexDedupeFragments = function() {
      console.log("[audit] auto-dedupe disabled for safety");
      return 0;
    };
    try { apexDedupeFragments = window.apexDedupeFragments; } catch(e){}
  }

  // 2. FIX REVIEW STATE (New cards due tomorrow shouldn't be 'new' today)
  const _origReviewState = window.reviewState || reviewState;
  window.reviewState = function(s) {
    const nr = nextReview(s);
    if (!s.lastReviewed) {
      const d = diffD(nr, todayISO());
      if (d > 0) return { st: "future", nr, days: d };
      if (d < 0) return { st: "overdue", nr, days: -d };
      return { st: "today", nr };
    }
    const d = diffD(nr, todayISO());
    if (d < 0) return { st: "overdue", nr, days: -d };
    if (d === 0) return { st: "today", nr };
    return { st: "future", nr, days: d };
  };
  try { reviewState = window.reviewState; } catch(e){}

  // 3. ENFORCE RECALL GATE CENTRALLY
  const _origGradeReview = window.gradeReview || gradeReview;
  window.gradeReview = function(id, grade) {
    // If we are on the reviews page, check if the card is opened
    if (location.hash.includes('reviews') || location.hash.includes('errors')) {
      const card = document.querySelector('.sess-card[data-id="'+id+'"]');
      if (card && !card.classList.contains('apex-review-open')) {
        if (typeof toast === 'function') toast("Try to recall first", "Click 'Start review'");
        return;
      }
    }
    return _origGradeReview(id, grade);
  };
  try { gradeReview = window.gradeReview; } catch(e){}

  const _origGradeError = window.gradeError || gradeError;
  window.gradeError = function(id, grade) {
    if (location.hash.includes('reviews') || location.hash.includes('errors')) {
      const card = document.querySelector('.sess-card[data-id="'+id+'"]');
      if (card && !card.classList.contains('apex-review-open')) {
        if (typeof toast === 'function') toast("Try to recall first", "Click 'Start review'");
        return;
      }
    }
    return _origGradeError(id, grade);
  };
  try { gradeError = window.gradeError; } catch(e){}

  // 4. FIX QUICK LOG (Schedule tomorrow, append to studyLog, update logDate)
  window.quickLogDo = function(forcedTopicId) {
    var inp = document.querySelector("[data-quicklog-input]");
    if (!inp) return;
    var parsed = quickLogParse(inp.value);
    if (!parsed.topicText && !forcedTopicId) { toast("Type a topic name"); return; }
    var split = _fragmentSplit(parsed.topicText);
    var t = forcedTopicId ? topicById(forcedTopicId) : null;
    if (!t) {
      var matches = quickLogSuggest(split.topicText);
      if (!matches.length) { toast("No topic found","Try a different name"); return; }
      if (matches.length === 1) { t = matches[0]; }
      else {
        var exact = matches.find(function(m){ return m.topic.toLowerCase() === split.topicText.toLowerCase(); });
        if (exact) { t = exact; }
        else { quickLogRenderSuggest(split.topicText); toast("Multiple matches","Pick one from the list"); return; }
      }
    }
    snapshot();
    var now = todayISO();
    var tomorrow = addDays(now, 1);
    var sessionName = split.fragment ? (t.topic + " · " + split.fragment) : t.topic;
    var examTag = (typeof getActiveExamTag === "function") ? getActiveExamTag() : "";

    var existing = null;
    if (split.fragment) {
      for (var i = S.sessions.length - 1; i >= 0; i--) {
        var s = S.sessions[i];
        if (s.topicId === t.id && s.name === sessionName) { existing = s; break; }
      }
    }

    if (existing) {
      existing.duration = (existing.duration || 0) + (parsed.minutes || 0);
      existing.logDate = now;
      if (!existing.studyLog) existing.studyLog = [];
      existing.studyLog.push({ date: now, minutes: parsed.minutes || 0 });
      
      // Don't pull nextReview forward if it's already in the future
      if (!existing.nextReview) existing.nextReview = tomorrow;
      
      saveLocal();
      inp.value = "";
      var box = document.querySelector("[data-quicklog-suggest]");
      if (box) { box.innerHTML = ""; box.classList.remove("on"); }
      rerender();
      toast("✓ Attached", sessionName + " + " + (parsed.minutes || 0) + "m");
    } else {
      S.sessions.push({
        id: uid("s"),
        name: sessionName,
        topicId: t.id,
        logDate: now,
        lastReviewed: null,
        duration: parsed.minutes || 0,
        examTag: examTag,
        interval: 0,
        ease: 2.5,
        nextReview: tomorrow, // <--- SCHEDULE TOMORROW
        stage: "1st Time Study",
        history: [],
        studyLog: [{ date: now, minutes: parsed.minutes || 0 }]
      });
      saveLocal();
      inp.value = "";
      var box = document.querySelector("[data-quicklog-suggest]");
      if (box) { box.innerHTML = ""; box.classList.remove("on"); }
      rerender();
      toast("✓ Logged", sessionName + (parsed.minutes ? " · " + parsed.minutes + "m" : " · due tomorrow"));
    }
  };

  // 5. FIX FOCUS ATTRIBUTION
  const _origFocusTaskFromReview = ACTIONS["focus-task-from-review"];
  ACTIONS["focus-task-from-review"] = function(id) {
    const s = S.sessions.find(x => x.id === id);
    if (s) {
      FS.label = s.name;
      FS.topicId = s.topicId;
      FS._targetSessionId = id; // <--- PASS EXACT ID
      focusOpen();
      toast("⚡ Focus started", "Attached to " + s.name);
    } else {
      if (_origFocusTaskFromReview) _origFocusTaskFromReview(id);
    }
  };

  // Override attachFocusToSession to use the exact ID if available
  const _origAttachFocus = window.attachFocusToSession || attachFocusToSession;
  window.attachFocusToSession = function(minutes, topicId) {
    if (FS._targetSessionId) {
      const s = S.sessions.find(x => x.id === FS._targetSessionId);
      if (s) {
        s.duration = (s.duration || 0) + minutes;
        s.logDate = todayISO();
        if (!s.studyLog) s.studyLog = [];
        s.studyLog.push({ date: todayISO(), minutes: minutes });
        FS._targetSessionId = null;
        return s;
      }
    }
    return _origAttachFocus(minutes, topicId);
  };
  try { attachFocusToSession = window.attachFocusToSession; } catch(e){}

  console.log("[apex-audit-patch] installed — dedupe disabled, gating enforced, scheduling fixed");
})();
`;

fs.writeFileSync('apex-audit-patch.js', patchCode);
console.log("✅ Created apex-audit-patch.js");

// Inject CSS to hide the leaking trail
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('apex-hide-family-trail')) {
  const css = `
<style id="apex-hide-family-trail">
  .sess-family { display: none !important; }
</style>
</head>`;
  html = html.replace('</head>', css);
  fs.writeFileSync('index.html', html);
  console.log("✅ Hidden .sess-family cue leaks in index.html");
}

// Rebuild Bundle
const files = [
  'apex-mobile.js', 'apex-sync-merge.js', 'sync.js', 'exam-weightage.js',
  'exam-config.js', 'apex-fsrs.js', 'apex-final.js', 'apex-a11y.js',
  'apex-keys.js', 'apex-final-batch.js', 'apex-leech-topic.js',
  'apex-polish.js', 'apex-tag-fix.js', 'apex-new-exam.js',
  'apex-tags-final.js', 'apex-syl-focus.js', 'apex-syl-scroll.js',
  'apex-scope.js', 'apex-task-rollover.js', 'apex-obsidian-link.js',
  'apex-katex-fix.js', 'apex-theme-fix.js', 'apex-exam-sync.js',
  'apex-focus-notes-edit.js', 'apex-scroll-preserve.js',
  'apex-focus-history-edit.js', 'apex-title-expand.js',
  'apex-quicklog-smart.js', 'apex-onboarding.js', 'apex-quicklog-fix.js',
  'apex-app-gist-update.js',
  'apex-audit-patch.js' // <--- Add our new patch
];

let code = '/* APEX BUNDLE v30 (audit fixes) */\n\n';
for (const f of files) {
  if (fs.existsSync(f)) {
    code += `\n// ── FILE: ${f} ──\n` + fs.readFileSync(f, 'utf8') + '\n';
  }
}
fs.writeFileSync('apex-bundle.js', code);
console.log("✅ Rebuilt apex-bundle.js");

// Bump SW
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
  const cur = parseInt(m[1], 10);
  const nxt = cur + 1;
  sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
  fs.writeFileSync('sw.js', sw);
  console.log(`✅ Bumped sw.js to v${nxt}`);
}