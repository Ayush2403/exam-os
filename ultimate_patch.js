const fs = require('fs');

// ── 1. Fix Advanced Settings (Regex ignores spacing) ─────────────────
let html = fs.readFileSync('index.html', 'utf8');
let htmlChanged = false;

const s1 = /S\.settings\.showAllThemes\s*=\s*Array\.isArray\(v\.showAllThemes\);/g;
if (s1.test(html)) {
    html = html.replace(s1, 'S.settings.showAllThemes = (v.showAllThemes && v.showAllThemes.length > 0);');
    htmlChanged = true; console.log("✅ Fixed showAllThemes");
}

const s2 = /S\.settings\.flashcardMode\s*=\s*Array\.isArray\(v\.flashcardMode\);/g;
if (s2.test(html)) {
    html = html.replace(s2, 'S.settings.flashcardMode = (v.flashcardMode && v.flashcardMode.length > 0);');
    htmlChanged = true; console.log("✅ Fixed flashcardMode");
}

const s3 = /S\.settings\.autoExportEvery\s*=\s*Array\.isArray\(v\.autoExport\)\s*\?\s*20\s*:\s*0;/g;
if (s3.test(html)) {
    html = html.replace(s3, 'S.settings.autoExportEvery = (v.autoExport && v.autoExport.length > 0) ? 20 : 999999;');
    htmlChanged = true; console.log("✅ Fixed autoExportEvery");
}

if (htmlChanged) fs.writeFileSync('index.html', html);

// ── 2. Force PWA SW bypass to the absolute top of fetch ──────────────
let sw = fs.readFileSync('sw.js', 'utf8');
const swOld = "self.addEventListener('fetch', function(e){";
const swNew = "self.addEventListener('fetch', function(e){\n  if (e.request.url.includes('/landing')) return; // Bypass landing page";

if (sw.includes(swOld) && !sw.includes("Bypass landing page")) {
    sw = sw.replace(swOld, swNew);
    const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
    if (m) {
        const cur = parseInt(m[1], 10);
        sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${cur+1}'`);
        console.log(`✅ Bumped sw.js to v${cur+1}`);
    }
    fs.writeFileSync('sw.js', sw);
    console.log("✅ Forced SW bypass for /landing");
} else {
    console.log("ℹ️ SW bypass already exists.");
}