const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// 1. Hook into gradeReview
const oldGradeReview = `const oldInterval=typeof s.interval==="number"?s.interval:0;const ease=typeof s.ease==="number"?s.ease:2.5;`;
const newGradeReview = `const oldInterval=typeof s.interval==="number"?s.interval:0;const ease=typeof s.ease==="number"?s.ease:2.5;
  let fsrsResult = null;
  if (typeof window.fsrsCalculate === 'function') {
    fsrsResult = window.fsrsCalculate(s, grade);
    s.fsrs_stability = fsrsResult.stability;
    s.fsrs_difficulty = fsrsResult.difficulty;
  }`;

if (html.includes(oldGradeReview) && !html.includes('window.fsrsCalculate(s, grade)')) {
    html = html.replace(oldGradeReview, newGradeReview);
    changed++;
    console.log("✅ Hooked FSRS into gradeReview");
}

// 2. Force gradeReview to use the FSRS interval instead of the default SM-2 multiplier
const oldIntervalLogic = `if(grade==="again"){newInterval=1;newEase=Math.max(1.3,ease-0.2);}
  else if(grade==="hard"){newInterval=Math.max(1,Math.round(oldInterval*1.2));newEase=Math.max(1.3,ease-0.15);}
  else if(grade==="good"){newInterval=oldInterval===0?1:Math.max(2,Math.round(oldInterval*ease));newEase=Math.min(3.0,ease+0.05);}
  else{newInterval=oldInterval===0?4:Math.max(4,Math.round(oldInterval*ease*1.3));newEase=Math.min(3.0,ease+0.1);}`;

const newIntervalLogic = `if (fsrsResult) {
    newInterval = fsrsResult.interval;
  } else {
    if(grade==="again"){newInterval=1;newEase=Math.max(1.3,ease-0.2);}
    else if(grade==="hard"){newInterval=Math.max(1,Math.round(oldInterval*1.2));newEase=Math.max(1.3,ease-0.15);}
    else if(grade==="good"){newInterval=oldInterval===0?1:Math.max(2,Math.round(oldInterval*ease));newEase=Math.min(3.0,ease+0.05);}
    else{newInterval=oldInterval===0?4:Math.max(4,Math.round(oldInterval*ease*1.3));newEase=Math.min(3.0,ease+0.1);}
  }`;

if (html.includes(oldIntervalLogic)) {
    html = html.replace(oldIntervalLogic, newIntervalLogic);
    changed++;
    console.log("✅ Swapped SM-2 interval logic for FSRS interval logic");
} else {
    console.log("⚠️ Could not find SM-2 interval logic. It might be formatted differently.");
}

// 3. Hook into gradeError
const oldGradeError = `const oldInterval=typeof e.interval==="number"?e.interval:0;const ease=typeof e.ease==="number"?e.ease:2.5;`;
const newGradeError = `const oldInterval=typeof e.interval==="number"?e.interval:0;const ease=typeof e.ease==="number"?e.ease:2.5;
  let fsrsResult = null;
  if (typeof window.fsrsCalculate === 'function') {
    fsrsResult = window.fsrsCalculate(e, grade);
    e.fsrs_stability = fsrsResult.stability;
    e.fsrs_difficulty = fsrsResult.difficulty;
  }`;

if (html.includes(oldGradeError) && !html.includes('window.fsrsCalculate(e, grade)')) {
    html = html.replace(oldGradeError, newGradeError);
    changed++;
    console.log("✅ Hooked FSRS into gradeError");
}

const oldErrIntervalLogic = `if(grade==="again"){newInterval=1;newEase=Math.max(1.3,ease-0.2);}
  else if(grade==="hard"){newInterval=Math.max(1,Math.round(oldInterval*1.2));newEase=Math.max(1.3,ease-0.15);}
  else if(grade==="good"){newInterval=oldInterval===0?1:Math.max(2,Math.round(oldInterval*ease));newEase=Math.min(3.0,ease+0.05);}
  else{newInterval=oldInterval===0?4:Math.max(4,Math.round(oldInterval*ease*1.3));newEase=Math.min(3.0,ease+0.1);}`;

const newErrIntervalLogic = `if (fsrsResult) {
    newInterval = fsrsResult.interval;
  } else {
    if(grade==="again"){newInterval=1;newEase=Math.max(1.3,ease-0.2);}
    else if(grade==="hard"){newInterval=Math.max(1,Math.round(oldInterval*1.2));newEase=Math.max(1.3,ease-0.15);}
    else if(grade==="good"){newInterval=oldInterval===0?1:Math.max(2,Math.round(oldInterval*ease));newEase=Math.min(3.0,ease+0.05);}
    else{newInterval=oldInterval===0?4:Math.max(4,Math.round(oldInterval*ease*1.3));newEase=Math.min(3.0,ease+0.1);}
  }`;

// Note: The string might be identical, so if it fails on Errors, we will catch it in the logic.
if (html.includes(newErrIntervalLogic)) {
    console.log("[skip] Error interval logic already patched");
} else if (html.includes(oldErrIntervalLogic)) {
    // If the first replace already handled it, this string might be gone. 
    // We'll do a regex fallback just in case.
    html = html.replace(/if\(grade==="again"\)\{newInterval=1;newEase=Math\.max\(1\.3,ease-0\.2\);\}\s*else if\(grade==="hard"\)\{newInterval=Math\.max\(1,Math\.round\(oldInterval\*1\.2\)\);newEase=Math\.max\(1\.3,ease-0\.15\);\}\s*else if\(grade==="good"\)\{newInterval=oldInterval===0\?1:Math\.max\(2,Math\.round\(oldInterval\*ease\)\);newEase=Math\.min\(3\.0,ease\+0\.05\);\}\s*else\{newInterval=oldInterval===0\?4:Math\.max\(4,Math\.round\(oldInterval\*ease\*1\.3\)\);newEase=Math\.min\(3\.0,ease\+0\.1\);\}/g, newErrIntervalLogic);
    console.log("✅ Swapped SM-2 interval logic for FSRS interval logic (Errors)");
}

fs.writeFileSync('index.html', html);

// 4. Rebuild the bundle to include apex-fsrs.js
const files = ['apex-mobile.js', 'apex-sync-merge.js', 'sync.js', 'exam-weightage.js', 'exam-config.js', 'apex-fsrs.js', 'apex-final.js', 'apex-a11y.js', 'apex-keys.js', 'apex-final-batch.js', 'apex-leech-topic.js', 'apex-polish.js', 'apex-tag-fix.js', 'apex-new-exam.js', 'apex-tags-final.js', 'apex-syl-focus.js', 'apex-syl-scroll.js', 'apex-scope.js', 'apex-task-rollover.js', 'apex-obsidian-link.js', 'apex-katex-fix.js', 'apex-theme-fix.js', 'apex-exam-sync.js', 'apex-focus-notes-edit.js', 'apex-scroll-preserve.js', 'apex-focus-history-edit.js', 'apex-title-expand.js'];

let code = '/* APEX BUNDLE v20 (FSRS) */\n\n';
for (const f of files) {
    if (fs.existsSync(f)) {
        code += `\n// ── FILE: ${f} ──\n` + fs.readFileSync(f, 'utf8') + '\n';
    }
}
fs.writeFileSync('apex-bundle.js', code);
console.log("✅ Rebuilt apex-bundle.js with FSRS");

// 5. Bump Service Worker
let sw = fs.readFileSync('sw.js', 'utf8');
const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
if (m) {
    const cur = parseInt(m[1], 10);
    const nxt = cur + 1;
    sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js to v${nxt}`);
}