const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// ── 1. Fix Advanced Settings Unchecking ─────────────────────────────
const old1 = 'S.settings.showAllThemes=Array.isArray(v.showAllThemes);';
const new1 = 'S.settings.showAllThemes=(v.showAllThemes&&v.showAllThemes.length>0);';
if (html.includes(old1)) { html = html.replace(old1, new1); changed++; }

const old2 = 'S.settings.flashcardMode=Array.isArray(v.flashcardMode);';
const new2 = 'S.settings.flashcardMode=(v.flashcardMode&&v.flashcardMode.length>0);';
if (html.includes(old2)) { html = html.replace(old2, new2); changed++; }

const old3 = 'S.settings.autoExportEvery=Array.isArray(v.autoExport)?20:0;';
const new3 = 'S.settings.autoExportEvery=(v.autoExport&&v.autoExport.length>0)?20:999999;';
if (html.includes(old3)) { html = html.replace(old3, new3); changed++; }

// Fallback if spacing was slightly different
if (!html.includes('showAllThemes=(v.showAllThemes')) {
    const old1b = 'S.settings.showAllThemes = Array.isArray(v.showAllThemes);';
    const new1b = 'S.settings.showAllThemes = (v.showAllThemes && v.showAllThemes.length > 0);';
    if (html.includes(old1b)) { html = html.replace(old1b, new1b); changed++; }

    const old2b = 'S.settings.flashcardMode = Array.isArray(v.flashcardMode);';
    const new2b = 'S.settings.flashcardMode = (v.flashcardMode && v.flashcardMode.length > 0);';
    if (html.includes(old2b)) { html = html.replace(old2b, new2b); changed++; }

    const old3b = 'S.settings.autoExportEvery = Array.isArray(v.autoExport) ? 20 : 0;';
    const new3b = 'S.settings.autoExportEvery = (v.autoExport && v.autoExport.length > 0) ? 20 : 999999;';
    if (html.includes(old3b)) { html = html.replace(old3b, new3b); changed++; }
}

// ── 2. Fix Syllabus Tag Truncation ──────────────────────────────────
const oldTags = `const examTags=t=>t.exams.map(e=>'<span class="exam-tag">'+esc(e==="RBI GRADE B"?"RBI":e)+'</span>').join("");`;
const newTags = `const examTags=function(t){
  if(!Array.isArray(t.exams) || t.exams.length === 0) return "";
  const activeExam = (typeof getActiveExam === "function") ? getActiveExam() : null;
  const priMap = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
  const sortedExams = [...t.exams].sort((a, b) => {
    if (a === activeExam) return -1;
    if (b === activeExam) return 1;
    const priA = t.examConfig && t.examConfig[a] ? t.examConfig[a].priority : null;
    const priB = t.examConfig && t.examConfig[b] ? t.examConfig[b].priority : null;
    const valA = priMap[priA] || 0;
    const valB = priMap[priB] || 0;
    if (valA !== valB) return valB - valA;
    const getDays = (examTag) => {
      if (!S.settings || !Array.isArray(S.settings.exams)) return 9999;
      const target = S.settings.exams.find(x => x.examTag === examTag && x.date);
      if (!target) return 9999;
      const diff = diffD(target.date, todayISO());
      return diff >= 0 ? diff : 9999;
    };
    const daysA = getDays(a);
    const daysB = getDays(b);
    if (daysA !== daysB) return daysA - daysB;
    return t.exams.indexOf(a) - t.exams.indexOf(b);
  });
  const max = 4;
  const shown = sortedExams.slice(0, max);
  const hidden = sortedExams.length - max;
  let html = shown.map(e=>{
    const isActive = e === activeExam;
    const style = isActive ? 'style="border-color:var(--accent-2);color:var(--text)"' : '';
    return '<span class="exam-tag" '+style+'>'+esc(e==="RBI GRADE B"?"RBI":e==="NABARD GRADE A"?"NABARD":e)+'</span>';
  }).join("");
  if (hidden > 0) {
    html += '<span class="exam-tag" style="opacity:.7;background:var(--surface-3);border-color:var(--border-2)" title="'+sortedExams.join(', ')+'">+' + hidden + '</span>';
  }
  return html;
};`;

if (html.includes(oldTags)) {
    html = html.replace(oldTags, newTags);
    changed++;
    console.log('✅ Applied syllabus tag truncation');
} else {
    console.log('ℹ️ Could not find exact examTags string. It might already be fixed.');
}

// ── 3. Bump Version ─────────────────────────────────────────────────
const oldVer = 'const APP_VERSION="v22.0.0";';
const newVer = 'const APP_VERSION="v23.0.0";';
if (html.includes(oldVer)) {
    html = html.replace(oldVer, newVer);
    changed++;
    console.log('✅ Bumped version to v23.0.0');
}

// Save and Bump SW
if (changed > 0) {
  fs.writeFileSync('index.html', html);
  let sw = fs.readFileSync('sw.js', 'utf8');
  const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
  if (m) {
      const cur = parseInt(m[1], 10);
      const nxt = cur + 1;
      sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
      fs.writeFileSync('sw.js', sw);
      console.log(`✅ Bumped sw.js cache to v${nxt}`);
  }
  console.log(`Done. Made ${changed} changes.`);
} else {
  console.log('ℹ️ No changes needed.');
}