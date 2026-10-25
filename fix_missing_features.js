const fs = require('fs');
let changed = 0;

// ── 1. Fix Advanced Settings in index.html ──────────────────────────
let html = fs.readFileSync('index.html', 'utf8');
const s1 = 'S.settings.showAllThemes=Array.isArray(v.showAllThemes);';
const n1 = 'S.settings.showAllThemes=(v.showAllThemes&&v.showAllThemes.length>0);';
if (html.includes(s1)) { html = html.replace(s1, n1); changed++; }

const s2 = 'S.settings.flashcardMode=Array.isArray(v.flashcardMode);';
const n2 = 'S.settings.flashcardMode=(v.flashcardMode&&v.flashcardMode.length>0);';
if (html.includes(s2)) { html = html.replace(s2, n2); changed++; }

const s3 = 'S.settings.autoExportEvery=Array.isArray(v.autoExport)?20:0;';
const n3 = 'S.settings.autoExportEvery=(v.autoExport&&v.autoExport.length>0)?20:999999;';
if (html.includes(s3)) { html = html.replace(s3, n3); changed++; }

fs.writeFileSync('index.html', html);
console.log("✅ Fixed Advanced Settings toggles");

// ── 2. Fix Auto Unlock in sync.js ───────────────────────────────────
let sync = fs.readFileSync('sync.js', 'utf8');
if (!sync.includes('APEX SYNC AUTO-UNLOCK')) {
    sync += `
// ── APEX SYNC AUTO-UNLOCK ─────────────────────────────────────
(function() {
    if (window._apexAutoUnlock) return;
    window._apexAutoUnlock = true;
    if (window.setPassphrase) {
        const _orig = window.setPassphrase;
        window.setPassphrase = async function(pass) {
            const res = await _orig(pass);
            if (pass && window.idb) {
                try { await window.idb.set("apex-sync-key-backup", pass); } catch(e){}
            }
            return res;
        };
    }
    setTimeout(async function() {
        try {
            if (typeof S === "undefined" || !S.sync || !S.sync.enabled || !S.sync.room) return;
            if (typeof syncKey !== "undefined" && syncKey) return;
            let cached = sessionStorage.getItem("apex-sync-pass");
            if (!cached && window.idb) {
                cached = await window.idb.get("apex-sync-key-backup");
                if (cached) sessionStorage.setItem("apex-sync-pass", cached);
            }
            if (!cached) return;
            await window.setPassphrase(cached);
            if (typeof setSyncStatus === "function") setSyncStatus("synced");
            if (typeof apiGet === "function") {
                const row = await apiGet(S.sync.room);
                if (row && row.updatedAt) {
                    const remoteTs = row.updatedAt;
                    const localTs = (typeof window._apexToMs === 'function' ? Math.floor(window._apexToMs(S._lastSync) / 1000) : 0);
                    if (remoteTs > localTs && typeof pullNow === "function") {
                        await pullNow(true);
                    }
                }
            }
            if (typeof startSync === "function") startSync();
            console.log("[apex-sync-auto] unlocked from IndexedDB");
        } catch(e) {
            console.warn("[apex-sync-auto] unlock failed:", e.message);
            sessionStorage.removeItem("apex-sync-pass");
        }
    }, 1000);
})();
`;
    fs.writeFileSync('sync.js', sync);
    console.log("✅ Added Auto Unlock to sync.js");
    changed++;
}

// ── 3. Fix PWA SW Redirect in sw.js ─────────────────────────────────
let sw = fs.readFileSync('sw.js', 'utf8');
const fetchStart = "self.addEventListener('fetch', function(e){";
const bypass = "self.addEventListener('fetch', function(e){\n  if (e.request.url.includes('/landing')) return;";
if (!sw.includes("includes('/landing')")) {
    sw = sw.replace(fetchStart, bypass);
    console.log("✅ Added landing page bypass to sw.js");
    changed++;
}

// ── 4. Rebuild the bundle (Sync.js changed) ─────────────────────────
const files = ['apex-mobile.js', 'sync.js', 'exam-weightage.js', 'exam-config.js', 'apex-final.js', 'apex-a11y.js', 'apex-keys.js', 'apex-final-batch.js', 'apex-leech-topic.js', 'apex-polish.js', 'apex-tag-fix.js', 'apex-new-exam.js', 'apex-tags-final.js', 'apex-syl-focus.js', 'apex-syl-scroll.js', 'apex-scope.js', 'apex-task-rollover.js', 'apex-obsidian-link.js', 'apex-katex-fix.js', 'apex-theme-fix.js', 'apex-exam-sync.js', 'apex-focus-notes-edit.js', 'apex-scroll-preserve.js', 'apex-focus-history-edit.js'];
let code = '/* APEX BUNDLE v14 */\n\n';
for (const f of files) {
    if (fs.existsSync(f)) {
        code += `\n// ── FILE: ${f} ──\n` + fs.readFileSync(f, 'utf8') + '\n';
    }
}
fs.writeFileSync('apex-bundle.js', code);
console.log("✅ Rebuilt apex-bundle.js");

// ── 5. Bump SW Cache ────────────────────────────────────────────────
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    console.log(`✅ Bumped sw.js cache to v${nxt}`);
}
fs.writeFileSync('sw.js', sw);

if (changed === 0) {
    console.log("ℹ️ No missing features found. Everything is already patched.");
}