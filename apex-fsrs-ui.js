const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// 1. Update the Review Card to show "Stability" instead of "Ease"
const oldEase = `<div class="fld"><label>Ease</label><b style="font-size:13px;padding-top:10px;display:inline-block">'+easeTxt+'</b></div>`;
const newEase = `<div class="fld"><label>Stability</label><b style="font-size:13px;padding-top:10px;display:inline-block">'+(typeof s.fsrs_stability === 'number' ? s.fsrs_stability.toFixed(1)+'d' : '—')+'</b></div>`;

if (html.includes(oldEase)) {
    html = html.replace(oldEase, newEase);
    changed++;
    console.log("✅ Replaced 'Ease' with 'Stability' in Review Cards");
} else {
    console.log("⚠️ Could not find Ease label.");
}

// 2. Update Grade Buttons to show predicted intervals (The Anki Feature)
// We intercept the gradeRowHTML function to calculate FSRS predictions
const oldGradeRow = `function gradeRowHTML(id,action){action=action||"grade-review";return'<div class="grade-row"><button class="grade-btn again" data-action="'+action+'" data-id="'+id+'" data-grade="again">Again</button><button class="grade-btn hard" data-action="'+action+'" data-id="'+id+'" data-grade="hard">Hard</button><button class="grade-btn good" data-action="'+action+'" data-id="'+id+'" data-grade="good">Good</button><button class="grade-btn easy" data-action="'+action+'" data-id="'+id+'" data-grade="easy">Easy</button></div>';}`;

const newGradeRow = `function gradeRowHTML(id,action){
  action=action||"grade-review";
  let s = S.sessions.find(x=>x.id===id) || S.errors.find(x=>x.id===id);
  let a="Again", h="Hard", g="Good", e="Easy";
  if (s && typeof window.fsrsCalculate === 'function') {
    try {
      const predA = window.fsrsCalculate(s, 'again');
      const predH = window.fsrsCalculate(s, 'hard');
      const predG = window.fsrsCalculate(s, 'good');
      const predE = window.fsrsCalculate(s, 'easy');
      a += ' <span style="opacity:.6;font-size:10px">('+predA.interval+'d)</span>';
      h += ' <span style="opacity:.6;font-size:10px">('+predH.interval+'d)</span>';
      g += ' <span style="opacity:.6;font-size:10px">('+predG.interval+'d)</span>';
      e += ' <span style="opacity:.6;font-size:10px">('+predE.interval+'d)</span>';
    } catch(err){}
  }
  return '<div class="grade-row"><button class="grade-btn again" data-action="'+action+'" data-id="'+id+'" data-grade="again">'+a+'</button><button class="grade-btn hard" data-action="'+action+'" data-id="'+id+'" data-grade="hard">'+h+'</button><button class="grade-btn good" data-action="'+action+'" data-id="'+id+'" data-grade="good">'+g+'</button><button class="grade-btn easy" data-action="'+action+'" data-id="'+id+'" data-grade="easy">'+e+'</button></div>';
}`;

if (html.includes(oldGradeRow)) {
    html = html.replace(oldGradeRow, newGradeRow);
    changed++;
    console.log("✅ Added predicted intervals to Grade Buttons");
} else {
    console.log("⚠️ Could not find exact gradeRowHTML string.");
}

if (changed > 0) {
    fs.writeFileSync('index.html', html);
    
    // Bump SW to force refresh
    let sw = fs.readFileSync('sw.js', 'utf8');
    const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
    if (m) {
        const cur = parseInt(m[1], 10);
        const nxt = cur + 1;
        sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
        fs.writeFileSync('sw.js', sw);
        console.log(`✅ Bumped sw.js to v${nxt}`);
    }
}