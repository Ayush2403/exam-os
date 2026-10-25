const fs = require('fs');

// ── 1. Fix Advanced Settings in index.html ──────────────────────────
let html = fs.readFileSync('index.html', 'utf8');
let htmlChanged = false;

if (!html.includes('v.showAllThemes.length>0')) {
    html = html.replace(/S\.settings\.showAllThemes=Array\.isArray\(v\.showAllThemes\);/g, 'S.settings.showAllThemes=(v.showAllThemes&&v.showAllThemes.length>0);');
    html = html.replace(/S\.settings\.flashcardMode=Array\.isArray\(v\.flashcardMode\);/g, 'S.settings.flashcardMode=(v.flashcardMode&&v.flashcardMode.length>0);');
    html = html.replace(/S\.settings\.autoExportEvery=Array\.isArray\(v\.autoExport\)\?20:0;/g, 'S.settings.autoExportEvery=(v.autoExport&&v.autoExport.length>0)?20:999999;');
    htmlChanged = true;
    console.log("✅ Patched Advanced Settings in index.html");
}
if (htmlChanged) fs.writeFileSync('index.html', html);

// ── 2. Fix PWA Service Worker bypass ───────────────────────────────
let sw = fs.readFileSync('sw.js', 'utf8');
let swChanged = false;

if (!sw.includes("includes('/landing')")) {
    sw = sw.replace("self.addEventListener('fetch', function(e){", "self.addEventListener('fetch', function(e){\n  if (e.request.url.includes('/landing')) return;");
    swChanged = true;
    console.log("✅ Patched SW to bypass /landing");
}

if (swChanged) {
    const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
    if (m) {
        const cur = parseInt(m[1], 10);
        const nxt = cur + 1;
        sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
        console.log(`✅ Bumped sw.js to v${nxt}`);
    }
    fs.writeFileSync('sw.js', sw);
}

// ── 3. Re-inject Priority Pills into apex-bundle.js ────────────────
let bundle = fs.readFileSync('apex-bundle.js', 'utf8');

if (!bundle.includes('apex-cfg-pri')) {
    const pillScript = `
// ── APEX PRIORITY PILLS ──
(function(){
  if (window._apexCfgPills) return;
  window._apexCfgPills = true;
  function paint() {
    var list = document.getElementById("syl-list");
    if (!list) return;
    var exam = (typeof getActiveExam === "function") ? getActiveExam() : "";
    list.querySelectorAll(".topic-row").forEach(function(row) {
      var id = row.dataset.id;
      if (!id) return;
      var t = topicById(id);
      if (!t) return;
      var nameRow = row.querySelector('.topic-body > div:first-child');
      if (!nameRow) return;
      var isTagged = Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
      var pill = nameRow.querySelector(".apex-cfg-pri");
      if (!pill) {
        pill = document.createElement("span");
        pill.className = "pill apex-cfg-pri";
        pill.style.cssText = "margin-left:auto;flex-shrink:0;font-size:9.5px;padding:2px 9px;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;font-weight:600";
        nameRow.appendChild(pill);
      }
      if (!isTagged) {
        pill.style.background = "rgba(120,120,120,.08)";
        pill.style.borderColor = "rgba(120,120,120,.25)";
        pill.style.color = "#6b7280";
        pill.textContent = "\\u2014 " + exam;
      } else {
        var score = 0;
        try { if (typeof window.computeTopicPriority === "function") score = window.computeTopicPriority(t, exam); } catch(e){}
        var lbl = score >= 70 ? "CRIT" : score >= 50 ? "HIGH" : score >= 30 ? "MED" : "LOW";
        var bg, bd, fg;
        if (score >= 70) { bg="rgba(248,113,113,.18)"; bd="rgba(248,113,113,.5)"; fg="#fca5a5"; }
        else if (score >= 50) { bg="rgba(250,204,21,.18)"; bd="rgba(250,204,21,.5)"; fg="#fde68a"; }
        else if (score >= 30) { bg="rgba(96,165,250,.18)"; bd="rgba(96,165,250,.5)"; fg="#93c5fd"; }
        else { bg="rgba(74,222,128,.15)"; bd="rgba(74,222,128,.45)"; fg="#86efac"; }
        pill.style.background = bg;
        pill.style.borderColor = bd;
        pill.style.color = fg;
        pill.textContent = lbl + " " + score;
      }
    });
  }
  var view = document.getElementById("view");
  if (view) new MutationObserver(paint).observe(view, { childList: true, subtree: true });
  setTimeout(paint, 500);
  setTimeout(paint, 1500);
})();
`;
    bundle += "\n" + pillScript;
    fs.writeFileSync('apex-bundle.js', bundle);
    console.log("✅ Re-injected priority pill logic into apex-bundle.js");
}