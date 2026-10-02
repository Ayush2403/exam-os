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
