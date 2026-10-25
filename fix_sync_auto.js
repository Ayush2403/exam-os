const fs = require('fs');
let sync = fs.readFileSync('sync.js', 'utf8');

const autoUnlockCode = `
// ── APEX SYNC AUTO-UNLOCK ─────────────────────────────────────
(function() {
    if (window._apexAutoUnlock) return;
    window._apexAutoUnlock = true;

    // 1. Patch setPassphrase to automatically save to IndexedDB
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

    // 2. Auto-unlock on page load
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

if (!sync.includes('APEX SYNC AUTO-UNLOCK')) {
    sync += autoUnlockCode;
    fs.writeFileSync('sync.js', sync);
    console.log('✅ Added permanent auto-unlock to sync.js');
}

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