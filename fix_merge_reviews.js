const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

function replaceBetween(text, startStr, endStr, newContent) {
    const start = text.indexOf(startStr);
    if (start === -1) return [text, false];
    const end = text.indexOf(endStr, start);
    if (end === -1) return [text, false];
    return [text.substring(0, start) + newContent + text.substring(end), true];
}

let changed = 0;

// 1. Update the counts to include Errors
const newRtabCount = `function rtabCount(k){
  if(k==="today")return dueSessions().length+dueErrors().length;
  if(k==="upcoming")return S.sessions.filter(s=>{const r=reviewState(s);return r.st==="future"&&r.days<=7;}).length + S.errors.filter(e=>{const r=reviewState(e);return r.st==="future"&&r.days<=7;}).length;
  if(k==="mastered")return S.sessions.filter(s=>s.stage==="Mastered").length;
  return S.sessions.length + S.errors.length;
}
`;
let res = replaceBetween(html, 'function rtabCount(k){', 'function renderTabs(){', newRtabCount);
html = res[0]; if(res[1]) changed++;

// 2. Change the label from "All Sessions" to "All Reviews"
const newRenderTabs = `function renderTabs(){
  const el=$("#rtabs");
  if(!el)return;
  el.innerHTML=[["all","All Reviews"],["today","Today"],["upcoming","Upcoming 7d"],["mastered","Mastered"]].map(p=>'<button class="page-tab'+(rtab===p[0]?" on":"")+'" data-rtab="'+p[0]+'">'+p[1]+' ('+rtabCount(p[0])+')</button>').join("");
}
`;
res = replaceBetween(html, 'function renderTabs(){', 'function renderSessList(){', newRenderTabs);
html = res[0]; if(res[1]) changed++;

// 3. Merge the lists in the actual rendering function
const newRenderSessList = `function renderSessList(){
  const el=$("#sess-list");
  if(!el)return;
  let html="";
  if(rtab==="today"){
    const due=dueSessions();const dueErr=dueErrors();const combined=[];
    dueErr.forEach(e=>combined.push({kind:"error",item:e,r:reviewState(e)}));
    due.forEach(s=>combined.push({kind:"session",item:s,r:reviewState(s)}));
    combined.sort((a,b)=>{const da=a.r.st==="overdue"?-a.r.days-1000:(a.r.st==="new"?-500:0);const db=b.r.st==="overdue"?-b.r.days-1000:(b.r.st==="new"?-500:0);return da-db;});
    html=combined.length?combined.map(u=>u.kind==="error"?errorCard(u.item):sessCard(u.item)).join(""):'<div class="empty"><div class="ic">'+emptyArt("check")+'</div><b>All clear</b><p>Nothing due today.</p></div>';
  }else if(rtab==="upcoming"){
    const upSess=S.sessions.filter(s=>{const r=reviewState(s);return r.st==="future"&&r.days<=7;});
    const upErr=S.errors.filter(e=>{const r=reviewState(e);return r.st==="future"&&r.days<=7;});
    const up=[...upSess, ...upErr].sort((a,b)=>{const x=reviewState(a).nr,y=reviewState(b).nr;return x<y?-1:1;});
    if(!up.length)html='<div class="empty"><div class="ic">'+emptyArt("cal")+'</div><b>Nothing this week</b></div>';
    else{
      let cur="";
      html=up.map(item=>{
        const nr=reviewState(item).nr;let head="";
        if(nr!==cur){cur=nr;head='<div class="date-grp"><div class="date-grp-h">'+fmtD(nr)+' · '+relD(nr)+'</div></div>';}
        return head+(item.hasOwnProperty('title')?errorCard(item):sessCard(item));
      }).join("");
    }
  }else if(rtab==="mastered"){
    const m=S.sessions.filter(s=>s.stage==="Mastered");
    html=m.length?m.map(sessCard).join(""):'<div class="empty"><div class="ic">'+emptyArt("check")+'</div><b>Nothing mastered yet</b></div>';
  }else{
    const allItems=[...S.sessions, ...S.errors].sort((a,b)=>{
      const ra=reviewState(a),rb=reviewState(b);
      if(!ra.nr)return 1;if(!rb.nr)return-1;
      return ra.nr<rb.nr?-1:1;
    });
    html=allItems.length?allItems.map(item=>item.hasOwnProperty('title')?errorCard(item):sessCard(item)).join(""):'<div class="empty"><div class="ic">'+emptyArt("book")+'</div><b>Nothing to review</b><p>Log a study session or an error to start the repetition cycle.</p></div>';
  }
  el.innerHTML=html;
}
`;
res = replaceBetween(html, 'function renderSessList(){', 'function pyqModal(', newRenderSessList);
html = res[0]; if(res[1]) changed++;

if (changed > 0) {
    fs.writeFileSync('index.html', html);
    console.log(`✅ Merged Errors into the Reviews tabs (${changed} functions updated)`);
    
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
    console.log('❌ Could not find the exact functions to replace.');
}