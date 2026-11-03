#!/usr/bin/env node
/* ============================================================
   APEX GIST OVERRIDE FIX
   1. apex-app-gist-update.js
      - NAV_INFO guard: window.NAV_INFO → typeof NAV_INFO !== "undefined"
      - VIEWS.guide update: also patch window.VIEWS.guide (router uses this)
   2. index.html
      - NAV_INFO title-setter: window.NAV_INFO → typeof NAV_INFO !== "undefined"
   3. Rebuild apex-bundle.js
   4. Bump sw.js CACHE version
   5. Verify every change landed
   ============================================================ */

'use strict';
const fs = require('fs');

function log(m){ console.log(m); }
function ok(m){  console.log('  \u2713 ' + m); }
function warn(m){console.log('  \u26A0 ' + m); }
function bad(m){ console.log('  \u2717 ' + m); }
function fail(m){ console.error('\n\u274C ' + m); process.exit(1); }

let touched = 0;

/* ---- 1. Patch apex-app-gist-update.js ---------------------- */
const gistPath = 'apex-app-gist-update.js';
if (!fs.existsSync(gistPath)) fail(gistPath + ' not found — run from ExamOS-Backup root');
let gist = fs.readFileSync(gistPath, 'utf8');
let gistChanged = 0;

// 1a. NAV_INFO guard
if (gist.includes('if (window.NAV_INFO) {')) {
  gist = gist.replace('if (window.NAV_INFO) {', 'if (typeof NAV_INFO !== "undefined" && NAV_INFO) {');
  gistChanged++;
  log('[gist] NAV_INFO guard fixed');
} else if (!gist.includes('typeof NAV_INFO !== "undefined"')) {
  warn('[gist] NAV_INFO guard: pattern not found');
}

// 1b. VIEWS.guide — patch both window.VIEWS (router reads this) and lexical VIEWS (safe fallback)
if (gist.includes('if (window.VIEWS) VIEWS.guide = newViewGuide;')) {
  gist = gist.replace(
    'if (window.VIEWS) VIEWS.guide = newViewGuide;',
    'if (window.VIEWS) window.VIEWS.guide = newViewGuide;\n' +
    '  try { if (typeof VIEWS !== "undefined" && VIEWS) VIEWS.guide = newViewGuide; } catch(e) {}'
  );
  gistChanged++;
  log('[gist] VIEWS.guide dual-update applied');
} else if (!gist.includes('window.VIEWS.guide = newViewGuide')) {
  warn('[gist] VIEWS.guide: pattern not found');
}

if (gistChanged > 0) {
  fs.writeFileSync(gistPath, gist);
  touched++;
} else {
  log('[gist] already patched — no changes');
}

/* ---- 2. Patch index.html NAV_INFO title-setter ------------- */
const htmlPath = 'index.html';
if (!fs.existsSync(htmlPath)) fail(htmlPath + ' not found');
let html = fs.readFileSync(htmlPath, 'utf8');
let htmlChanged = 0;

const setterOld = 'if(id && window.NAV_INFO && NAV_INFO[id]';
const setterNew = 'if(id && typeof NAV_INFO !== "undefined" && NAV_INFO && NAV_INFO[id]';
if (html.includes(setterOld)) {
  html = html.replace(setterOld, setterNew);
  htmlChanged++;
  log('[html] NAV_INFO title-setter fixed');
} else if (!html.includes(setterNew)) {
  warn('[html] NAV_INFO title-setter: pattern not found');
}

if (htmlChanged > 0) {
  fs.writeFileSync(htmlPath, html);
  touched++;
} else {
  log('[html] already patched — no changes');
}

/* ---- 3. Rebuild apex-bundle.js ---------------------------- */
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

let code = '/* APEX BUNDLE v25 (gist override fix) */\n\n';
let missing = 0;
for (const f of files) {
  if (fs.existsSync(f)) {
    code += `\n// \u2500\u2500 FILE: ${f} \u2500\u2500\n` + fs.readFileSync(f, 'utf8') + '\n';
  } else {
    warn('missing bundle file: ' + f);
    missing++;
  }
}
fs.writeFileSync('apex-bundle.js', code);
log(`[bundle] rebuilt (${files.length - missing}/${files.length} files)`);

/* ---- 4. Bump service worker cache ------------------------- */
if (!fs.existsSync('sw.js')) fail('sw.js not found');
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (!m) fail('sw.js CACHE version line not found');
const cur = parseInt(m[1], 10);
const nxt = cur + 1;
sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
fs.writeFileSync('sw.js', sw);
log(`[sw] cache bumped v${cur} \u2192 v${nxt}`);

/* ---- 5. Verify every change landed ------------------------ */
log('\n[verify]');
const finalBundle = fs.readFileSync('apex-bundle.js', 'utf8');
const finalHtml   = fs.readFileSync('index.html', 'utf8');
const finalSw     = fs.readFileSync('sw.js', 'utf8');

const checks = [
  ['bundle \u2014 VIEWS.guide patched on window',
    finalBundle.includes('window.VIEWS.guide = newViewGuide')],
  ['bundle \u2014 NAV_INFO guard uses typeof',
    finalBundle.includes('typeof NAV_INFO !== "undefined"')],
  ['bundle \u2014 apex-app-gist-update.js included',
    finalBundle.includes('// \u2500\u2500 FILE: apex-app-gist-update.js \u2500\u2500')],
  ['html   \u2014 NAV_INFO title-setter uses typeof',
    finalHtml.includes('typeof NAV_INFO !== "undefined"')],
  ['html   \u2014 no stale window.NAV_INFO in setInterval',
    !finalHtml.match(/if\(id && window\.NAV_INFO/)],
  ['sw     \u2014 cache is now v' + nxt,
    finalSw.includes(`const CACHE = 'apex-v${nxt}'`)]
];

let allOk = true;
for (const [name, pass] of checks) {
  if (pass) ok(name);
  else { bad(name); allOk = false; }
}

if (!allOk) fail('verification failed — inspect the files above');

/* ---- Done ------------------------------------------------ */
log('\n\u2705 All edits applied' + (touched ? '' : ' (no file was actually modified)') + '.');
log('\nNext steps:');
log('  git add -A');
log("  git commit -m 'fix: VIEWS + NAV_INFO guards in gist override'");
log('  deploy');
log('\nAfter deploy, hard-refresh (Cmd+Shift+R) and confirm:');
log('  \u2022 Guide tab shows "FSRS (Free Spaced Repetition Scheduler)"');
log('  \u2022 Hover the i icon on Reviews \u2192 "FSRS-powered Spaced Repetition\u2026"');
log('  \u2022 Hover the i icon on Radar \u2192 mentions "Marks at Risk"');