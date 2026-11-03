#!/usr/bin/env node
/* ============================================================
   APEX BUILD SYSTEM
   Replaces all previous apply_*.js scripts.
   ============================================================ */

'use strict';
const fs = require('fs');

// The definitive order of the bundle.
// Pruned: apex-final.js (superseded by scroll-preserve), 
//         apex-title-expand.js (handled inline), 
//         apex-fsrs-ui.js (handled inline).
const files = [
  'apex-mobile.js',
  'apex-sync-merge.js',
  'sync.js',
  'exam-weightage.js',
  'exam-config.js',
  'apex-fsrs.js',
  'apex-a11y.js',
  'apex-keys.js',
  'apex-final-batch.js',
  'apex-leech-topic.js',
  'apex-polish.js',
  'apex-tag-fix.js',
  'apex-new-exam.js',
  'apex-tags-final.js',
  'apex-syl-focus.js',
  'apex-syl-scroll.js',
  'apex-scope.js',
  'apex-task-rollover.js',
  'apex-obsidian-link.js',
  'apex-katex-fix.js',
  'apex-theme-fix.js',
  'apex-exam-sync.js',
  'apex-focus-notes-edit.js',
  'apex-scroll-preserve.js',
  'apex-focus-history-edit.js',
  'apex-quicklog-smart.js',
  'apex-onboarding.js',
  'apex-quicklog-fix.js',
  'apex-app-gist-update.js',
  'apex-audit-patch.js'
];

let code = '/* APEX BUNDLE v31 (clean build) */\n\n';
let missing = 0;

for (const f of files) {
  if (fs.existsSync(f)) {
    code += `\n// ── FILE: ${f} ──\n` + fs.readFileSync(f, 'utf8') + '\n';
  } else {
    console.warn('⚠️ Missing: ' + f);
    missing++;
  }
}

fs.writeFileSync('apex-bundle.js', code);
console.log(`✅ Rebuilt apex-bundle.js (${files.length - missing}/${files.length} files)`);

// Bump SW Cache
if (fs.existsSync('sw.js')) {
  let sw = fs.readFileSync('sw.js', 'utf8');
  const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
  if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js to v${nxt}`);
  }
}