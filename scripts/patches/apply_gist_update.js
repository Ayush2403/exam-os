const fs = require('fs');
const files = ['apex-mobile.js', 'apex-sync-merge.js', 'sync.js', 'exam-weightage.js', 'exam-config.js', 'apex-fsrs.js', 'apex-final.js', 'apex-a11y.js', 'apex-keys.js', 'apex-final-batch.js', 'apex-leech-topic.js', 'apex-polish.js', 'apex-tag-fix.js', 'apex-new-exam.js', 'apex-tags-final.js', 'apex-syl-focus.js', 'apex-syl-scroll.js', 'apex-scope.js', 'apex-task-rollover.js', 'apex-obsidian-link.js', 'apex-katex-fix.js', 'apex-theme-fix.js', 'apex-exam-sync.js', 'apex-focus-notes-edit.js', 'apex-scroll-preserve.js', 'apex-focus-history-edit.js', 'apex-title-expand.js', 'apex-quicklog-smart.js', 'apex-onboarding.js', 'apex-quicklog-fix.js', 'apex-app-gist-update.js'];

let code = '/* APEX BUNDLE v24 */\n\n';
for (const f of files) {
    if (fs.existsSync(f)) {
        code += `\n// ── FILE: ${f} ──\n` + fs.readFileSync(f, 'utf8') + '\n';
    }
}
fs.writeFileSync('apex-bundle.js', code);
console.log("✅ Rebuilt apex-bundle.js with Gist Update");

let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js to v${nxt}`);
}