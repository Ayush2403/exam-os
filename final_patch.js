const fs = require('fs');

// ── 1. Fix Advanced Settings in index.html ──────────────────────────
let html = fs.readFileSync('index.html', 'utf8');
let htmlChanged = false;

const settingsFixes = [
    { old: 'S.settings.showAllThemes=Array.isArray(v.showAllThemes);', new: 'S.settings.showAllThemes=(v.showAllThemes&&v.showAllThemes.length>0);' },
    { old: 'S.settings.showAllThemes = Array.isArray(v.showAllThemes);', new: 'S.settings.showAllThemes = (v.showAllThemes && v.showAllThemes.length > 0);' },
    { old: 'S.settings.flashcardMode=Array.isArray(v.flashcardMode);', new: 'S.settings.flashcardMode=(v.flashcardMode&&v.flashcardMode.length>0);' },
    { old: 'S.settings.flashcardMode = Array.isArray(v.flashcardMode);', new: 'S.settings.flashcardMode = (v.flashcardMode && v.flashcardMode.length > 0);' },
    { old: 'S.settings.autoExportEvery=Array.isArray(v.autoExport)?20:0;', new: 'S.settings.autoExportEvery=(v.autoExport&&v.autoExport.length>0)?20:999999;' },
    { old: 'S.settings.autoExportEvery = Array.isArray(v.autoExport) ? 20 : 0;', new: 'S.settings.autoExportEvery = (v.autoExport && v.autoExport.length > 0) ? 20 : 999999;' }
];

settingsFixes.forEach(fix => {
    if (html.includes(fix.old)) {
        html = html.replace(fix.old, fix.new);
        htmlChanged = true;
        console.log(`✅ Fixed: ${fix.old.trim()}`);
    }
});

if (htmlChanged) fs.writeFileSync('index.html', html);

// ── 2. Fix PWA SW bypass in sw.js ──────────────────────────────────
let sw = fs.readFileSync('sw.js', 'utf8');
let swChanged = false;

// We insert the bypass right after the GET method check
const oldSwAnchor = "if (e.request.method !== 'GET') return;";
const newSwAnchor = "if (e.request.method !== 'GET') return;\n  if (e.request.url.includes('/landing')) return; // Bypass landing page";

if (sw.includes(oldSwAnchor) && !sw.includes("includes('/landing')")) {
    sw = sw.replace(oldSwAnchor, newSwAnchor);
    swChanged = true;
    console.log("✅ Patched SW to bypass /landing");
} else if (!sw.includes("includes('/landing')")) {
    // Fallback: just put it at the top of the fetch listener
    sw = sw.replace("self.addEventListener('fetch', function(e){", "self.addEventListener('fetch', function(e){\n  if (e.request.url.includes('/landing')) return;");
    swChanged = true;
    console.log("✅ Patched SW to bypass /landing (Fallback)");
} else {
    console.log("ℹ️ SW already bypasses /landing");
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