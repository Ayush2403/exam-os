const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

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
  
  // Fallback to Weak Radar if no section scores exist
  let sug = mockSuggestedTopics(m);
  if (!sug || !sug.length) {
      sug = weakTopics(3).map(w => w.t); 
  }

  const subh=weakest?'<div class="sub-h">'+esc(m.title)+' · Weakest: <b style="color:var(--pri-critical-fg)">'+esc(weakest.label)+'</b> ('+sec[weakest.key]+'%)</div>':'<div class="sub-h">'+esc(m.title)+'</div>';

  const getWeak = () => (m.weak || []);
  let selectedTopicId = null;

  function renderQTopics() {
    const tagged = getWeak();
    if (!tagged.length) return '<div class="tiny" data-debrief-qtopics-empty style="color:var(--text-3)">Tag a topic above to link this mistake.</div>';
    
    // Auto-select the first one if none is selected
    if (!selectedTopicId && tagged.length > 0) selectedTopicId = tagged[0];

    return tagged.map(id => {
      const t = topicById(id);
      if (!t) return '';
      const on = selectedTopicId === id;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-debrief-qpick="' + id + '" style="padding:6px 11px;min-height:32px;font-size:12px">' + esc(t.topic) + '</button>';
    }).join('');
  }

  const body = subh
    + '<div style="margin-bottom:16px">'
    +   '<div class="tiny" style="font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;color:var(--accent-2)">Step 1 · Tag weak topics</div>'
    +   '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" data-debrief-tags>' 
    +     sug.map(t => '<button type="button" class="chip' + (getWeak().includes(t.id) ? ' on' : '') + '" data-debrief-tag="' + t.id + '" style="padding:6px 11px;min-height:32px;font-size:12px">' + (getWeak().includes(t.id) ? '✓ ' : '+ ') + esc(t.topic) + '</button>').join('') 
    +   '</div>'
    +   '<input class="inp" data-debrief-search placeholder="Search any topic to add…" autocomplete="off" style="min-height:38px;font-size:13px;background:var(--surface-2);border-color:var(--border)">'
    +   '<div data-debrief-searchlist style="margin-top:4px;max-height:180px;overflow-y:auto"></div>'
    + '</div>'
    + '<div style="margin-bottom:16px">'
    +   '<div class="tiny" style="font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;color:var(--accent-2)">Step 2 · Log a mistake</div>'
    +   '<div class="frow" style="margin-bottom:10px"><input class="inp" name="dTitle" placeholder="Question — e.g. CI vs SI" autofocus></div>'
    +   '<div class="frow" style="margin-bottom:10px"><input class="inp" name="dMyAns" placeholder="My wrong answer"></div>'
    +   '<div class="frow" style="margin-bottom:12px"><textarea class="inp" name="dWhy" rows="2" placeholder="Correct approach"></textarea></div>'
    +   '<div class="frow" style="margin-bottom:16px"><label style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:block">Linked topic (tap to select)</label>'
    +     '<div class="chips" data-debrief-qtopics style="min-height:34px">' + renderQTopics() + '</div>'
    +   '</div>'
    +   '<button class="btn primary" style="width:100%;justify-content:center;min-height:46px" data-debrief-save>Save & next</button>'
    + '</div>'
    + '<div style="padding:12px 14px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12.5px"><span style="font-weight:600;color:var(--text-2)">Mistakes logged this session</span><b data-debrief-count style="color:var(--accent-2);font-size:15px">' + S.errors.filter(e => e.mockRef === mockId).length + '</b></div>';

  openModal("Debrief — "+esc(m.title), body, () => {}, "Close");
  const sv = document.querySelector("[data-msave]");
  if (sv) sv.style.display = "none";

  const modal = document.querySelector("#modal-root");
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    // 1. Tag logic
    const tagBtn = e.target.closest("[data-debrief-tag]");
    if (tagBtn) {
      const id = tagBtn.dataset.debriefTag;
      if (!Array.isArray(m.weak)) m.weak = [];
      
      if (m.weak.includes(id)) {
        m.weak = m.weak.filter(x => x !== id);
        tagBtn.classList.remove('on');
        tagBtn.innerHTML = '+ ' + esc(topicById(id).topic);
      } else {
        m.weak.push(id);
        tagBtn.classList.add('on');
        tagBtn.innerHTML = '✓ ' + esc(topicById(id).topic);
      }
      
      // If we just untagged the selected topic, reset it
      if (selectedTopicId === id && !m.weak.includes(id)) selectedTopicId = null;
      
      saveLocal();
      modal.querySelector('[data-debrief-qtopics]').innerHTML = renderQTopics();
      return;
    }

    // 2. Select linked topic
    const qpickBtn = e.target.closest("[data-debrief-qpick]");
    if (qpickBtn) {
      selectedTopicId = qpickBtn.dataset.debriefQpick;
      modal.querySelector('[data-debrief-qtopics]').innerHTML = renderQTopics();
      return;
    }

    // 3. Save logic
    const saveBtn = e.target.closest("[data-debrief-save]");
    if (saveBtn) {
      const title = modal.querySelector('[name="dTitle"]').value.trim();
      const myAnswer = modal.querySelector('[name="dMyAns"]').value.trim();
      const whyWrong = modal.querySelector('[name="dWhy"]').value.trim();
      
      if (!title) { toast("Question required"); return; }
      if (!selectedTopicId) { toast("Please tag and select a linked topic"); return; }
      
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
        topicId: selectedTopicId,
        examTag: typeof getActiveExamTag === 'function' ? getActiveExamTag() : '',
        interval: 0, ease: 2.5, nextReview: todayISO(), stage: "1st Time Study", history: []
      });
      saveLocal();
      
      // Reset form
      modal.querySelector('[name="dTitle"]').value = '';
      modal.querySelector('[name="dMyAns"]').value = '';
      modal.querySelector('[name="dWhy"]').value = '';
      modal.querySelector('[data-debrief-count]').textContent = S.errors.filter(e => e.mockRef === mockId).length;
      
      toast("Mistake logged", "Ready for the next one");
      return;
    }
  });

  // 4. Search logic
  const searchEl = modal.querySelector("[data-debrief-search]");
  const searchList = modal.querySelector("[data-debrief-searchlist]");
  searchEl.addEventListener("input", () => {
    const q = searchEl.value.toLowerCase().trim();
    if (!q) { searchList.innerHTML = ""; return; }
    const tagged = new Set(getWeak());
    const hits = S.syllabus.filter(t => !tagged.has(t.id) && (t.topic.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))).slice(0, 8);
    if (!hits.length) { searchList.innerHTML = '<div class="tiny" style="padding:8px;color:var(--text-3)">No match</div>'; return; }
    searchList.innerHTML = hits.map(t => '<div data-debrief-add="' + t.id + '" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:12.5px;background:var(--surface-3);margin-bottom:4px;border:1px solid var(--border)"><span style="flex:1">' + esc(t.topic) + '</span><span class="tiny">' + esc(t.subject) + '</span></div>').join('');
  });
  
  searchList.addEventListener("click", (e) => {
    const row = e.target.closest("[data-debrief-add]");
    if (!row) return;
    const id = row.dataset.debriefAdd;
    if (!Array.isArray(m.weak)) m.weak = [];
    if (!m.weak.includes(id)) m.weak.push(id);
    saveLocal();
    
    searchEl.value = "";
    searchList.innerHTML = "";
    modal.querySelector('[data-debrief-qtopics]').innerHTML = renderQTopics();
    
    const t = topicById(id);
    if (t && modal.querySelector('[data-debrief-tags]')) {
       const tagsBox = modal.querySelector('[data-debrief-tags]');
       if (!tagsBox.querySelector('[data-debrief-tag="'+id+'"]')) {
           tagsBox.insertAdjacentHTML('beforeend', '<button type="button" class="chip on" data-debrief-tag="' + id + '" style="padding:6px 11px;min-height:32px;font-size:12px">✓ ' + esc(t.topic) + '</button>');
       }
    }
  });
}

`;
    html = html.substring(0, start) + newDebrief + html.substring(end);
    
    fs.writeFileSync('index.html', html);
    console.log('✅ Rebuilt Debrief modal with premium UI and smart fallbacks');
    
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
    console.log('❌ Could not find the debriefModal boundaries.');
}