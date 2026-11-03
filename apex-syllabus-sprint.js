/* ============================================================
   APEX SYLLABUS SPRINT
   Calculates daily pace and lets you queue topics instantly.
   ============================================================ */
(function(){
  if (window._apexSprint) return;
  window._apexSprint = true;

  function injectSprintButton() {
    const view = document.getElementById('view');
    if (!view) return;
    
    // Only on Dashboard
    if (location.hash && !location.hash.includes('dashboard')) return;
    
    const heroHead = view.querySelector('.hero-head');
    if (!heroHead) return;
    if (heroHead.querySelector('[data-action="open-sprint"]')) return;

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.setAttribute('data-action', 'open-sprint');
    btn.style.cssText = 'margin-left:6px';
    btn.innerHTML = '🚀 Sprint';
    btn.onclick = openSprintModal;
    
    heroHead.appendChild(btn);
  }

  function openSprintModal() {
    const examTag = typeof window.getActiveExamTag === 'function' ? window.getActiveExamTag() : '';
    if (!examTag) { toast("No active exam selected"); return; }

    const targets = (S.settings.exams || []).filter(x => x.examTag === examTag && diffD(x.date, todayISO()) >= 0);
    if (!targets.length) { toast("No future target for " + examTag); return; }

    const target = targets.sort((a,b) => diffD(a.date, todayISO()) - diffD(b.date, todayISO()))[0];
    const daysLeft = diffD(target.date, todayISO());
    
    // Filter relevant topics
    const scoped = S.syllabus.filter(t => !t.archived && (typeof _tagMatchesTopic === 'function' ? _tagMatchesTopic(t, examTag) : true));
    
    // Filter out parents/containers (only leaf topics)
    const leaves = scoped.filter(t => !hasKids(t.id));
    
    const remaining = leaves.filter(t => t.status !== "Mastered" && t.status !== "Reviewing");
    const remainingCount = remaining.length;
    const totalCount = leaves.length;
    
    if (remainingCount === 0) {
      openModal("Syllabus Sprint", '<div class="empty" style="padding:24px"><b>You are done!</b><p>Every topic for ' + esc(examTag) + ' is Mastered or Reviewing.</p></div>', ()=>{}, "Close");
      return;
    }

    const paceNeeded = Math.ceil(remainingCount / daysLeft);
    
    // Sort remaining by computed priority (highest first)
    const sorted = remaining.map(t => {
      let score = 0;
      if (typeof window.computeTopicPriority === 'function') {
        score = window.computeTopicPriority(t, examTag);
      }
      return { t, score };
    }).sort((a,b) => b.score - a.score).map(x => x.t);

    // Top 8 topics
    const top = sorted.slice(0, 8);
    
    const rows = top.map((t, i) => {
      const isSelected = i < Math.min(3, paceNeeded);
      return `
        <label style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;${isSelected ? 'background:rgba(167,139,250,.08)' : ''}">
          <input type="checkbox" name="sprint_topics" value="${t.id}" ${isSelected ? 'checked' : ''} style="accent-color:var(--accent);width:16px;height:16px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.topic)}</div>
            <div class="tiny">${esc(t.subject)} · ${t.status}</div>
          </div>
          <div class="pill" style="font-size:9.5px">Score: ${top.find(x=>x.id===t.id)?.score || 0}</div>
        </label>
      `;
    }).join("");

    const body = `
      <div class="sub-h">${esc(target.label)} · D-${daysLeft}</div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
        <div class="detail-block" style="text-align:center;margin:0;padding:14px">
          <div class="tiny">Remaining</div>
          <div style="font-size:24px;font-weight:700;color:var(--text)">${remainingCount}</div>
        </div>
        <div class="detail-block" style="text-align:center;margin:0;padding:14px">
          <div class="tiny">Pace Needed</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent-2)">${paceNeeded}/day</div>
        </div>
      </div>

      <div style="font:700 10px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">
        Highest leverage topics to start now
      </div>
      
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;max-height:320px;overflow-y:auto">
        ${rows}
      </div>
    `;

    openModal("Syllabus Sprint", body, function(v) {
      const selectedIds = Array.isArray(v.sprint_topics) ? v.sprint_topics : (v.sprint_topics ? [v.sprint_topics] : []);
      if (!selectedIds.length) { toast("Select at least one topic"); return false; }
      
      snapshot();
      let added = 0;
      
      selectedIds.forEach(id => {
        const t = S.syllabus.find(x => x.id === id);
        if (!t) return;
        
        // Prevent duplicate tasks for the same topic today
        const exists = S.tasks.find(k => k.title === "Study: " + t.topic && k.due === todayISO());
        if (!exists) {
          S.tasks.push({
            id: uid("k"),
            title: "Study: " + t.topic,
            status: "Next Up",
            due: todayISO(),
            priority: t.priority === "Critical" ? "High 🔥" : "Medium",
            tbS: "", tbE: "", progress: ""
          });
          added++;
        }
      });
      
      saveLocal();
      rerender();
      toast("Added " + added + " topic(s) to Today's Plan");
    }, "Add to Plan");
  }

  if (typeof ACTIONS === 'object') {
    ACTIONS['open-sprint'] = openSprintModal;
  }

  const view = document.getElementById('view');
  if (view) {
    new MutationObserver(injectSprintButton).observe(view, { childList: true, subtree: false });
  }
  setTimeout(injectSprintButton, 600);
  
  console.log('[apex-syllabus-sprint] installed');
})();