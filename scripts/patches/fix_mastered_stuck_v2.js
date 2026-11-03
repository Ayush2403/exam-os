#!/usr/bin/env node
/* ============================================================
   APEX MASTERED STUCK FIX V2
   - Patches stage assignment directly: `s.stage = becomingMastered ? "Mastered" : stageFromInterval(...)`
   - Fixes the verification check so it ignores the migration block.
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

/* ---- 1. Patch gradeReview stage assignment ---- */
const revOld = 's.stage=stageFromInterval(cappedInterval);';
const revNew = 's.stage=becomingMastered?"Mastered":stageFromInterval(cappedInterval);';
if (html.includes(revOld) && !html.includes(revNew)) {
  html = html.replace(revOld, revNew);
  changed++;
  log('[html] Patched gradeReview: Mastered stage overrides exam cap');
} else if (html.includes(revNew)) {
  log('[html] gradeReview already patched');
} else {
  warn('[html] gradeReview pattern not found');
}

/* ---- 2. Patch gradeError stage assignment ---- */
const errOld = 'e.stage=stageFromInterval(cappedInterval);';
const errNew = 'e.stage=becomingMastered?"Mastered":stageFromInterval(cappedInterval);';
if (html.includes(errOld) && !html.includes(errNew)) {
  html = html.replace(errOld, errNew);
  changed++;
  log('[html] Patched gradeError: Mastered stage overrides exam cap');
} else if (html.includes(errNew)) {
  log('[html] gradeError already patched');
} else {
  warn('[html] gradeError pattern not found');
}

if (changed > 0) {
  fs.writeFileSync(htmlPath, html);
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

let code = '/* APEX BUNDLE v28 (mastered stuck fix v2) */\n\n';
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

// Count occurrences of "Revise: Day 30". It should only appear exactly once (inside the migration).
const day30Matches = finalHtml.match(/"Revise: Day 30"/g);
const day30Count = day30Matches ? day30Matches.length : 0;

const checks = [
  ['html \u2014 renamed to Month 1 (ignoring migration)', day30Count <= 1 && finalHtml.includes('"Revise: Month 1"')],
  ['html \u2014 gradeReview forces Mastered', finalHtml.includes('s.stage=becomingMastered?"Mastered":stageFromInterval(cappedInterval);')],
  ['html \u2014 gradeError forces Mastered', finalHtml.includes('e.stage=becomingMastered?"Mastered":stageFromInterval(cappedInterval);')],
  ['html \u2014 migration injected', finalHtml.includes('x.stage==="Revise: Month 1"||x.stage==="Revise: Day 30"')]
];

let allOk = true;
for (const [name, pass] of checks) {
  if (pass) ok(name);
  else { bad(name); allOk = false; }
}

if (!allOk) fail('verification failed');
log('\n\u2705 All edits applied. Run: git add -A && git commit -m "fix: mastered stage decoupled from cap v2" && deploy');