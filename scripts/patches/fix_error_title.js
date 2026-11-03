const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// 1. Inject the CSS to allow multi-line and click-to-expand
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
    changed++;
    console.log('✅ Injected CSS for title expansion');
}

// 2. Inject the JS to handle the click event
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
    changed++;
    console.log('✅ Injected JS for click-to-expand behavior');
}

if (changed > 0) {
    fs.writeFileSync('index.html', html);
    
    // Bump SW to force refresh
    let sw = fs.readFileSync('sw.js', 'utf8');
    const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
    if (m) {
        const cur = parseInt(m[1], 10);
        const nxt = cur + 1;
        sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
        fs.writeFileSync('sw.js', sw);
        console.log(`✅ Bumped sw.js cache to v${nxt}`);
    }
} else {
    console.log('ℹ️ Fix already applied.');
}