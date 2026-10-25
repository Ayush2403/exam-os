const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let bundle = fs.readFileSync('apex-bundle.js', 'utf8');
let sw = fs.readFileSync('sw.js', 'utf8');

const checks = [
  { name: "SRS Deduplication", pass: html.includes("existing.studyLog.push") },
  { name: "Initial Due Tomorrow", pass: html.includes("tomorrow.setDate(tomorrow.getDate() + 1)") },
  { name: "Hero Card Marks at Risk", pass: html.includes("marks at risk") },
  { name: "Home Card Gating", pass: html.includes('data-action="quick-review"') && html.includes('apex-review-open') },
  { name: "Advanced Settings Fix", pass: html.includes("showAllThemes&&v.showAllThemes.length>0") },
  { name: "Syllabus Smart Tags", pass: html.includes("const sortedExams = [...t.exams].sort") },
  { name: "Footer D-Day Fix", pass: html.includes("diffD(x.date,todayISO())>=0") },
  { name: "Auto Unlock", pass: bundle.includes("apex-sync-auto") },
  { name: "Intelligent Debrief Modal", pass: html.includes("Step 1 · Tag weak topics") },
  { name: "Merged Reviews", pass: html.includes("All Reviews") },
  { name: "Landing Page Fix", pass: fs.readFileSync('landing.html', 'utf8').includes('href="/"') },
  { name: "PWA SW Redirect", pass: sw.includes("if (e.request.url.includes('landing')) return;") },
  { name: "Math in Quick Review", pass: html.includes("renderMath(item.myAnswer)") }
];

console.log("=== APEX FEATURE CHECK ===");
let missing = 0;
checks.forEach(c => {
  if (c.pass) {
    console.log("✅ " + c.name);
  } else {
    console.log("❌ " + c.name + " (MISSING)");
    missing++;
  }
});

if (missing === 0) {
  console.log("\n🎉 All features are present!");
} else {
  console.log("\n⚠️ " + missing + " features are missing. Let me know and I'll write a fix.");
}