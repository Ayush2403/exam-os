/* ============================================================
   APEX EXAM CONFIG — per-exam priority + weightage
   
   Single source of truth: S.settings.activeExam
   
   Data model per topic:
     examConfig: {
       "CGL":   { priority: "Critical", weightage: "High" },
       "RBI GRADE B": { priority: "Critical", weightage: "High" }
     }
   
   Legacy fields priority/weightage preserved for backwards compat
   but no longer read by any UI.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamConfig) return;
  window._apexExamConfig = true;

  var PRIORITIES = ["Critical", "High", "Medium", "Low"];
  var WEIGHTAGES = ["High", "Medium", "Low"];

  // ============================================================
  // 1. Ensure S.tax.exams has all supported exams
  // ============================================================
  var ALL_EXAMS = [
    "CGL", "CHSL", "IB ACIO",
    "RBI GRADE B", "RBI GRADE A", "RBI ASSISTANT",
    "NABARD GRADE A",
    "SBI PO", "SBI CLERK",
    "IBPS PO", "IBPS CLERK",
    "RRB PO", "RRB CLERK"
  ];

  function ensureExams() {
    if (!S.tax) S.tax = {};
    if (!Array.isArray(S.tax.exams)) S.tax.exams = [];
    ALL_EXAMS.forEach(function(ex) {
      if (S.tax.exams.indexOf(ex) === -1) S.tax.exams.push(ex);
    });
  }

  // ============================================================
  // 2. Migration — build examConfig from legacy priority/weightage
  //    Runs once per topic. Existing topics with a stored priority
  //    get it copied into examConfig for each tagged exam.
  // ============================================================
  function migrateTopics() {
    var migrated = 0;
    S.syllabus.forEach(function(t) {
      if (t.examConfig && typeof t.examConfig === "object") return;

      var cfg = {};
      var exams = Array.isArray(t.exams) ? t.exams : [];
      exams.forEach(function(ex) {
        cfg[ex] = {
          priority: t.priority || "Medium",
          weightage: t.weightage || "Medium"
        };
      });

      t.examConfig = cfg;
      migrated++;
    });
    return migrated;
  }

  // ============================================================
  // 3. Ensure activeExam is set
  // ============================================================
  function ensureActiveExam() {
    if (!S.settings) S.settings = {};
    var current = S.settings.activeExam;

    // If current exam exists and is valid, keep it
    if (current && S.tax.exams.indexOf(current) > -1) return;

    // Otherwise pick nearest future tagged exam
    var targets = Array.isArray(S.settings.exams) ? S.settings.exams : [];
    var future = targets.filter(function(x) {
      return x.date && x.examTag && diffD(x.date, todayISO()) >= 0;
    });
    if (future.length) {
      future.sort(function(a, b) {
        return diffD(a.date, todayISO()) - diffD(b.date, todayISO());
      });
      S.settings.activeExam = future[0].examTag;
      return;
    }

    // Fallback: any tagged exam
    var tagged = targets.filter(function(x) { return x.examTag; });
    S.settings.activeExam = tagged.length ? tagged[0].examTag : "CGL";
  }

  function getActiveExam() {
    return (S.settings && S.settings.activeExam) || "CGL";
  }

  function setActiveExam(exam) {
    if (!S.settings) S.settings = {};
    S.settings.activeExam = exam;
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
    // Force re-render of syllabus list and pill
    if (typeof renderSylList === "function") renderSylList();
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }

  // ============================================================
  // 4. Priority + weightage resolution for a topic
  // ============================================================
  function getPriority(topic, exam) {
    if (!topic || !exam) return "";
    var cfg = topic.examConfig && topic.examConfig[exam];
    if (cfg && cfg.priority) return cfg.priority;
    return "";
  }

  function getWeightage(topic, exam) {
    if (!topic || !exam) return "";
    var cfg = topic.examConfig && topic.examConfig[exam];
    if (cfg && cfg.weightage) return cfg.weightage;
    return "";
  }

  function setExamConfig(topic, exam, priority, weightage) {
    if (!topic) return;
    if (!topic.examConfig) topic.examConfig = {};
    if (!topic.examConfig[exam]) topic.examConfig[exam] = {};
    if (priority) topic.examConfig[exam].priority = priority;
    else delete topic.examConfig[exam].priority;
    if (weightage) topic.examConfig[exam].weightage = weightage;
    else delete topic.examConfig[exam].weightage;
    if (!topic.examConfig[exam].priority && !topic.examConfig[exam].weightage) {
      delete topic.examConfig[exam];
    }
  }

  // ============================================================
  // 5. Priority → color mapping
  // ============================================================
  function priorityColor(priority) {
    if (priority === "Critical") return { bg:"rgba(248,113,113,.18)", bd:"rgba(248,113,113,.5)", fg:"#fca5a5" };
    if (priority === "High")     return { bg:"rgba(250,204,21,.18)", bd:"rgba(250,204,21,.5)", fg:"#fde68a" };
    if (priority === "Medium")   return { bg:"rgba(96,165,250,.18)", bd:"rgba(96,165,250,.5)", fg:"#93c5fd" };
    if (priority === "Low")      return { bg:"rgba(74,222,128,.15)", bd:"rgba(74,222,128,.45)", fg:"#86efac" };
    return { bg:"rgba(120,120,120,.12)", bd:"rgba(120,120,120,.3)", fg:"#9ca3af" };
  }

  // ============================================================
  // 6. Override topicModal — per-exam priority/weightage rows
  // ============================================================
  var _origTopicModal = window.topicModal;

  window.topicModal = function(t, prefill) {
    var subs = (typeof subjectOptions === "function") ? subjectOptions() : [];
    var pref = prefill || {};
    var initParent = pref.parentId || (t && t.parentId) || null;
    var initSubject = pref.subjectId ? topicById(pref.subjectId) : null;
    var defaultSubj = t ? t.subject : (initSubject ? initSubject.subject : (pref.subject || (subs[0] || "maths")));
    var currentExams = t && Array.isArray(t.exams) ? t.exams.slice() : [];

    var examChips = ALL_EXAMS.map(function(e) {
      var checked = currentExams.indexOf(e) > -1 ? " checked" : "";
      return '<label class="chip" style="cursor:pointer"><input type="checkbox" name="exams" value="' + esc(e) + '"' + checked + ' style="accent-color:var(--accent);margin-right:5px">' + esc(e) + '</label>';
    }).join("");

    var body =
      '<div class="frow"><label>Topic</label><input class="inp" name="topic" value="' + esc(t ? t.topic : "") + '" placeholder="e.g. Percentage"></div>' +
      '<div class="f2"><div class="frow"><label>Subject</label>' + selPlus("subject", subs, defaultSubj, "subjects", "Subject") + '</div>' +
      '<div class="frow"><label>Status</label>' + selPlus("status", taxList("statuses"), t ? t.status : "Not started", "statuses", "Status") + '</div></div>' +
      '<div class="frow"><label>Exams</label><div class="chips" style="gap:6px" data-exam-chips>' + examChips + '</div></div>' +
      '<div class="frow"><label>Per-exam priority &amp; weightage</label><div data-exam-config-rows style="display:flex;flex-direction:column;gap:8px"></div>' +
        '<div class="hint" style="margin-top:6px">Each tagged exam gets its own priority and weightage. The syllabus pill shows the priority for whichever exam is currently active.</div></div>' +
      '<div class="frow"><label>Parent topic (optional)</label>' + pickerHTML("parentIds", initParent ? [initParent] : [], false) + '</div>' +
      '<div class="frow"><label>Remarks</label><textarea class="inp" name="remarks" rows="2">' + esc(t ? t.remarks : "") + '</textarea></div>' +
      '<div class="frow"><label>Study notes</label><textarea class="inp" name="notes" rows="4">' + esc(t ? t.notes : "") + '</textarea></div>';

    openModal(t ? "Edit Topic" : "Add Topic", body, function(v) {
      if (!v.topic) { toast("Topic required"); return false; }
      var parentIds = pickVals(v.parentIds);
      var parentId = parentIds[0] || null;
      if (t && parentId) {
        var descendants = new Set(); var stack = [t.id];
        while (stack.length) {
          var cid = stack.pop();
          S.syllabus.filter(function(x) { return x.parentId === cid; }).forEach(function(x) {
            descendants.add(x.id); stack.push(x.id);
          });
        }
        if (descendants.has(parentId)) { toast("Cannot set a descendant as parent"); return false; }
        if (parentId === t.id) { toast("Cannot be its own parent"); return false; }
      }

      // Read per-exam config from DOM
      var rows = document.querySelectorAll("[data-exam-config-rows] [data-exam-row]");
      var newExamConfig = {};
      var newExams = [];
      rows.forEach(function(row) {
        var ex = row.getAttribute("data-exam-row");
        var priSel = row.querySelector('[data-cfg-priority]');
        var wtSel = row.querySelector('[data-cfg-weightage]');
        var pri = priSel ? priSel.value : "";
        var wt = wtSel ? wtSel.value : "";
        if (pri || wt) {
          newExamConfig[ex] = {};
          if (pri) newExamConfig[ex].priority = pri;
          if (wt) newExamConfig[ex].weightage = wt;
        }
        newExams.push(ex);
      });

      // Legacy priority/weightage = highest priority across tagged exams (for compat)
      var legacyPriority = "";
      PRIORITIES.forEach(function(p) {
        if (!legacyPriority && newExams.some(function(ex) {
          return newExamConfig[ex] && newExamConfig[ex].priority === p;
        })) legacyPriority = p;
      });

      var data = {
        topic: v.topic,
        subject: v.subject || "other",
        status: v.status || "Not started",
        exams: newExams,
        examConfig: newExamConfig,
        priority: legacyPriority,
        weightage: (newExams[0] && newExamConfig[newExams[0]] && newExamConfig[newExams[0]].weightage) || "",
        remarks: v.remarks || "",
        notes: v.notes || "",
        parentId: parentId
      };
      if (data.subject && taxList("subjects").indexOf(data.subject) < 0) taxAdd("subjects", data.subject);
      edit(function() {
        if (t) Object.assign(t, data);
        else S.syllabus.push(Object.assign({ id: uid("t") }, data));
      });
      toast(t ? "Topic updated" : "Topic added");
    }, t ? "Save" : "Add");

    // Wire picker + dynamic per-exam rows
    var modal = document.querySelector(".modal");
    if (!modal) return;
    modal.querySelectorAll(".tpick").forEach(wirePicker);

    function renderExamRows() {
      var chipsEl = modal.querySelector("[data-exam-chips]");
      var rowsEl = modal.querySelector("[data-exam-config-rows]");
      if (!chipsEl || !rowsEl) return;
      var checked = [];
      chipsEl.querySelectorAll('input[name="exams"]').forEach(function(cb) {
        if (cb.checked) checked.push(cb.value);
      });

      if (!checked.length) {
        rowsEl.innerHTML = '<div class="tiny" style="opacity:.5;padding:6px 0">Tag at least one exam above to set per-exam priority</div>';
        return;
      }

      rowsEl.innerHTML = checked.map(function(ex) {
        var existing = (t && t.examConfig && t.examConfig[ex]) || {};
        var curPri = existing.priority || "";
        var curWt = existing.weightage || "";
        var priOpts = '<option value="">—</option>' + PRIORITIES.map(function(p) {
          return '<option value="' + p + '"' + (curPri === p ? " selected" : "") + '>' + p + '</option>';
        }).join("");
        var wtOpts = '<option value="">—</option>' + WEIGHTAGES.map(function(w) {
          return '<option value="' + w + '"' + (curWt === w ? " selected" : "") + '>' + w + '</option>';
        }).join("");

        return '<div data-exam-row="' + esc(ex) + '" style="display:grid;grid-template-columns:110px 1fr 1fr;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:12px;font-weight:600;color:var(--text)">' + esc(ex) + '</div>' +
          '<select class="inp" data-cfg-priority style="min-height:34px;font-size:12px">' + priOpts + '</select>' +
          '<select class="inp" data-cfg-weightage style="min-height:34px;font-size:12px">' + wtOpts + '</select>' +
        '</div>';
      }).join("");
    }

    renderExamRows();
    modal.querySelector("[data-exam-chips]").addEventListener("change", function(e) {
      if (e.target.name === "exams") renderExamRows();
    });
  };

  // ============================================================
  // 7. Syllabus pill — reads activeExam's config
  // ============================================================
  function repaintPills() {
    var list = document.getElementById("syl-list");
    if (!list) return;
    var exam = getActiveExam();

    list.querySelectorAll(".topic-row").forEach(function(row) {
      var id = row.dataset.id;
      if (!id) return;
      var t = topicById(id);
      if (!t) return;

      var nameRow = row.querySelector('.topic-body > div:first-child');
      if (!nameRow) return;

      // Remove any old pill
      nameRow.querySelectorAll(".apex-computed-pri, .apex-cfg-pri").forEach(function(p) { p.remove(); });
      // Hide the legacy priority pill if it slipped through
      nameRow.querySelectorAll('.pill[class*="pri-"]').forEach(function(p) { p.style.display = "none"; });

      var isTagged = Array.isArray(t.exams) && t.exams.indexOf(exam) > -1;
      var pri = isTagged ? getPriority(t, exam) : "";
      var wt = isTagged ? getWeightage(t, exam) : "";

      var pill = document.createElement("span");
      pill.className = "pill apex-cfg-pri";
      pill.style.cssText = "margin-left:auto;flex-shrink:0;font-size:9.5px;padding:2px 9px;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;font-weight:600";

      if (!isTagged) {
        pill.style.background = "rgba(120,120,120,.08)";
        pill.style.borderColor = "rgba(120,120,120,.25)";
        pill.style.color = "#6b7280";
        pill.textContent = "— " + exam;
        pill.title = "Not tagged for " + exam;
      } else if (!pri && !wt) {
        pill.style.background = "rgba(120,120,120,.12)";
        pill.style.borderColor = "rgba(120,120,120,.3)";
        pill.style.color = "#9ca3af";
        pill.textContent = "SET PRIORITY";
        pill.title = "Click the pencil icon to set priority for " + exam;
      } else {
        var c = priorityColor(pri || "Medium");
        pill.style.background = c.bg;
        pill.style.borderColor = c.bd;
        pill.style.color = c.fg;
        pill.textContent = (pri || "—") + (wt ? " · " + wt : "");
        pill.title = exam + " priority: " + (pri || "not set") + "\nWeightage: " + (wt || "not set");
      }
      nameRow.appendChild(pill);
    });
  }

  // ============================================================
  // 8. Hide priority filter chips + legacy priority dropdowns
  // ============================================================
  function hideLegacy() {
    document.querySelectorAll('.toolbar [data-pri]').forEach(function(el) { el.style.display = "none"; });
    document.querySelectorAll('.topic-row select.mini-sel[data-change="syl-priority"]').forEach(function(el) {
      el.style.display = "none";
    });
    document.querySelectorAll('.topic-row select.mini-sel[data-change="syl-weight"]').forEach(function(el) {
      el.style.display = "none";
    });
    // Hide the legacy Priority frow in the old modal (if it still opens for some reason)
    document.querySelectorAll('.modal .frow').forEach(function(frow) {
      var label = frow.querySelector("label");
      if (label && /^\s*Priority\s*$/i.test(label.textContent)) frow.style.display = "none";
      if (label && /^\s*Weightage\s*$/i.test(label.textContent)) frow.style.display = "none";
    });
  }

  // ============================================================
  // 9. Exam bar above syllabus list
  // ============================================================
  function updateExamBar() {
    var list = document.getElementById("syl-list");
    if (!list) return;
    var exam = getActiveExam();
    var bar = document.querySelector(".apex-active-exam-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "apex-active-exam-bar";
      bar.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-3);padding:8px 0 10px;display:flex;justify-content:space-between;align-items:center";
      list.parentNode.insertBefore(bar, list);
    }
    var opts = ALL_EXAMS.map(function(e) {
      return '<option value="' + esc(e) + '"' + (e === exam ? " selected" : "") + '>' + esc(e) + '</option>';
    }).join("");
    bar.innerHTML =
      '<span>Active exam: <select data-active-exam style="background:transparent;border:none;color:var(--accent-2);font:inherit;letter-spacing:inherit;cursor:pointer;padding:0;font-weight:700">' + opts + '</select></span>' +
      '<span style="opacity:.55">priority per exam</span>';
    var sel = bar.querySelector("[data-active-exam]");
    if (sel) sel.addEventListener("change", function() { setActiveExam(sel.value); });
  }

  // ============================================================
  // 10. Wire the syllabus toolbar exam dropdown to activeExam
  // ============================================================
  function syncToolbarExamSelect() {
    var sel = document.getElementById("syl-exam");
    if (!sel) return;
    var exam = getActiveExam();
    // Force selection to activeExam
    sel.value = exam;
    if (sel._apexSynced) return;
    sel._apexSynced = true;
    sel.addEventListener("change", function() {
      setActiveExam(sel.value);
    });
  }

  // ============================================================
  // 11. Main refresh loop
  // ============================================================
  function refresh() {
    hideLegacy();
    updateExamBar();
    syncToolbarExamSelect();
    repaintPills();
  }

  var _raf = null;
  function schedule() {
    if (_raf) cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(refresh);
  }

  // ============================================================
  // 12. Run everything on load
  // ============================================================
  ensureExams();
  var migratedCount = migrateTopics();
  ensureActiveExam();
  if (migratedCount > 0) {
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}
  }

  // Watch view + modal
  var view = document.getElementById("view");
  if (view) new MutationObserver(schedule).observe(view, { childList: true, subtree: true });
  var modalRoot = document.getElementById("modal-root");
  if (modalRoot) new MutationObserver(schedule).observe(modalRoot, { childList: true, subtree: true });

  setTimeout(refresh, 200);
  setTimeout(refresh, 800);
  setTimeout(refresh, 2000);

  // Expose
  window.apexConfigRefresh = refresh;
  window.getPriority = getPriority;
  window.getWeightage = getWeightage;
  window.getActiveExam = getActiveExam;
  window.setActiveExam = setActiveExam;

  console.log("[apex-exam-config] ready — " + ALL_EXAMS.length + " exams, " + migratedCount + " topics migrated");
})();

/* ============================================================
   APEX EXAM CONFIG — one-time population
   Fills examConfig for every topic using subject-exam map
   + weightage database. Runs once per device.
   ============================================================ */
