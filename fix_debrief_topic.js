const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

const startStr = 'function debriefModal(mockId){';
const start = html.indexOf(startStr);
const endStr = 'function bulkErrorModal(';
const end = html.indexOf(endStr, start);

if (start > -1 && end > -1) {
    const newDebrief = `function debriefModal(mockId){
  const m=S.mocks.find(x=>x.id===mockId);
  if(!m)return;
  const set=getMockSectionSet(m);
  const sec=m.sections||{};
  const filled=set.sections.filter(s=>typeof sec[s.key]==="number");
  const weakest=filled.length?filled.slice().sort((a,b)=>sec[a.key]-sec[b.key])[0]:null;

  const subh=weakest?'<div class="sub-h">'+esc(m.title)+' · Weakest: <b style="color:var(--pri-critical-fg)">'+esc(weakest.label)+'</b> ('+sec[weakest.key]+'%)</div>':'<div class="sub-h">'+esc(m.title)+'</div>';

  const body = subh
    + '<div class="detail-block" style="background:var(--surface-2)">'
    +   '<div class="tiny" style="font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">Log a mistake</div>'
    +   '<div class="frow" style="margin-bottom:8px"><input class="inp" name="dTitle" placeholder="Question — e.g. CI vs SI" autofocus></div>'
    +   '<div class="frow" style="margin-bottom:8px"><input class="inp" name="dMyAns" placeholder="My wrong answer"></div>'
    +   '<div class="frow" style="margin-bottom:12px"><textarea class="inp" name="dWhy" rows="2" placeholder="Correct approach"></textarea></div>'
    +   '<div class="frow" style="margin-bottom:16px"><label>Linked topic</label>' + pickerHTML("dTopicIds", [], false) + '</div>'
    +   '<button class="btn primary" style="width:100%" data-debrief-save>Save Mistake</button>'
    + '</div>';

  openModal("Debrief — "+esc(m.title), body, () => {}, "Close");
  const sv = document.querySelector("[data-msave]");
  if (sv) sv.style.display = "none";

  const modal = document.querySelector("#modal-root");
  if (modal) {
    modal.querySelectorAll('.tpick').forEach(wirePicker);
    
    modal.addEventListener("click", (e) => {
      const saveBtn = e.target.closest("[data-debrief-save]");
      if (saveBtn) {
        const title = modal.querySelector('[name="dTitle"]').value.trim();
        const myAnswer = modal.querySelector('[name="dMyAns"]').value.trim();
        const whyWrong = modal.querySelector('[name="dWhy"]').value.trim();
        const topicIds = pickVals(modal.querySelector('[name="dTopicIds"]').value);
        
        if (!title) { toast("Question required"); return; }
        
        snapshot();
        S.errors.push({
          id: uid("e"),
          title: title,
          myAnswer: myAnswer,
          whyWrong: whyWrong,
          type: "",
          source: m.title,
          mockRef: m.id,
          date: todayISO(),
          link: "",
          topicId: topicIds[0] || null,
          examTag: typeof getActiveExamTag === 'function' ? getActiveExamTag() : '',
          interval: 0, ease: 2.5, nextReview: todayISO(), stage: "1st Time Study", history: []
        });
        saveLocal();
        toast("Mistake logged");
        closeModal();
        rerender();
      }
    });
  }
}

`;
    html = html.substring(0, start) + newDebrief + html.substring(end);
    changed++;
    console.log('✅ Restored the standard topic picker to the Debrief modal');
} else {
    console.log('❌ Could not find the debriefModal boundaries.');
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
        console.log(`✅ Bumped sw.js cache to v${nxt}`);
    }
}