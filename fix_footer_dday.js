const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// The old logic: finds the earliest exam, even if it's in the past
const oldLogic = `(function(){var e=(S.settings.exams||[]).filter(function(x){return x.date;}).sort(function(a,b){return a.date<b.date?-1:1;})[0];if(!e)return '<span class="pill" style="font-size:9.5px;padding:2px 8px;letter-spacing:.08em;color:var(--text-3);border-color:var(--border);background:transparent">no exam</span>';var d=Math.max(0,diffD(e.date,todayISO()));return '<span class="pill" style="font-size:9.5px;padding:2px 8px;letter-spacing:.08em">D-'+d+'</span>';})()`;

// The new logic: only looks at exams that are happening today or in the future
const newLogic = `(function(){var e=(S.settings.exams||[]).filter(function(x){return x.date && diffD(x.date,todayISO())>=0;}).sort(function(a,b){return a.date<b.date?-1:1;})[0];if(!e)return '<span class="pill" style="font-size:9.5px;padding:2px 8px;letter-spacing:.08em;color:var(--text-3);border-color:var(--border);background:transparent">no future exam</span>';var d=diffD(e.date,todayISO());return '<span class="pill" style="font-size:9.5px;padding:2px 8px;letter-spacing:.08em">D-'+d+'</span>';})()`;

if (html.includes(oldLogic)) {
    html = html.replace(oldLogic, newLogic);
    changed++;
    console.log('✅ Fixed footer D-Day logic to ignore past exams');
} else {
    console.log('❌ Could not find the exact footer logic string.');
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
}