/* ============================================================
   APEX ONBOARDING WIZARD (60-Second Setup)
   ============================================================ */
(function(){
  if (window._apexOnboarding) return;
  window._apexOnboarding = true;

  function checkOnboarding() {
    // Only trigger if completely empty
    if (S.sessions.length > 0) return;
    if (S.settings.onboardingDone) return;
    if (S.settings.exams && S.settings.exams.length > 0) return;
    if (document.querySelector('.welcome-modal')) return; // Don't stack modals

    setTimeout(showWizard, 1000); // Wait for UI to settle
  }

  function showWizard() {
    const exams = taxList('exams');
    const examOpts = exams.map(e => '<option value="'+esc(e)+'">'+esc(e)+'</option>').join('');

    const body = `
      <div style="font-size:14px;line-height:1.6;color:var(--text-2);margin-bottom:20px">
        Welcome to Apex. Let's set up your first exam target so the engine knows what to prioritize.
      </div>
      <div class="frow"><label>Target Exam</label><select class="inp" name="exam">${examOpts}</select></div>
      <div class="frow"><label>Exam Date</label><input type="date" class="inp" name="date" value="${addDays(todayISO(), 90)}"></div>
      <div class="frow"><label>Daily Study Target (Hours)</label><input type="number" class="inp" name="hours" value="4" min="1" max="16" step="0.5"></div>
      <div class="hint" style="margin-top:10px;line-height:1.5">Apex will use this to calculate your D-Day banner, your daily focus goal, and the Marks-at-Risk algorithm.</div>
    `;

    openModal("Let's set up Apex", body, function(v) {
      if (!v.exam || !v.date) { toast("Please fill in all fields"); return false; }
      
      snapshot();
      if (!Array.isArray(S.settings.exams)) S.settings.exams = [];
      
      S.settings.exams.push({
        id: uid("ex"),
        label: v.exam,
        examTag: v.exam,
        date: v.date,
        priority: "Primary",
        affectsCap: true
      });
      
      S.settings.focusDailyGoal = Math.round((parseFloat(v.hours) || 4) * 60);
      S.settings.onboardingDone = true;
      
      saveLocal();
      rerender();
      toast("Setup complete!", "Let's get to work.");
    }, "Start Studying");

    // Allow the user to skip it if they want
    const cl = document.querySelector('[data-mclose]');
    if (cl) {
      cl.textContent = "Skip";
      cl.onclick = function() {
        S.settings.onboardingDone = true;
        saveLocal();
        closeModal();
      };
    }
  }

  // Check on load and route change
  const _origRender = window.renderRoute;
  window.renderRoute = function() {
    const res = _origRender.apply(this, arguments);
    if (route() === 'dashboard') setTimeout(checkOnboarding, 200);
    return res;
  };
  try { renderRoute = window.renderRoute; } catch(e){}

  setTimeout(checkOnboarding, 1500);
  console.log('[apex-onboarding] installed');
})();