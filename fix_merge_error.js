const fs = require('fs');
let sync = fs.readFileSync('sync.js', 'utf8');
let changed = 0;

// 1. Show the ACTUAL error instead of the generic "unreadable" message
const oldCatch = `} catch (e) {
          recordSyncError();
          if (!silent) toast("Merge failed", "Push aborted — cloud copy unreadable");
          return;
        }`;
const newCatch = `} catch (e) {
          recordSyncError();
          if (!silent) toast("Merge failed", "Error: " + e.message);
          console.error("[apex sync] merge error:", e);
          return;
        }`;

if (sync.includes(oldCatch)) {
    sync = sync.replace(oldCatch, newCatch);
    changed++;
    console.log("✅ Updated error reporting");
}

// 2. Add a safety check in case mergeForSync is missing
const oldMerge = `S = mergeForSync(S, remoteState);`;
const newMerge = `if (typeof mergeForSync === 'function') {
          S = mergeForSync(S, remoteState);
        } else {
          console.warn("[apex sync] mergeForSync is missing.");
          if (!silent) toast("Merge failed", "mergeForSync function is missing");
          return;
        }`;

if (sync.includes(oldMerge)) {
    sync = sync.replace(oldMerge, newMerge);
    changed++;
    console.log("✅ Added safety check for mergeForSync");
}

if (changed > 0) {
    fs.writeFileSync('sync.js', sync);
    
    // Bump SW
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