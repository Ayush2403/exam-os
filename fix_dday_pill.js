const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// Fix 1: Ignore past exams when picking the date
const oldFilter = `var e=(S.settings.exams||[]).filter(function(x){return x.date;})`;
const newFilter = `var e=(S.settings.exams||[]).filter(function(x){return x.date && diffD(x.date,todayISO())>=0;})`;

if (html.includes(oldFilter)) {
    html = html.replace(oldFilter, newFilter);
    changed++;
    console.log('✅ Fixed footer to ignore past exams');
}

// Fix 2: Remove the Math.max(0) so it doesn't artificially force to 0
const oldMath = `var d=Math.max(0,diffD(e.date,todayISO()));`;
const newMath = `var d=diffD(e.date,todayISO());`;

if (html.includes(oldMath)) {
    html = html.replace(oldMath, newMath);
    changed++;
    console.log('✅ Removed Math.max(0) clamp');
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
    console.log('❌ Could not find the exact strings. It might already be fixed.');
}