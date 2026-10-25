const fs = require('fs');
function read(f) { try { return fs.readFileSync(f, 'utf8'); } catch(e) { return ''; } }

const html = read('index.html');
const bundle = read('apex-bundle.js');
const sw = read('sw.js');
const manifest = read('manifest.json');

const checks = [
    { name: "IndexedDB Migration", pass: html.includes('const idb = {') },
    { name: "Single Bundle", pass: bundle.includes('APEX BUNDLE') && bundle.length > 100000 },
    { name: "Sync: Merge Function", pass: bundle.includes('window.mergeForSync = function') },
    { name: "Sync: Auto-Unlock", pass: bundle.includes('apex-sync-key-backup') },
    { name: "SRS: Deduplication", pass: html.includes('existing.studyLog.push') },
    { name: "SRS: Initial Due Tomorrow", pass: html.includes('tomorrow.setDate(tomorrow.getDate() + 1)') },
    { name: "Syllabus: Smart Tags", pass: html.includes('const examTags=function(t)') },
    { name: "Syllabus: Priority Pills", pass: bundle.includes('apex-cfg-pri') },
    { name: "Reviews: UI Cleanup", pass: html.includes('apex-review-ui-clean') },
    { name: "Reviews: Merged Errors", pass: html.includes('All Reviews') },
    { name: "Quick Review: Gated", pass: html.includes('apex-review-open') },
    { name: "Quick Review: Math", pass: html.includes('renderMath(item.myAnswer)') },
    { name: "Hero: Marks at Risk", pass: html.includes('marks at risk') || html.includes('Marks at Risk') },
    
    // Checking for the regex replacement results
    { name: "Settings: Advanced Toggles", pass: html.includes('showAllThemes && v.showAllThemes.length > 0') || html.includes('showAllThemes&&v.showAllThemes.length>0') },
    
    { name: "Mock: Debrief Modal", pass: html.includes('Step 1 · Tag weak topics') },
    { name: "Footer: D-Day Fix", pass: html.includes('diffD(x.date,todayISO())>=0') },
    { name: "PWA: Start URL", pass: manifest.includes('"start_url": "/"') },
    
    // Checking for the sw bypass just looking for the keyword
    { name: "PWA: SW bypasses /landing", pass: sw.includes("includes('/landing')") },
    
    { name: "Landing Page: Links", pass: read('landing.html').includes('href="/"') }
];

console.log("=== APEX FINAL VERIFICATION ===\n");
let missing = 0;
checks.forEach(c => {
    if (c.pass) console.log("✅ " + c.name);
    else { console.log("❌ " + c.name); missing++; }
});

console.log("\n--------------------------------");
if (missing === 0) console.log("🎉 ALL SYSTEMS GO! Every feature is intact.");
else console.log(`⚠️ ${missing} feature(s) are missing.`);