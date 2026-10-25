const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const missingFn = `function postReviews(){renderTabs();renderSessList();const el=$("#rtabs");if(el)el.addEventListener("click",e=>{const b=e.target.closest("[data-rtab]");if(!b)return;rtab=b.dataset.rtab;renderTabs();renderSessList();});}\n`;

if (!html.includes('function postReviews(')) {
    const anchor = 'function pyqModal(';
    if (html.includes(anchor)) {
        html = html.replace(anchor, missingFn + '\n' + anchor);
        fs.writeFileSync('index.html', html);
        console.log('✅ Restored missing postReviews function');
        
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
    } else {
        console.log('❌ Could not find pyqModal anchor to insert function');
    }
} else {
    console.log('ℹ️ postReviews already exists in the file');
}