#!/usr/bin/env node
/* ============================================================
   APEX MASTERED STUCK FIX
   1. Rename STAGES and stageFromInterval strings
   2. Patch gradeReview & gradeError so becomingMastered 
      forces the stage to "Mastered" even if the interval 
      is capped by the exam.
   3. Add a data migration to rename existing "Revise: Day 30" 
      in IndexedDB to "Revise: Month 1"
   4. Rebuild bundle + bump SW
   ============================================================ */

'use strict';
const fs = require('fs');

function log(m){ console.log(m); }
function ok(m){  console.log('  \u2713 ' + m); }
function warn(m){console.log('  \u26A0 ' + m); }
function bad(m){ console.log('  \u2717 ' + m); }
function fail(m){ console.error('\n\u274C ' + m); process.exit(1); }

const htmlPath = 'index.html';
if (!fs.existsSync(htmlPath)) fail(htmlPath + ' not found');
let html = fs.readFileSync(htmlPath, 'utf8');
let changed = 0;

/* ---- 1. Global string rename ---- */
// Replace in STAGES array and stageFromInterval function
if (html.includes('"Revise: Day 30"')) {
  html = html.replace(/"Revise: Day 30"/g, '"Revise: Month 1"');
  changed++;
  log('[html] Replaced all "Revise: Day 30" strings with "Revise: Month 1"');
}

/* ---- 2. Patch gradeReview ---- */
const gradeReviewOld = 's.interval=cappedInterval;s.ease=newEase;s.lastReviewed=now;s.nextReview=addDays(now,cappedInterval);s.stage=stageFromInterval(cappedInterval);';
const gradeReviewNew = 's.interval=cappedInterval;s.ease=newEase;s.lastReviewed=now;s.nextReview=addDays(now,cappedInterval);if(becomingMastered){s.stage="Mastered";}else{s.stage=stageFromInterval(cappedInterval);}';

if (html.includes(gradeReviewOld)) {
  html = html.replace(gradeReviewOld, gradeReviewNew);
  changed++;
  log('[html] Patched gradeReview: Mastered stage overrides exam cap');
} else if (!html.includes('if(becomingMastered){s.stage="Mastered";}')) {
  warn('[html] gradeReview pattern not found');
}

/* ---- 3. Patch gradeError ---- */
const gradeErrorOld = 'e.interval=cappedInterval;e.ease=newEase;e.lastReviewed=now;e.nextReview=addDays(now,cappedInterval);e.stage=stageFromInterval(cappedInterval);';
const gradeErrorNew = 'e.interval=cappedInterval;e.ease=newEase;e.lastReviewed=now;e.nextReview=addDays(now,cappedInterval);if(becomingMastered){e.stage="Mastered";}else{e.stage=stageFromInterval(cappedInterval);}';

if (html.includes(gradeErrorOld)) {
  html = html.replace(gradeErrorOld, gradeErrorNew);
  changed++;
  log('[html] Patched gradeError: Mastered stage overrides exam cap');
} else if (!html.includes('if(becomingMastered){e.stage="Mastered";}')) {
  warn('[html] gradeError pattern not found');
}

/* ---- 4. Inject data migration for existing cards ---- */
// We insert this into the existing `applyIdempotentTransforms` function
const migOld = 'if(Array.isArray(s.syllabus)){';
const migNew = `if(Array.isArray(s.sessions)){s.sessions.forEach(x=>{if(x.stage==="Revise: Day 30")x.stage="Revise: Month 1";});}\n  if(Array.isArray(s.errors)){s.errors.forEach(x=>{if(x.stage==="Revise: Day 30")x.stage="Revise: Month 1";});}\n  if(Array.isArray(s.syllabus)){`;

if (html.includes(migOld) && !html.includes('if(x.stage==="Revise: Day 30")')) {
  html = html.replace(migOld, migNew);
  changed++;
  log('[html] Injected data migration for existing cards');
}

if (changed > 0) {
  fs.writeFileSync(htmlPath, html);
} else {
  log('[html] already patched — no changes');
}

/* ---- 5. Rebuild bundle ------------------------------------ */
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
  'apex-app-gist-update.js'
];

let code = '/* APEX BUNDLE v27 (mastered stuck fix) */\n\n';
for (const f of files) {
  if (fs.existsSync(f)) {
    code += `\n// \u2500\u2500 FILE: ${f} \u2500\u2500\n` + fs.readFileSync(f, 'utf8') + '\n';
  }
}
fs.writeFileSync('apex-bundle.js', code);
log('[bundle] rebuilt');

/* ---- 6. Bump service worker ------------------------------- */
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
  const cur = parseInt(m[1], 10);
  const nxt = cur + 1;
  sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
  fs.writeFileSync('sw.js', sw);
  log(`[sw] cache bumped v${cur} \u2192 v${nxt}`);
}

/* ---- 7. Verify -------------------------------------------- */
log('\n[verify]');
const finalHtml = fs.readFileSync('index.html', 'utf8');
const checks = [
  ['html \u2014 renamed to Month 1', !finalHtml.includes('"Revise: Day 30"') && finalHtml.includes('"Revise: Month 1"')],
  ['html \u2014 gradeReview forces Mastered', finalHtml.includes('if(becomingMastered){s.stage="Mastered";}')],
  ['html \u2014 gradeError forces Mastered', finalHtml.includes('if(becomingMastered){e.stage="Mastered";}')],
  ['html \u2014 migration injected', finalHtml.includes('if(x.stage==="Revise: Day 30")')]
];

let allOk = true;
for (const [name, pass] of checks) {
  if (pass) ok(name);
  else { bad(name); allOk = false; }
}

if (!allOk) fail('verification failed');
log('\n\u2705 All edits applied. Run: git add -A && git commit -m "fix: mastered stage decoupled from cap" && deploy');