(function(){
  'use strict';

  var POPULATE_VERSION = 1;
  if (S.settings && S.settings._examConfigVersion >= POPULATE_VERSION) return;

  // Which exams test which subjects
  var SUBJECT_EXAM_MAP = {
    "maths": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "reasoning": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "english grammar": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "descriptive english": ["RBI GRADE B","RBI GRADE A","NABARD GRADE A"],
    "general science": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "geography": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "history": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "polity": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "economics": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","IBPS PO","RRB PO"],
    "economical issues": ["RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A"],
    "finance": ["RBI GRADE B","RBI GRADE A","RBI ASSISTANT"],
    "management": ["RBI GRADE B","RBI GRADE A"],
    "social issues": ["RBI GRADE B","RBI GRADE A","NABARD GRADE A"],
    "environment": ["CGL","CHSL","IB ACIO","RBI GRADE B","NABARD GRADE A","SBI PO","IBPS PO"],
    "ca": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "misc gk": ["CGL","CHSL","IB ACIO","RBI GRADE B","RBI GRADE A","RBI ASSISTANT","NABARD GRADE A","SBI PO","SBI CLERK","IBPS PO","IBPS CLERK","RRB PO","RRB CLERK"],
    "defence": ["CGL","CHSL","IB ACIO"],
    "ard": ["NABARD GRADE A"]
  };

  function weightageToPriority(w) {
    if (w >= 5) return "Critical";
    if (w >= 4) return "High";
    if (w >= 3) return "Medium";
    if (w >= 2) return "Low";
    if (w >= 1) return "Low";
    return "";
  }

  function weightageToLabel(w) {
    if (w >= 4) return "High";
    if (w >= 3) return "Medium";
    if (w >= 1) return "Low";
    return "";
  }

  function populate() {
    var getW = window.getTopicWeightage;
    if (typeof getW !== "function") {
      console.log("[apex-populate] weightage fn not loaded yet, retrying in 500ms");
      setTimeout(populate, 500);
      return;
    }

    var totalTopics = 0, totalConfigs = 0, skipped = 0;

    S.syllabus.forEach(function(t) {
      totalTopics++;
      var subj = (t.subject || "").toLowerCase();
      var mappedExams = SUBJECT_EXAM_MAP[subj] || [];

      var existingExams = Array.isArray(t.exams) ? t.exams : [];
      var allExams = Array.from(new Set(mappedExams.concat(existingExams)));

      // Only keep exams where weightage > 0
      var validExams = [];
      allExams.forEach(function(ex) {
        var w = getW(t, ex);
        if (w >= 1) validExams.push(ex);
      });

      if (!validExams.length) {
        // Unknown subject — leave exams as-is
        skipped++;
        return;
      }

      t.exams = validExams;
      if (!t.examConfig || typeof t.examConfig !== "object") t.examConfig = {};

      validExams.forEach(function(ex) {
        var w = getW(t, ex);
        var pri = weightageToPriority(w);
        var lbl = weightageToLabel(w);
        if (!t.examConfig[ex]) t.examConfig[ex] = {};
        if (!t.examConfig[ex].priority) t.examConfig[ex].priority = pri;
        if (!t.examConfig[ex].weightage) t.examConfig[ex].weightage = lbl;
        totalConfigs++;
      });
    });

    // Fix activeExam if it's stuck on "All"
    if (!S.settings.activeExam ||
        String(S.settings.activeExam).toLowerCase() === "all" ||
        String(S.settings.activeExam).toLowerCase() === "all exams") {
      var targets = Array.isArray(S.settings.exams) ? S.settings.exams : [];
      var future = targets.filter(function(x) {
        return x.date && x.examTag && diffD(x.date, todayISO()) >= 0;
      });
      if (future.length) {
        future.sort(function(a, b) {
          return diffD(a.date, todayISO()) - diffD(b.date, todayISO());
        });
        S.settings.activeExam = future[0].examTag;
      } else {
        S.settings.activeExam = "CGL";
      }
    }

    S.settings._examConfigVersion = POPULATE_VERSION;
    try { store.set(KEY, JSON.stringify(S)); } catch(e) {}

    console.log("[apex-populate] " + totalTopics + " topics scanned, " +
      totalConfigs + " exam configs written, " + skipped + " skipped (unknown subject)");
    console.log("[apex-populate] activeExam = " + S.settings.activeExam);
  }

  populate();

  // Refresh pills after populate
  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 400);
  setTimeout(function() {
    if (typeof window.apexConfigRefresh === "function") window.apexConfigRefresh();
  }, 1500);
})();
