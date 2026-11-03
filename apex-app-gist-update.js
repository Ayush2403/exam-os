/* ============================================================
   APEX APP GIST UPDATE (Guide, Welcome, Tooltips)
   ============================================================ */
(function(){
  if (window._apexGistUpdate) return;
  window._apexGistUpdate = true;

  // 1. Update Navigation Tooltips
  if (window.NAV_INFO) {
    NAV_INFO.dashboard = "Your daily command center. Computes the 'Next Action' based on FSRS memory stability and Exam Marks at Risk.";
    NAV_INFO.reviews = "FSRS-powered Spaced Repetition. Rate Again/Hard/Good/Easy to calculate exact memory stability and optimal intervals.";
    NAV_INFO.radar = "Weak topics ranked by friction × exam weightage. Shows exactly how many marks a topic is costing you.";
    NAV_INFO.mocks = "Log mocks with section-wise scores. Instantly debrief, tag weak topics, and log mistakes to your Error Log.";
  }

  // 2. Override the Guide Tab
  const newViewGuide = function() {
    const totalTopics = S.syllabus.length;
    const totalExams = (S.settings.exams||[]).filter(x=>x.date).length;
    const step=(n,t,d)=>'<div style="display:flex;gap:14px;padding:13px 0;border-bottom:1px solid var(--border)"><div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:var(--btn-primary-fg);display:grid;place-items:center;font-size:12px;font-weight:800;flex-shrink:0;font-family:Inter,sans-serif">'+n+'</div><div><div style="font-weight:600;font-size:13.5px;margin-bottom:3px">'+t+'</div><div class="tiny" style="line-height:1.6">'+d+'</div></div></div>';
    const tab=(name,what,why)=>'<div class="detail-block" style="padding:16px"><h5 style="font-size:13px;letter-spacing:0">'+name+'</h5><div style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:8px">'+what+'</div><div class="tiny" style="line-height:1.55"><b style="color:var(--accent-2)">Why it matters:</b> '+why+'</div></div>';
    const tip=t=>'<div style="padding:11px 14px;border-left:2px solid var(--accent-2);background:var(--surface-2);border-radius:0 8px 8px 0;margin-bottom:8px"><div style="font-size:12.5px;line-height:1.6;color:var(--text-2)">'+t+'</div></div>';

    return '<div class="hero-head"><div><h2>How to use <span style="font-style:italic">Apex</span></h2><div class="sub">The whole system, explained. Read once. Reference often.</div></div><button class="btn" style="margin-left:auto" data-action="start-tour">Take the tour</button></div>'

      +'<div class="card" style="padding:24px 26px"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:-.02em;margin-bottom:8px">The one-line pitch</div><div style="font-size:14px;line-height:1.65;color:var(--text-2);max-width:680px">Apex is a <b style="color:var(--text)">closed-loop study system</b>: <b style="color:var(--text)">Study → Remember → Diagnose → Correct</b>. Every action feeds back into a single recommendation on Home. You never have to decide what to do next — the system tells you.</div></div>'

      +'<div class="card section-gap"><div class="card-h"><h2>The daily loop</h2><span class="sub">do this every day</span></div>'
        +step(1,"Open Home. Read the hero card.","That single line is your highest-leverage action right now — computed from FSRS memory stability, exam urgency, and Marks at Risk. Do it. Don't shop around.")
        +step(2,"Log every session.","Use the quick-log bar at the top of Home: type 'Percentage 45' → Enter. You can also tag a fragment: 'Percentage: successive 45'.")
        +step(3,"Rate every review honestly.","The buttons predict your next interval (e.g., Good (12d)). FSRS calculates the exact memory stability. If you had to think more than 3 seconds, it's Hard, not Good.")
        +step(4,"Log every mistake.","Mocks, PYQs, Discord doubts. Fill all three fields — the middle one ('My answer') is the one that actually helps you remember. Link every error to a topic.")
        +step(5,"Log study hours at night.","Habits tab. Milestones at 4/8/12h auto-check. Study credit is graded — 8h gets you 67% toward the 12h goal.")
      +'</div>'

      +'<div class="card section-gap"><div class="card-h"><h2>Tabs, explained</h2><span class="sub">what each one is for</span></div>'
        +tab("Home","Your command center. Next action card, D-Day banner, Exam Readiness (composite score), Marks Leakage, Today's Agenda (Errors + Sessions merged), Weak Radar preview, Momentum, and Focus time per subject.","The only page you <i>need</i> to visit daily. Every other tab is a pit stop.")
        +tab("Syllabus",totalTopics+" topics nested subject → topic → subtopic. Drag ☰ to reorder. Click any topic → full detail. Study notes support LaTeX ($$...$$).","This is your map. Keep it accurate — every other feature depends on topics being real.")
        +tab("Reviews","FSRS-powered spaced repetition. Every topic and error becomes a card. The engine calculates your exact memory stability and schedules the next review. A <b>📅 badge</b> marks capped cards.","This is the engine that makes knowledge stick. FSRS prevents 'Ease Hell' and adapts to your actual retention.")
        +tab("Errors","Every mistake, logged once, now scheduled. Rate each Again/Hard/Good/Easy — it returns on the FSRS schedule. Filter by type or source.","The single highest-ROI habit in exam prep. A mistake logged and fixed is worth 10 new questions.")
        +tab("Mocks","Log raw score, percentile, accuracy, and <b>section-wise scores</b>. Weakest section highlighted. Suggested topics to tag. Section trends chart.","Mocks are the only real feedback on exam readiness. Section scores tell you where you lost marks.")
        +tab("Radar","Weak topics ranked by friction × importance. Includes <b>Marks at Risk</b> — exactly how many marks a topic is costing you based on exam weightage.","Tells you where to spend effort. Not every weak topic matters equally — this ranks by actual leverage.")
        +tab("Habits","Daily study hours + workout + introspection. Milestones at 4/8/12h. Week/month/year views. Year heatmap. 50% goal marker.","Consistency beats intensity. This is where you see whether you actually showed up.")
      +'</div>'

      +'<div class="card section-gap"><div class="card-h"><h2>Key concepts</h2></div>'
        +'<div class="detail-block"><h5>FSRS (Free Spaced Repetition Scheduler)</h5><div class="tiny" style="line-height:1.7;color:var(--text-2)">We upgraded from the classic SM-2 algorithm to FSRS. Instead of a fixed multiplier, Apex now calculates the exact <b>Stability</b> (how long the memory lasts) and <b>Difficulty</b> (how hard the card is). This means intervals are optimized for your memory, and cards you forget don\'t get permanently stuck in short intervals.</div></div>'
        +'<div class="detail-block"><h5>Exam-aware intervals</h5><div class="tiny" style="line-height:1.7;color:var(--text-2)">Your SRS is capped by the nearest exam that matches a topic\'s tag. If CHSL is D-44 and a topic is tagged CHSL, its interval caps at 30 days. No more scheduling reviews after the exam.</div></div>'
        +'<div class="detail-block"><h5>Marks at Risk</h5><div class="tiny" style="line-height:1.7;color:var(--text-2)">Calculated as <code>(Weightage / 5) × Exam Proximity × Status Gap × 100</code>. A high number means fixing this topic will have the biggest impact on your final score.</div></div>'
        +'<div class="detail-block"><h5>Data Safety (IndexedDB)</h5><div class="tiny" style="line-height:1.7;color:var(--text-2)">Apex stores your data in IndexedDB, which is much larger and safer than localStorage. It also asks the browser for <b>Persistent Storage</b> so it won\'t be auto-cleared. Still, export a JSON backup weekly.</div></div>'
      +'</div>'

      +'<div class="card section-gap"><div class="card-h"><h2>Pro tips</h2></div>'
        +tip('<b>Log the session the moment you finish.</b> The smart quick-log suggests your 3 most recent topics.')
        +tip('<b>Link every error to a topic.</b> Unlinked errors vanish from the Radar — you might as well not log them.')
        +tip('<b>Use the Mock Debrief.</b> When you log a mock, hit "Debrief" to instantly tag weak topics and log specific mistakes.')
        +tip('<b>Write topic notes with formulas in $$...$$.</b> The review card shows typeset math, which is 10× more useful than re-reading raw LaTeX.')
        +tip('<b>Take a mock every 10–14 days.</b> The engine will nudge you. Mocks are the only real calibration.')
        +tip('<b>Export a backup weekly.</b> Settings → Data → Export. The JSON file imports cleanly on any device.')
      +'</div>'

      +'<div class="card section-gap"><div class="card-h"><h2>Your data</h2></div><div class="tiny" style="line-height:1.7;color:var(--text-2)">Everything lives in your browser\'s <b>IndexedDB</b>. Nothing leaves your device unless you enable Cloud Sync, which encrypts the payload with your passphrase. You currently have <b>'+totalTopics+'</b> topics and <b>'+totalExams+'</b> exam target'+(totalExams===1?'':'s')+' configured.</div></div>'

      +'<footer class="app-foot"><span>Designed &amp; built by <b style="font-weight:700;color:var(--text)">Ayush Tomar</b> · Apex · The Exam OS · Built for aspirants who want a system, not a to-do list.</span><span><button class="btn ghost sm" data-action="open-settings">Settings</button><button class="btn ghost sm" data-action="start-tour">Tour</button></span></footer>';
  };
  
  window.viewGuide = newViewGuide;
  if (window.VIEWS) VIEWS.guide = newViewGuide;

  // 3. Override the Welcome Modal
  const newWelcomeOverlay = function() {
    const r=$("#welcome-root");
    if(!r)return;
    if(S.settings.welcomeDone){r.innerHTML="";return;}
    const c=getContact();const topicCount=S.syllabus.length;

    const heroSVG='<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><defs><linearGradient id="wh-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E0D4FF"/><stop offset="50%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient><linearGradient id="wh-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EDE9FE"/><stop offset="60%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><circle cx="100" cy="100" r="72" fill="none" stroke="url(#wh-ring)" stroke-width="0.8" opacity="0.35"/><g style="transform-origin:100px 100px;animation:whSpin 140s linear infinite"><line x1="100" y1="26" x2="100" y2="36" stroke="url(#wh-ring)" stroke-width="2" stroke-linecap="round"/><line x1="100" y1="164" x2="100" y2="174" stroke="url(#wh-ring)" stroke-width="2" stroke-linecap="round"/><line x1="26" y1="100" x2="36" y2="100" stroke="url(#wh-ring)" stroke-width="2" stroke-linecap="round"/><line x1="164" y1="100" x2="174" y2="100" stroke="url(#wh-ring)" stroke-width="2" stroke-linecap="round"/><line x1="48" y1="48" x2="55" y2="55" stroke="url(#wh-ring)" stroke-width="1.2" opacity="0.55"/><line x1="145" y1="145" x2="152" y2="152" stroke="url(#wh-ring)" stroke-width="1.2" opacity="0.55"/><line x1="152" y1="48" x2="145" y2="55" stroke="url(#wh-ring)" stroke-width="1.2" opacity="0.55"/><line x1="55" y1="145" x2="48" y2="152" stroke="url(#wh-ring)" stroke-width="1.2" opacity="0.55"/></g><polygon points="100,50 103,100 100,150 97,100" fill="url(#wh-fill)" opacity="0.9"/><polygon points="50,100 100,97 150,100 100,103" fill="url(#wh-fill)" opacity="0.45"/><circle cx="100" cy="100" r="2.5" fill="#B8A4FF"/><circle cx="100" cy="100" r="1" fill="#fff"/><style>@keyframes whSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}</style></svg>';

    r.innerHTML='<div class="welcome-wrap"><div class="welcome-modal"><button class="welcome-x" data-action="dismiss-welcome" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button><div class="welcome-hero">'+heroSVG+'</div><div class="welcome-body"><div class="welcome-eyebrow">Apex · The Exam OS · v24</div><h1>The system that answers <em>one question.</em></h1><p class="lead">What should I do right now? Apex reads your syllabus, reviews, mistakes, and mocks — and tells you the single most important next move. Every morning.</p><div class="welcome-loop"><span>Study</span><i>·</i><span>Remember</span><i>·</i><span>Diagnose</span><i>·</i><span>Correct</span></div><div class="welcome-points"><div class="welcome-point"><span class="n">01</span><div><b>FSRS-Powered Memory Engine.</b><span>Calculates exact memory stability. Intervals adapt to you, not a fixed multiplier. No more "Ease Hell".</span></div></div><div class="welcome-point"><span class="n">02</span><div><b>Marks at Risk.</b><span>Every topic is ranked by weightage × exam urgency. Fixes the topics that actually cost you marks, not just the ones that feel hard.</span></div></div><div class="welcome-point"><span class="n">03</span><div><b>Data Safe. Sync Encrypted.</b><span>Stored in IndexedDB with persistent storage. Cloud sync is AES-GCM encrypted. Your passphrase never leaves your device.</span></div></div></div><div class="welcome-actions"><label class="welcome-check"><input type="checkbox" id="welcome-dont-show"> Don\'t show again</label><button class="btn ghost sm" data-action="start-tour">Take the tour</button><button class="btn primary" data-action="dismiss-welcome">Enter Apex</button></div></div></div></div>';
  };

  window.welcomeOverlay = newWelcomeOverlay;

  console.log('[apex-gist-update] Guide, Welcome modal, and Tooltips updated');
})();