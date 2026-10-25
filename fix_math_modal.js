const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// Replace the plain text escaper with the math renderer inside the modal
const old1 = "esc(item.myAnswer)";
const new1 = "renderMath(item.myAnswer)";
const old2 = "esc(item.whyWrong)";
const new2 = "renderMath(item.whyWrong)";

if (html.includes(old1)) { 
    html = html.replace(old1, new1); 
    changed++; 
}
if (html.includes(old2)) { 
    html = html.replace(old2, new2); 
    changed++; 
}

// Bump Service Worker to force refresh
const swFile = 'sw.js';
let sw = fs.readFileSync(swFile, 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync(swFile, sw);
    console.log(`✅ sw.js bumped to v${nxt}`);
}

if (changed > 0) {
    fs.writeFileSync('index.html', html);
    console.log('✅ Math rendering enabled in Focus Review modal.');
} else {
    console.log('❌ Could not find the exact strings.');
}