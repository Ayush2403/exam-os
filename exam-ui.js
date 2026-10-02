/* ============================================================
   APEX EXAM UI — computed priority in Syllabus (single version)
   No competing observers. One update loop.
   ============================================================ */
(function(){
  'use strict';

  var VERSION = "v3";

  // ---- Auto-resolve which exam we compute priorities for ----
  function resolveExam() {
    // 1. Explicit setting wins if it matches an exam target
    var explicit = (S.settings && S.settings.readinessExam) || "";
    var targets = (S.settings && Array.isArray(S.settings.exams)) ? S.settings.exams : [];

    if (explicit) {
      var hasMatch = targets.some(function(x) {
        return x.examTag && String(x.examTag).toLowerCase() === String(explicit).toLowerCase();
      });
      if (hasMatch || !targets.length) return explicit;
    }

    // 2. Nearest future exam that has a tag
    var now = (typeof todayISO === "function") ? todayISO() : "";
    var future = targets.filter(function(x) {
      if (!x.date || !x.examTag) return false;
      if (typeof diffD !== "function") return true;
      return diffD(x.date, now) >= 0;
    });
    if (future.length) {
      future.sort(function(a, b) {
        var da = typeof diffD === "function" ? diffD(a.date, now) : 0;
        var db = typeof diffD === "function" ? diffD(b.date, now) : 0;
        return da - db;
      });
      return future[0].examTag;
    }

    // 3. Any tagged exam
    var anyTagged = targets.filter(function(x) { return x.examTag; });
    return anyTagged.length ? anyTagged[0].examTag : explicit;
  }

  // ---- Color scale ----
  function colorFor(score) {
    if (score >= 70) return { bg:"rgba(248,113,113,.18)", bd:"rgba(248,113,113,.5)", fg:"#fca5a5", label:"CRIT" };
    if (score >= 50) return { bg:"rgba(250,204,21,.18)", bd:"rgba(250,204,21,.5)", fg:"#fde68a", label:"HIGH" };
    if (score >= 30) return { bg:"rgba(96,165,250,.18)", bd:"rgba(96,165,250,.5)", fg:"#93c5fd", label:"MED" };
    return { bg:"rgba(74,222,128,.15)", bd:"rgba(74,222,128,.45)", fg:"#86efac", label:"LOW" };
  }

  // ---- Single update routine ----
  function update() {
    if (typeof computeTopicPriority !== "function") return;
    var list = document.getElementById("syl-list");
    if (!list) return;

    var examTag = resolveExam();

    // Hide priority dropdowns
    list.querySelectorAll('select.mini-sel[data-change="syl-priority"]').forEach(function(el) {
      var p = el.parentElement;
      while (p && p.tagName !== "DIV") p = p.parentElement;
      el.style.display = "none";
    });

    // Hide priority filter chips in the toolbar
    document.querySelectorAll('.toolbar [data-pri]').forEach(function(el) {
      el.style.display = "none";
    });

    // Exam bar above the list
    var bar = document.querySelector(".apex-active-exam-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "apex-active-exam-bar";
      bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);padding:6px 0 10px;display:flex;justify-content:space-between;align-items:center";
      list.parentNode.insertBefore(bar, list);
    }
    bar.innerHTML = '<span>Priorities for <b style="color:var(--accent-2)">' + (examTag || "no exam") + '</b></span>' +
                    '<span style="opacity:.55">weightage × proximity × status</span>';

    // Rewrite every topic row's priority pill
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

      // Remove ALL computed pills (v1, v2, v3)
      nameRow.querySelectorAll(".apex-computed-pri").forEach(function(p) { p.remove(); });

      var pill = document.createElement("span");
      pill.className = "pill apex-computed-pri";
      pill.style.cssText = "font-size:9.5px;padding:2px 8px;background:" + pc.bg + ";border-color:" + pc.bd + ";color:" + pc.fg + ";font-family:'JetBrains Mono',monospace;letter-spacing:.08em;font-weight:600;margin-left:auto;flex-shrink:0";
      pill.textContent = pc.label + " " + score + " · w" + weight;
      pill.title = "Priority " + score + "/100\nWeightage " + weight + "/5 for " + examTag + "\nStatus: " + (t.status || "?");
      nameRow.appendChild(pill);
    });
  }

  // ---- Debounced scheduler (100ms after last mutation) ----
  var _timer = null;
  function schedule() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(function() { _timer = null; update(); }, 100);
  }

  // ---- Attach observer to #view ----
  function attach() {
    var view = document.getElementById("view");
    if (!view) { setTimeout(attach, 250); return; }
    new MutationObserver(schedule).observe(view, { childList: true, subtree: true });
    update();
    // Run again after 800ms to win any race with older observers
    setTimeout(update, 800);
    setTimeout(update, 2000);
  }
  attach();

  // Expose for manual re-run
  window.apexExamUIRefresh = update;
  window.resolveActiveExam = resolveExam;

  console.log("[apex-exam-ui] " + VERSION + " — single source of truth");
})();
