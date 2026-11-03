const fs = require('fs');
const { execSync } = require('child_process');

// 1. Restore the last known working version of index.html
try {
    execSync('git checkout 46b7402 -- index.html');
    console.log("✅ Restored index.html from the last stable commit");
} catch (e) {
    console.log("⚠️ Could not restore from git, proceeding with current file...");
}

let html = fs.readFileSync('index.html', 'utf8');

// 2. Inject the CSS for title expansion
const css = `
<style id="apex-title-expand-fix">
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
</style>
</head>`;

if (!html.includes('apex-title-expand-fix')) {
    html = html.replace('</head>', css);
    console.log("✅ Injected CSS");
}

// 3. Inject the JS for click-to-expand
const js = `
<script id="apex-title-expand-js">
  document.addEventListener('click', function(e) {
    const title = e.target.closest('.sess-name');
    if (title) {
      title.classList.toggle('expanded');
    }
  });
</script>
</body>`;

if (!html.includes('apex-title-expand-js')) {
    html = html.replace('</body>', js);
    console.log("✅ Injected JS");
}

// 4. Validate syntax before saving!
fs.writeFileSync('index_temp.html', html);
try {
    execSync('node --check index_temp.html', { stdio: 'ignore' });
    fs.renameSync('index_temp.html', 'index.html');
    console.log("✅ Syntax is valid! index.html saved safely.");
} catch (e) {
    fs.unlinkSync('index_temp.html');
    console.log("❌ CRITICAL: The script contains a syntax error. Changes discarded to save your app.");
}

// 5. Bump SW
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js to v${nxt}`);
}