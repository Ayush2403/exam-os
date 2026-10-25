const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// Find the exact current weakRow function
const oldFn = `function weakRow(x){const t=x.t;return'<div class="weak-item"><span class="weak-score">'+x.score+'</span><div class="weak-t" data-action="radar-breakdown" data-id="'+t.id+'" style="cursor:pointer">'+esc(t.topic)+'</div><button class="mini-icon" data-action="goto-topic" data-id="'+t.id+'">'+ICONS.pencil+'</button><button class="mini-icon accent" data-action="timer-start-topic" data-id="'+t.id+'"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg></button></div>';}`;

// The new version with the marks at risk calculation
const newFn = `function weakRow(x){
  const t=x.t;
  const marks = (typeof computeTopicPriority === 'function') ? Math.round(computeTopicPriority(t, getActiveExamTag())/20) : 0;
  const markBadge = marks > 0 ? '<span class="pill" style="font-size:9px;padding:1px 6px;margin-left:6px;background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#fca5a5;font-weight:700">⚠️ '+marks+' marks</span>' : '';
  return '<div class="weak-item"><span class="weak-score">'+x.score+'</span><div class="weak-t" data-action="radar-breakdown" data-id="'+t.id+'" style="cursor:pointer;display:flex;align-items:center">'+esc(t.topic)+markBadge+'</div><button class="mini-icon" data-action="goto-topic" data-id="'+t.id+'">'+ICONS.pencil+'</button><button class="mini-icon accent" data-action="timer-start-topic" data-id="'+t.id+'"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg></button></div>';
}`;

if (html.includes(oldFn)) {
    html = html.replace(oldFn, newFn);
    changed++;
    console.log('✅ Added Marks-at-Risk to the Weak Radar rows');
} else {
    console.log('❌ Could not find the exact weakRow string.');
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