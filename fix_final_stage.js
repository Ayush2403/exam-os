#!/usr/bin/env node
/* ============================================================
   APEX FINAL STAGE CLEANUP
   1. Replaces ALL "Revise: Day 30" in the app with "Revise: Month 1"
   2. Injects exactly ONE clean migration block for old data
   3. Verifies the logic correctly
   4. Rebuilds bundle + bumps SW
   ============================================================ */

'use strict';
const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');
let changed = 0;

/* ---- 1. Global rename ---- */
if (html.includes('"Revise: Day 30"')) {
  html = html.split('"Revise: Day 30"').join('"Revise: Month 1"');
  changed++;
  console.log('[html] Replaced all "Revise: Day 30" with "Revise: Month 1"');
}

/* ---- 2. Clean up any broken/duplicate migration blocks from previous runs ---- */
const badMig1 = 'if(Array.isArray(s.sessions)){s.sessions.forEach(x=>{if(x.stage==="Revise: Month 1")x.stage="Revise: Month 1";});}';
const badMig2 = 'if(Array.isArray(s.errors)){s.errors.forEach(x=>{if(x.stage==="Revise: Month 1")x.stage="Revise: Month 1";});}';
if (html.includes(badMig1) || html.includes(badMig2)) {
  html = html.split(badMig1).join('');
  html = html.split(badMig2).join('');
  changed++;
  console.log('[html] Removed broken migration blocks from v1/v2');
}

/* ---- 3. Inject exactly ONE correct migration block ---- */
const targetFn = 'function applyIdempotentTransforms(s){';
if (html.includes(targetFn)) {
  const goodMig = '\n  if(Array.isArray(s.sessions)){s.sessions.forEach(x=>{if(x.stage==="Revise: Day 30")x.stage="Revise: Month 1";});}\n  if(Array.isArray(s.errors)){s.errors.forEach(x=>{if(x.stage==="Revise: Day 30")x.stage="Revise: Month 1";});}\n';
  
  // Clean up old versions of this block if they exist
  html = html.split(goodMig).join('');
  
  // Inject fresh at the top of the function
  html = html.replace(targetFn, targetFn + goodMig);
  changed++;
  console.log('[html] Injected clean data migration for old cards');
}

if (changed > 0) {
  fs.writeFileSync(htmlPath, html);
} else {
  console.log('[html] No changes needed');
}

/* ---- 4. Rebuild bundle ------------------------------------ */
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

let code = '/* APEX BUNDLE v29 (final stage cleanup) */\n\n';
for (const f of files) {
  if (fs.existsSync(f)) {
    code += `\n// \u2500\u2500 FILE: ${f} \u2500\u2500\n` + fs.readFileSync(f, 'utf8') + '\n';
  }
}
fs.writeFileSync('apex-bundle.js', code);
console.log('[bundle] rebuilt');

/* ---- 5. Bump service worker ------------------------------- */
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
  const cur = parseInt(m[1], 10);
  const nxt = cur + 1;
  sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
  fs.writeFileSync('sw.js', sw);
  console.log(`[sw] cache bumped v${cur} \u2192 v${nxt}`);
}

/* ---- 6. Verify -------------------------------------------- */
console.log('\n[verify]');
const finalHtml = fs.readFileSync('index.html', 'utf8');

// The ONLY place "Revise: Day 30" should exist is inside the 2 migration lines
const day30Matches = finalHtml.match(/"Revise: Day 30"/g);
const day30Count = day30Matches ? day30Matches.length : 0;

const checks = [
  ['html \u2014 STAGES renamed to Month 1', finalHtml.includes('"Revise: Month 1"')],
  ['html \u2014 old Day 30 only exists in migration', day30Count === 2],
  ['html \u2014 gradeReview forces Mastered', finalHtml.includes('s.stage=becomingMastered?"Mastered":stageFromInterval(cappedInterval);')],
  ['html \u2014 gradeError forces Mastered', finalHtml.includes('e.stage=becomingMastered?"Mastered":stageFromInterval(cappedInterval);')],
  ['html \u2014 clean migration injected', finalHtml.includes('if(x.stage==="Revise: Day 30")x.stage="Revise: Month 1";')]
];

let allOk = true;
for (const [name, pass] of checks) {
  if (pass) console.log('  \u2713 ' + name);
  else { console.log('  \u2717 ' + name); allOk = false; }
}

if (!allOk) {
  console.error('\n\u274C verification failed');
  process.exit(1);
} else {
  console.log('\n\u2705 All edits applied. Run: git add -A && git commit -m "fix: final stage cleanup" && deploy');
}