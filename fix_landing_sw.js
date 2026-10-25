const fs = require('fs');
let sw = fs.readFileSync('sw.js', 'utf8');
let changed = 0;

// 1. Tell the Service Worker to bypass landing.html completely
const bypassCode = `
  /* --- Bypass landing.html completely --- */
  if (url.pathname === '/landing.html' || url.pathname === '/landing') {
    return;
  }

  /* 1. API calls — network only, never cached */`;

const oldFetch = `/* 1. API calls — network only, never cached */`;

if (sw.includes(oldFetch) && !sw.includes('Bypass landing.html')) {
    sw = sw.replace(oldFetch, bypassCode);
    changed++;
    console.log('✅ Added bypass for landing.html in sw.js');
}

// 2. Bump the cache version so the browser drops the broken SW
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    changed++;
    console.log(`✅ Bumped sw.js cache to v${nxt}`);
}

if (changed > 0) {
    fs.writeFileSync('sw.js', sw);
} else {
    console.log('ℹ️ No changes made (might already be patched).');
}