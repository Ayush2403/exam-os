const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS targeting both .sess-name and .t
const css = `
<style id="fix-error-title-expand">
.t, .sess-name {
  white-space: normal !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}
.t.expanded, .sess-name.expanded {
  -webkit-line-clamp: unset !important;
  overflow: visible !important;
  display: block !important;
}
</style>
</head>`;

if (!html.includes('fix-error-title-expand')) {
    html = html.replace('</head>', css);
    console.log("✅ Added inline CSS for .t and .sess-name");
}

// 2. Add JS that toggles the class for both
const js = `
<script id="fix-error-title-expand-js">
document.addEventListener('click', function(e) {
  const title = e.target.closest('.sess-name') || e.target.closest('.t');
  if (title) {
    title.classList.toggle('expanded');
  }
});
</script>
</body>`;

if (!html.includes('fix-error-title-expand-js')) {
    html = html.replace('</body>', js);
    console.log("✅ Added inline JS for click toggle");
}

fs.writeFileSync('index.html', html);

// 3. Bump SW to force refresh
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js to v${nxt}`);
}