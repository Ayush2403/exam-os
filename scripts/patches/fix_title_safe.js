const fs = require('fs');

// ── 1. Add CSS to apex-layout-fix.css ───────────────────────────────
const cssFile = 'apex-layout-fix.css';
let css = fs.readFileSync(cssFile, 'utf8');

if (!css.includes('apex-title-expand-css')) {
    css += `
/* ── Error Log Title Expansion ── */
.sess-name {
  white-space: normal !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}
.sess-name.expanded {
  -webkit-line-clamp: unset !important;
  overflow: visible !important;
  display: block !important;
}
`;
    fs.writeFileSync(cssFile, css);
    console.log("✅ Added CSS to apex-layout-fix.css");
}

// ── 2. Create a new JS file for the click listener ──────────────────
const jsFile = 'apex-title-expand.js';
const jsCode = `
(function() {
  if (window._apexTitleExpand) return;
  window._apexTitleExpand = true;
  document.addEventListener('click', function(e) {
    const title = e.target.closest('.sess-name');
    if (title) {
      title.classList.toggle('expanded');
    }
  });
})();
`;
fs.writeFileSync(jsFile, jsCode);
console.log("✅ Created apex-title-expand.js");

// ── 3. Rebuild apex-bundle.js to include the new JS ─────────────────
const files = ['apex-mobile.js', 'apex-sync-merge.js', 'sync.js', 'exam-weightage.js', 'exam-config.js', 'apex-final.js', 'apex-a11y.js', 'apex-keys.js', 'apex-final-batch.js', 'apex-leech-topic.js', 'apex-polish.js', 'apex-tag-fix.js', 'apex-new-exam.js', 'apex-tags-final.js', 'apex-syl-focus.js', 'apex-syl-scroll.js', 'apex-scope.js', 'apex-task-rollover.js', 'apex-obsidian-link.js', 'apex-katex-fix.js', 'apex-theme-fix.js', 'apex-exam-sync.js', 'apex-focus-notes-edit.js', 'apex-scroll-preserve.js', 'apex-focus-history-edit.js', 'apex-title-expand.js'];

let code = '/* APEX BUNDLE v17 */\n\n';
for (const f of files) {
    if (fs.existsSync(f)) {
        code += `\n// ── FILE: ${f} ──\n` + fs.readFileSync(f, 'utf8') + '\n';
    }
}
fs.writeFileSync('apex-bundle.js', code);
console.log("✅ Rebuilt apex-bundle.js with title expand logic");

// ── 4. Bump Service Worker ──────────────────────────────────────────
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js to v${nxt}`);
}