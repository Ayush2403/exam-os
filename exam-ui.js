/* ============================================================
   APEX EXAM UI — computed priority display in Syllabus
   Loaded after exam-weightage.js. Overrides priority UI.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamUI) return;
  window._apexExamUI = true;

  // ---- Color scale for computed priority ----
  // 70+ = critical (red), 50-69 = high (amber), 30-49 = medium (yellow), <30 = low (green)
  function priorityColor(score) {
    if (score >= 70) return { bg: "rgba(248,113,113,.14)", bd: "rgba(248,113,113,.4)", fg: "#fca5a5", label: "Critical" };
    if (score >= 50) return { bg: "rgba(250,204,21,.14)", bd: "rgba(250,204,21,.4)", fg: "#fde68a", label: "High" };
    if (score >= 30) return { bg: "rgba(96,165,250,.14)", bd: "rgba(96,165,250,.4)", fg: "#93c5fd", label: "Medium" };
    return { bg: "rgba(74,222,128,.14)", bd: "rgba(74,222,128,.4)", fg: "#86efac", label: "Low" };
  }

  // ---- Hide the priority filter chips in the toolbar ----
  function hidePriorityFilter() {
    var chips = document.querySelectorAll('.toolbar .chips [data-pri]');
    chips.forEach(function(c) { c.style.display = "none"; });
    // Also hide the priority dropdown filter if present
    var priSelect = document.querySelector('#syl-priority');
    if (priSelect) {
      var wrap = priSelect.closest('.row') || priSelect.parentElement;
      if (wrap && wrap.querySelector('select') === priSelect && wrap.children.length <= 2) {
        // Only hide if it's a standalone priority selector
      }
    }
  }

  // ---- Replace stored priority pills with computed priority ----
  function replaceTopicPriorityPills() {
    if (typeof computeTopicPriority !== "function") return;
    var list = document.getElementById("syl-list");
    if (!list) return;

    var examTag = (typeof getActiveExamTag === "function") ? getActiveExamTag() : "";

    // Topic rows have a .pill with the priority class (pri-critical, pri-high, etc)
    list.querySelectorAll(".topic-row").forEach(function(row) {
      var id = row.dataset.id;
      if (!id) return;
      var t = (typeof topicById === "function") ? topicById(id) : null;
      if (!t) return;

      var score = computeTopicPriority(t, examTag);
      var pc = priorityColor(score);

      // Find the priority pill (was previously the stored priority badge)
      var nameRow = row.querySelector('.topic-body > div:first-child');
      if (!nameRow) return;

      // Remove the old priority pill if it exists
      var oldPill = nameRow.querySelector('.pill[class*="pri-"]');
      if (oldPill) oldPill.remove();

      // Add computed priority pill
      if (!nameRow.querySelector('.apex-computed-pri')) {
        var pill = document.createElement("span");
        pill.className = "pill apex-computed-pri";
        pill.style.cssText = "font-size:10px;padding:2px 7px;background:" + pc.bg + ";border-color:" + pc.bd + ";color:" + pc.fg;
        pill.textContent = pc.label + " " + score;
        pill.title = "Computed priority: " + score + "/100\n" +
                     "Weightage: " + (typeof getTopicWeightage === "function" ? getTopicWeightage(t, examTag) : "?") + "/5\n" +
                     "Active exam: " + (examTag || "(none)");
        nameRow.appendChild(pill);
      } else {
        var existing = nameRow.querySelector('.apex-computed-pri');
        existing.style.background = pc.bg;
        existing.style.borderColor = pc.bd;
        existing.style.color = pc.fg;
        existing.textContent = pc.label + " " + score;
      }
    });
  }

  // ---- Weightage display label per exam ----
  function labelWeightageSelect() {
    var examTag = (typeof getActiveExamTag === "function") ? getActiveExamTag() : "";
    if (!examTag) return;

    // Add a subtle label above the syllabus list showing the active exam
    var list = document.getElementById("syl-list");
    if (!list) return;
    if (list.previousElementSibling && list.previousElementSibling.classList.contains("apex-active-exam-bar")) return;

    var bar = document.createElement("div");
    bar.className = "apex-active-exam-bar";
    bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--text-3);padding:6px 0 10px;";
    bar.innerHTML = 'Active exam: <b style="color:var(--accent-2)">' + examTag + '</b> · priority computed live from weightage &amp; D-Day';
    list.parentNode.insertBefore(bar, list);
  }

  // ---- MutationObserver — re-apply after every render ----
  var observer = new MutationObserver(function() {
    hidePriorityFilter();
    labelWeightageSelect();
    // Debounce the pill rewrite — happens a tick later so React-like rendering settles
    if (window._apexUIRaf) cancelAnimationFrame(window._apexUIRaf);
    window._apexUIRaf = requestAnimationFrame(replaceTopicPriorityPills);
  });

  function attach() {
    var view = document.getElementById("view");
    if (!view) { setTimeout(attach, 200); return; }
    observer.observe(view, { childList: true, subtree: true });
    hidePriorityFilter();
    labelWeightageSelect();
    replaceTopicPriorityPills();
  }
  attach();

  // ---- Expose for manual re-run ----
  window.apexRefreshExamUI = function() {
    hidePriorityFilter();
    labelWeightageSelect();
    replaceTopicPriorityPills();
  };

  console.log("[apex-exam-ui] priority pills wired to computed priority");
})();

/* ============================================================
   APEX EXAM UI v2 — remove priority dropdown, auto-resolve exam
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamUIV2) return;
  window._apexExamUIV2 = true;

  // ---- Auto-resolve active exam ----
  // If user hasn't picked one, use the nearest exam target's tag.
  function resolveActiveExam() {
    var explicit = (typeof getActiveExamTag === "function") ? getActiveExamTag() : "";
    if (explicit) return explicit;
    var targets = (S.settings && Array.isArray(S.settings.exams)) ? S.settings.exams : [];
    var future = targets.filter(function(x) {
      return x.date && x.examTag && diffD(x.date, todayISO()) >= 0;
    });
    if (future.length) {
      future.sort(function(a, b) {
        return diffD(a.date, todayISO()) - diffD(b.date, todayISO());
      });
      return future[0].examTag;
    }
    // Fall back to any tagged exam
    var anyTagged = targets.filter(function(x) { return x.examTag; });
    return anyTagged.length ? anyTagged[0].examTag : "";
  }

  // ---- Hide the priority dropdown in each topic row ----
  function hidePriorityDropdowns() {
    document.querySelectorAll('.topic-row select.mini-sel[data-change="syl-priority"]').forEach(function(el) {
      el.style.display = "none";
      // Also hide the wrapper if it was inside one
      var p = el.parentElement;
      if (p && p !== el && p.children.length === 1) p.style.display = "none";
    });
  }

  // ---- Re-run priority computation with auto-resolved exam ----
  function recomputePills() {
    if (typeof computeTopicPriority !== "function") return;
    var list = document.getElementById("syl-list");
    if (!list) return;

    var examTag = resolveActiveExam();
    if (!examTag) return;

    // Store the resolved tag so subsequent runs use it
    if (!S.settings._lastResolvedExam) S.settings._lastResolvedExam = "";
    S.settings._lastResolvedExam = examTag;

    function colorFor(score) {
      if (score >= 70) return { bg:"rgba(248,113,113,.16)", bd:"rgba(248,113,113,.45)", fg:"#fca5a5", label:"CRIT" };
      if (score >= 50) return { bg:"rgba(250,204,21,.16)", bd:"rgba(250,204,21,.45)", fg:"#fde68a", label:"HIGH" };
      if (score >= 30) return { bg:"rgba(96,165,250,.16)", bd:"rgba(96,165,250,.45)", fg:"#93c5fd", label:"MED" };
      return { bg:"rgba(74,222,128,.14)", bd:"rgba(74,222,128,.4)", fg:"#86efac", label:"LOW" };
    }

    list.querySelectorAll(".topic-row").forEach(function(row) {
      var id = row.dataset.id;
      if (!id) return;
      var t = (typeof topicById === "function") ? topicById(id) : null;
      if (!t) return;

      var score = computeTopicPriority(t, examTag);
      var weight = (typeof getTopicWeightage === "function") ? getTopicWeightage(t, examTag) : 2;
      var pc = colorFor(score);

      var nameRow = row.querySelector('.topic-body > div:first-child');
      if (!nameRow) return;

      // Remove old pills
      nameRow.querySelectorAll('.apex-computed-pri').forEach(function(p) { p.remove(); });

      // Add computed pill
      var pill = document.createElement("span");
      pill.className = "pill apex-computed-pri";
      pill.style.cssText = "font-size:9.5px;padding:2px 8px;background:" + pc.bg + ";border-color:" + pc.bd + ";color:" + pc.fg + ";font-family:'JetBrains Mono',monospace;letter-spacing:.08em;font-weight:600;margin-left:auto;flex-shrink:0";
      pill.textContent = pc.label + " " + score + " · w" + weight;
      pill.title = "Computed priority: " + score + "/100\n" +
                   "Weightage: " + weight + "/5 for " + examTag + "\n" +
                   "Status: " + t.status;
      nameRow.appendChild(pill);
    });
  }

  // ---- Show which exam the priorities are based on ----
  function updateExamBar() {
    var list = document.getElementById("syl-list");
    if (!list) return;
    var examTag = resolveActiveExam();
    var bar = document.querySelector(".apex-active-exam-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "apex-active-exam-bar";
      bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);padding:6px 0 10px;display:flex;justify-content:space-between;align-items:center";
      list.parentNode.insertBefore(bar, list);
    }
    bar.innerHTML =
      '<span>Priorities computed for <b style="color:var(--accent-2)">' + (examTag || "no exam") + '</b></span>' +
      '<span style="opacity:.6">weightage &times; proximity &times; status gap</span>';
  }

  // ---- Main loop ----
  function tick() {
    hidePriorityDropdowns();
    updateExamBar();
    recomputePills();
  }

  // Re-run whenever the view changes
  var view = document.getElementById("view");
  if (view) {
    new MutationObserver(function() {
      if (window._apexRafV2) cancelAnimationFrame(window._apexRafV2);
      window._apexRafV2 = requestAnimationFrame(tick);
    }).observe(view, { childList: true, subtree: true });
  }
  tick();

  // Expose for manual re-run
  window.apexExamUIRefresh = tick;
  window.resolveActiveExam = resolveActiveExam;

  console.log("[apex-exam-ui] v2 — priority dropdown hidden, exam auto-resolved");
})();
