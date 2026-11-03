#!/usr/bin/env node
/* ============================================================
   APEX FSRS MASTERED FIX
   1. Rename "Revise: Day 30" to "Revise: Month 1" everywhere
   2. Change "Mastered" trigger from >60 days to >=30 days
   3. Rebuild bundle + bump SW
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

/* ---- 1. Rename "Revise: Day 30" --------------------------- */
if (html.includes('"Revise: Day 30"')) {
  html = html.replace(/"Revise: Day 30"/g, '"Revise: Month 1"');
  changed++;
  log('[html] Renamed "Revise: Day 30" to "Revise: Month 1"');
} else if (!html.includes('"Revise: Month 1"')) {
  warn('[html] "Revise: Day 30" pattern not found');
}

/* ---- 2. Change Mastered trigger to >= 30 days ------------- */
// This appears twice: in gradeReview and gradeError
const oldLogic = 'const becomingMastered=!wasMastered&&stageFromInterval(newInterval)==="Mastered";';
const newLogic = 'const becomingMastered=!wasMastered&&newInterval>=30;';

if (html.includes(oldLogic)) {
  html = html.replace(new RegExp(oldLogic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLogic);
  changed++;
  log('[html] Changed Mastered trigger to newInterval >= 30');
} else if (!html.includes(newLogic)) {
  warn('[html] becomingMastered logic pattern not found');
}

if (changed > 0) {
  fs.writeFileSync(htmlPath, html);
} else {
  log('[html] already patched — no changes');
}

/* ---- 3. Rebuild bundle ------------------------------------ */
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

let code = '/* APEX BUNDLE v26 (fsrs mastered fix) */\n\n';
for (const f of files) {
  if (fs.existsSync(f)) {
    code += `\n// \u2500\u2500 FILE: ${f} \u2500\u2500\n` + fs.readFileSync(f, 'utf8') + '\n';
  }
}
fs.writeFileSync('apex-bundle.js', code);
log('[bundle] rebuilt');

/* ---- 4. Bump service worker ------------------------------- */
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
  const cur = parseInt(m[1], 10);
  const nxt = cur + 1;
  sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
  fs.writeFileSync('sw.js', sw);
  log(`[sw] cache bumped v${cur} \u2192 v${nxt}`);
}

/* ---- 5. Verify -------------------------------------------- */
log('\n[verify]');
const finalHtml = fs.readFileSync('index.html', 'utf8');
const checks = [
  ['html \u2014 renamed to Revise: Month 1', finalHtml.includes('"Revise: Month 1"')],
  ['html \u2014 no stale "Revise: Day 30"', !finalHtml.includes('"Revise: Day 30"')],
  ['html \u2014 Mastered trigger uses >=30', finalHtml.includes('newInterval>=30')],
  ['html \u2014 old trigger removed', !finalHtml.includes('stageFromInterval(newInterval)==="Mastered"')]
];

let allOk = true;
for (const [name, pass] of checks) {
  if (pass) ok(name);
  else { bad(name); allOk = false; }
}

if (!allOk) fail('verification failed — inspect the files above');
log('\n\u2705 All edits applied. Run: git add -A && git commit -m "fix: FSRS mastered threshold" && deploy');