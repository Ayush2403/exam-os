const fs = require('fs');

function read(f) {
    try { return fs.readFileSync(f, 'utf8'); } catch(e) { return ''; }
}

const html = read('index.html');
const bundle = read('apex-bundle.js');
const sync = read('sync.js');
const sw = read('sw.js');
const manifest = read('manifest.json');

const checks = [
    // Core Architecture
    { name: "IndexedDB Migration", pass: html.includes('const idb = {') },
    { name: "Single Bundle (apex-bundle.js)", pass: bundle.includes('APEX BUNDLE') && bundle.length > 100000 },
    { name: "Sync: Merge Function Restored", pass: bundle.includes('window.mergeForSync = function') },
    { name: "Sync: Auto-Unlock Active", pass: bundle.includes('apex-sync-key-backup') },
    
    // SRS Engine
    { name: "SRS: Deduplication (Study Logs)", pass: html.includes('existing.studyLog.push') },
    { name: "SRS: Initial Due Tomorrow", pass: html.includes('tomorrow.setDate(tomorrow.getDate() + 1)') },
    
    // UI & UX Fixes
    { name: "Syllabus: Smart Tag Truncation", pass: html.includes('const examTags=function(t)') && html.includes('sortedExams = [...t.exams]') },
    { name: "Syllabus: Clean Priority Pills", pass: html.includes('apex-cfg-pri') || html.includes('CRIT') },
    { name: "Reviews: UI Cleanup CSS", pass: html.includes('apex-review-ui-clean') },
    { name: "Reviews: Merged Errors + Sessions", pass: html.includes('All Reviews') && html.includes('rtabCount') },
    { name: "Quick Review: Gated by Start Button", pass: html.includes('apex-review-open') },
    { name: "Quick Review: Math Rendering", pass: html.includes('renderMath(item.myAnswer)') },
    { name: "Hero & Radar: Marks at Risk Badge", pass: html.includes('marks at risk') || html.includes('Marks at Risk') },
    { name: "Settings: Advanced Toggles Fixed", pass: html.includes('showAllThemes&&v.showAllThemes.length>0') },
    { name: "Mock: Intelligent Debrief Modal", pass: html.includes('Step 1 · Tag weak topics') },
    { name: "Footer: D-Day Fix (Future Exams)", pass: html.includes('diffD(x.date,todayISO())>=0') },
    
    // PWA & Routing
    { name: "PWA: Start URL is root '/'", pass: manifest.includes('"start_url": "/"') },
    { name: "PWA: SW bypasses /landing", pass: sw.includes("includes('/landing') return;") },
    { name: "Landing Page: Links to '/'", pass: read('landing.html').includes('href="/"') }
];

console.log("=== APEX FINAL VERIFICATION ===\n");
let missing = 0;

checks.forEach(c => {
    if (c.pass) {
        console.log("✅ " + c.name);
    } else {
        console.log("❌ " + c.name + " (MISSING)");
        missing++;
    }
});

console.log("\n--------------------------------");
if (missing === 0) {
    console.log("🎉 ALL SYSTEMS GO! Every feature is intact.");
} else {
    console.log(`⚠️ ${missing} feature(s) are missing. Let me know which ones and we'll patch them.`);
}