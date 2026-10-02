/* ============================================================
   APEX EXAM INTELLIGENCE — weightage database v2
   Sources: Oliveboard, PracticeMock, EduTap, PW, Testbook,
            Adda247, Sankalp, C4S Courses, Guidely
   Period: 2018–2026 (8+ years PYQ trends)
   Scale:  5=Critical, 4=High, 3=Medium, 2=Low, 1=Rare
   ============================================================ */
(function(){
  'use strict';
  if (window._apexExamIntel) return;
  window._apexExamIntel = true;

  var WEIGHTAGE_DB = {

    // ========== SSC CGL ==========
    "CGL": {
      // Quant — geometry/mensuration/DI/trig are top
      "geometry": 5, "mensuration": 5, "data interpretation": 5,
      "trigonometry": 5, "algebra": 4, "profit and loss": 4,
      "profit & loss": 4, "percentage": 4, "ratio": 4,
      "time and work": 4, "time speed": 4, "time & work": 4,
      "average": 3, "number system": 3, "simplification": 3,
      "simple interest": 3, "compound interest": 3, "si ci": 3,
      "mixture": 3, "alligation": 3, "partnership": 3,
      "boat": 3, "stream": 3, "train": 3,
      "height and distance": 3, "coordinate geometry": 2,
      "probability": 2, "permutation": 2, "logarithm": 2,
      "power indices": 2, "lcm": 2, "hcf": 2, "digit sum": 2,
      "calculation": 2, "statistics": 3, "sequence and series": 3,
      "ages": 3, "discount": 3, "pipe": 2, "cistern": 2,
      // Reasoning
      "analogy": 5, "classification": 5, "coding-decoding": 5,
      "coding decoding": 5, "series": 5, "blood relation": 4,
      "syllogism": 4, "direction": 4, "seating arrangement": 4,
      "puzzle": 4, "ranking": 3, "missing number": 3,
      "mirror": 3, "water image": 3, "paper cutting": 2,
      "paper folding": 2, "figure matrix": 2, "embedded figure": 2,
      "dice": 3, "cube": 3, "mathematical operation": 3,
      "arithmetic reasoning": 3, "statement": 3, "venn diagram": 3,
      "odd one out": 3, "non-verbal": 3, "logical sequence": 2,
      "word formation": 2, "alphabet": 3, "data sufficiency": 3,
      "inequality": 4, "machine input": 2, "cause and effect": 2,
      "assertion": 2, "theme detection": 2, "hidden figure": 2,
      "counting figure": 2, "complete figure": 2,
      // English
      "cloze test": 5, "cloze": 5, "reading comprehension": 5,
      "error detection": 5, "error spotting": 5, "spotting errors": 5,
      "sentence improvement": 4, "synonyms": 4, "antonyms": 4,
      "idioms": 4, "one word substitution": 4,
      "fill in the blanks": 3, "para jumbles": 3, "spelling": 3,
      "narration": 3, "active passive": 3, "voice": 3,
      "direct-indirect": 3, "sentence completion": 3,
      "selecting the correct sentences": 3, "paronyms": 2,
      "homonyms": 2, "foreign words": 2, "contractions": 2,
      "punctuation": 2, "question tags": 2, "word correction": 2,
      "sentence rearrangement": 3,
      // GA
      "current affairs": 5, "history": 4, "polity": 4,
      "geography": 3, "economy": 4, "general science": 5,
      "biology": 4, "chemistry": 4, "physics": 4,
      "static gk": 4, "art and culture": 3, "computer": 3,
      "schemes": 3, "awards": 3, "books": 3, "sports": 3,
      "important days": 3, "organisations": 3, "national parks": 2,
      "environment": 2, "defence": 2
    },

    // ========== SSC CHSL ==========
    "CHSL": {
      "percentage": 5, "profit and loss": 5, "ratio": 5,
      "arithmetic": 5, "algebra": 4, "geometry": 4,
      "mensuration": 4, "data interpretation": 4,
      "trigonometry": 4, "average": 3, "time and work": 3,
      "time speed": 3, "number system": 3, "simplification": 3,
      "simple interest": 2, "compound interest": 2, "si ci": 2,
      "mixture": 2, "alligation": 2, "partnership": 2,
      "boat": 2, "stream": 2, "train": 2, "height and distance": 2,
      "coordinate geometry": 1, "probability": 1,
      "permutation": 1, "logarithm": 1, "lcm": 2, "hcf": 2,
      "ages": 2, "statistics": 2, "pipe": 1, "cistern": 1,
      "analogy": 5, "series": 5, "coding-decoding": 4,
      "coding decoding": 4, "classification": 4,
      "non-verbal": 4, "blood relation": 3, "syllogism": 3,
      "direction": 3, "mirror": 3, "water image": 3,
      "ranking": 2, "missing number": 2, "paper cutting": 2,
      "paper folding": 2, "figure matrix": 2, "embedded figure": 2,
      "seating arrangement": 2, "puzzle": 2, "dice": 2, "cube": 2,
      "mathematical operation": 2, "arithmetic reasoning": 2,
      "statement": 2, "venn diagram": 2, "odd one out": 2,
      "alphabet": 2, "data sufficiency": 2, "inequality": 3,
      "word formation": 1, "logical sequence": 1,
      "cloze test": 5, "cloze": 5, "error spotting": 4,
      "spotting errors": 4, "sentence improvement": 4,
      "synonyms": 3, "antonyms": 3, "idioms": 3,
      "one word substitution": 3, "fill in the blanks": 3,
      "para jumbles": 2, "spelling": 2, "narration": 2,
      "active passive": 2, "voice": 2, "direct-indirect": 2,
      "reading comprehension": 3, "sentence completion": 2,
      "history": 4, "polity": 4, "current affairs": 4,
      "geography": 3, "general science": 4, "economy": 3,
      "biology": 3, "chemistry": 3, "physics": 3,
      "static gk": 3, "art and culture": 2, "computer": 2,
      "schemes": 2, "awards": 2, "books": 2, "sports": 2,
      "important days": 2, "organisations": 2,
      "environment": 2, "defence": 2, "national parks": 1
    },

    // ========== IB ACIO ==========
    "IB ACIO": {
      "puzzle": 5, "seating arrangement": 5, "series": 4,
      "analogy": 4, "coding-decoding": 4, "coding decoding": 4,
      "blood relation": 3, "syllogism": 3, "direction": 3,
      "classification": 3, "non-verbal": 3, "mirror": 2,
      "water image": 2, "ranking": 2, "data sufficiency": 3,
      "inequality": 3, "missing number": 2, "mathematical operation": 2,
      "critical reasoning": 3, "arithmetic": 5, "percentage": 4,
      "profit and loss": 4, "ratio": 4, "average": 4,
      "time and work": 4, "time speed": 4, "train": 4,
      "boat": 3, "stream": 3, "simple interest": 3,
      "compound interest": 3, "number system": 3,
      "simplification": 3, "algebra": 3, "geometry": 3,
      "mensuration": 3, "data interpretation": 3,
      "mixture": 2, "alligation": 2, "partnership": 2,
      "ages": 2, "probability": 2, "permutation": 2,
      "reading comprehension": 5, "grammar": 4, "vocabulary": 4,
      "error spotting": 4, "cloze test": 3, "idioms": 3,
      "synonyms": 3, "antonyms": 3, "fill in the blanks": 3,
      "sentence improvement": 3, "one word substitution": 2,
      "spelling": 2, "para jumbles": 2, "narration": 2,
      "polity": 5, "history": 4, "geography": 4, "economy": 3,
      "static gk": 3, "art and culture": 3, "general science": 3,
      "current affairs": 3, "constitution": 4, "schemes": 3,
      "defence": 3, "national parks": 2, "environment": 2
    },

    // ========== RBI GRADE B ==========
    "RBI GRADE B": {
      // Phase 1
      "current affairs": 5, "general awareness": 5,
      "data interpretation": 5, "puzzle": 5, "seating arrangement": 5,
      "reading comprehension": 4, "grammar": 4, "vocabulary": 4,
      "arithmetic": 4, "algebra": 3, "geometry": 3,
      "simple interest": 3, "compound interest": 3,
      "ratio": 3, "percentage": 3, "profit and loss": 3,
      "time and work": 3, "time speed": 3, "number system": 3,
      "inequality": 3, "blood relation": 3, "syllogism": 2,
      "coding-decoding": 2, "direction": 2, "ranking": 2,
      "cloze test": 3, "error spotting": 3, "sentence improvement": 3,
      "banking awareness": 4, "rbi news": 4, "critical reasoning": 3,
      "input output": 3, "data sufficiency": 3,
      // Phase 2 — Management
      "motivation": 5, "leadership": 5, "communication": 4,
      "general management": 4, "organisational behaviour": 4,
      "personality and perception": 4, "emotional intelligence": 4,
      "conflict": 4, "organisational change": 4,
      "corporate governance": 4, "ethics": 4,
      // Phase 2 — Finance
      "financial risk management": 5, "rbi and its functions": 4,
      "banking system": 4, "financial institution": 4,
      "financial inclusion": 4, "non-banking": 4,
      "forex market": 4, "equity market": 4, "debt market": 4,
      "derivatives": 4, "bonds": 4, "alternative sources": 3,
      "digital payment": 4, "role of it in banking": 4,
      "global financial system": 3, "public private partnership": 3,
      "introduction to basics of accounting": 3,
      "financial statement": 4, "income statement": 4,
      "balance sheet": 4, "cash flow": 4, "ratio analysis": 4,
      "inflation": 4, "time value of money": 4,
      // Phase 2 — ESI
      "measurement of growth": 4, "economic history of india": 4,
      "fiscal policy": 4, "monetary policy": 4,
      "opening up of the indian economy": 4,
      "balance of payments": 4, "international economic institutions": 4,
      "regional economic cooperation": 3, "industrial and labour policy": 3,
      "indian agriculture": 3, "export import policy": 3,
      "international economic issues": 4, "poverty alleviation": 4,
      "sustainable development": 4, "social issues": 3,
      "multiculturalism": 3, "demographic trends": 3,
      "urbanisation": 3, "gender issues": 3, "social justice": 3,
      "union budget": 4, "economic survey": 4,
      "public finance": 4, "fringe topics": 2,
      // Phase 2 — Descriptive English
      "essay writing": 4, "precis writing": 4,
      "reading comprehension": 4, "descriptive writing": 4
    },

    // ========== NABARD GRADE A ==========
    "NABARD GRADE A": {
      "agronomy": 5, "crop production": 5, "soil": 5,
      "water conservation": 4, "irrigation": 4,
      "animal husbandry": 4, "fisheries": 3, "forestry": 3,
      "horticulture": 3, "agriculture extension": 3,
      "climate change": 4, "indian agriculture": 5,
      "rural development": 5, "panchayati raj": 4,
      "mgnrega": 4, "farm machinery": 3,
      "agriculture marketing": 4, "food security": 4,
      "agri reports": 4, "agri census": 3, "livestock census": 3,
      "agriculture economy": 5, "dairy": 4, "poultry": 4,
      "seed science": 3, "meteorology": 3,
      "financial inclusion": 5, "banking rural credit": 5,
      "education": 4, "health": 4, "gender": 4, "demography": 4,
      "poverty": 4, "employment": 4, "livelihood": 4,
      "social protection": 4, "governance": 3, "rights": 3,
      "msme": 3, "industry": 3, "infrastructure": 3,
      "entrepreneurship": 3, "macro economy": 3,
      "budget": 3, "public finance": 3, "trade": 2,
      "globalisation": 2, "international institutions": 2,
      "puzzle": 4, "seating arrangement": 4, "series": 4,
      "coding-decoding": 3, "blood relation": 3,
      "data interpretation": 4, "arithmetic": 4,
      "percentage": 3, "ratio": 3, "profit and loss": 3,
      "reading comprehension": 4, "grammar": 3,
      "cloze test": 3, "error spotting": 3,
      "current affairs": 5, "banking awareness": 3,
      "financial awareness": 3, "static gk": 3
    },

    // ========== SBI PO ==========
    "SBI PO": {
      "puzzle": 5, "seating arrangement": 5, "data interpretation": 5,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 3, "time speed": 3,
      "simple interest": 3, "compound interest": 3,
      "number series": 4, "quadratic": 4, "simplification": 3,
      "reading comprehension": 5, "cloze test": 4,
      "error spotting": 3, "fill in the blanks": 3,
      "para jumbles": 3, "vocabulary": 3, "grammar": 3,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "blood relation": 3, "direction": 3, "ranking": 2,
      "banking awareness": 5, "current affairs": 5,
      "general awareness": 4, "static gk": 3
    },

    // ========== IBPS PO ==========
    "IBPS PO": {
      "puzzle": 5, "seating arrangement": 5, "data interpretation": 5,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 3, "time speed": 3,
      "simple interest": 3, "compound interest": 3,
      "number series": 4, "quadratic": 4, "simplification": 3,
      "reading comprehension": 5, "cloze test": 4,
      "error spotting": 3, "fill in the blanks": 3,
      "para jumbles": 3, "vocabulary": 3, "grammar": 3,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "blood relation": 3, "direction": 3, "ranking": 2,
      "banking awareness": 5, "current affairs": 5,
      "general awareness": 4, "static gk": 3
    },

    // ========== IBPS CLERK ==========
    "IBPS CLERK": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "direction": 2, "blood relation": 3, "alphanumeric": 4,
      "number series": 3, "order ranking": 2,
      "simplification": 5, "data interpretation": 4,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "reading comprehension": 5,
      "cloze test": 4, "error detection": 3,
      "fill in the blanks": 3, "para jumbles": 3,
      "vocabulary": 3, "grammar": 3, "spelling": 2,
      "current affairs": 3, "banking awareness": 3, "static gk": 2
    },

    // ========== SBI CLERK (Junior Associate) ==========
    "SBI CLERK": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 3, "coding-decoding": 4,
      "alphanumeric": 4, "direction": 2, "blood relation": 2,
      "order ranking": 2, "number series": 3,
      "simplification": 5, "data interpretation": 4,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "reading comprehension": 4,
      "cloze test": 4, "error detection": 3,
      "fill in the blanks": 3, "para jumbles": 3,
      "vocabulary": 3, "grammar": 3,
      "current affairs": 3, "banking awareness": 3, "static gk": 2
    },

    // ========== IBPS RRB PO (Officer Scale I) ==========
    "RRB PO": {
      "puzzle": 5, "seating arrangement": 5,
      "inequality": 3, "direction": 3, "coding-decoding": 3,
      "syllogism": 3, "blood relation": 3, "alphanumeric": 3,
      "arithmetic": 5, "data interpretation": 4,
      "number series": 3, "simplification": 4,
      "quadratic": 3, "percentage": 3, "ratio": 3,
      "profit and loss": 3, "time and work": 3, "time speed": 3,
      "simple interest": 2, "compound interest": 2,
      "reading comprehension": 3, "cloze test": 3,
      "error detection": 2, "fill in the blanks": 2,
      "current affairs": 4, "banking awareness": 3, "static gk": 3
    },

    // ========== IBPS RRB OFFICE ASSISTANT (Clerk) ==========
    "RRB CLERK": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 4, "coding-decoding": 3,
      "direction": 2, "blood relation": 2, "alphanumeric": 5,
      "number series": 3, "order ranking": 2,
      "simplification": 5, "data interpretation": 3,
      "arithmetic": 4, "percentage": 3, "ratio": 3,
      "profit and loss": 2, "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "current affairs": 3,
      "banking awareness": 3, "static gk": 2,
      "computer knowledge": 3
    },

    // ========== RBI ASSISTANT ==========
    "RBI ASSISTANT": {
      "puzzle": 5, "seating arrangement": 5,
      "syllogism": 3, "inequality": 3, "coding-decoding": 3,
      "alphanumeric": 4, "direction": 2, "blood relation": 3,
      "number series": 3, "simplification": 5,
      "data interpretation": 4, "arithmetic": 4,
      "percentage": 3, "ratio": 3, "profit and loss": 3,
      "time and work": 2, "time speed": 2,
      "simple interest": 2, "compound interest": 2,
      "quadratic": 2, "reading comprehension": 5,
      "error detection": 3, "fill in the blanks": 3,
      "para jumbles": 3, "cloze test": 3,
      "current affairs": 4, "rbi updates": 4,
      "banking awareness": 4, "computer knowledge": 3
    },

    // ========== RBI GRADE A (similar to Grade B but lighter) ==========
    "RBI GRADE A": {
      "data interpretation": 4, "puzzle": 4,
      "seating arrangement": 4, "reading comprehension": 4,
      "current affairs": 4, "general awareness": 4,
      "arithmetic": 3, "algebra": 3, "geometry": 2,
      "simple interest": 2, "compound interest": 2,
      "ratio": 3, "percentage": 3, "profit and loss": 2,
      "time and work": 2, "time speed": 2, "number system": 2,
      "inequality": 2, "blood relation": 2, "syllogism": 2,
      "coding-decoding": 2, "direction": 2,
      "cloze test": 3, "error spotting": 3,
      "banking awareness": 3, "rbi news": 3,
      "economic issues": 4, "social issues": 3,
      "finance management": 4, "descriptive english": 3
    }
  };

  // ---- EXAM PROXIMITY ----
  function examProximity(daysAway) {
    if (daysAway < 0) return 0.3;
    if (daysAway <= 7) return 1.0;
    if (daysAway <= 14) return 0.95;
    if (daysAway <= 30) return 0.85;
    if (daysAway <= 60) return 0.70;
    if (daysAway <= 90) return 0.55;
    if (daysAway <= 180) return 0.35;
    if (daysAway <= 365) return 0.20;
    return 0.10;
  }

  // ---- WEIGHTAGE RESOLUTION ----
  function getTopicWeightage(topic, exam) {
    if (!topic || !exam) return 2;
    if (topic.weightageByExam && topic.weightageByExam[exam]) {
      return topic.weightageByExam[exam];
    }
    var db = WEIGHTAGE_DB[exam];
    if (!db) return 2;
    var name = (topic.topic || "").toLowerCase();
    var subj = (topic.subject || "").toLowerCase();
    var bestMatch = null, bestLen = 0;
    for (var key in db) {
      if (name.indexOf(key) > -1 || subj.indexOf(key) > -1) {
        if (key.length > bestLen) { bestLen = key.length; bestMatch = key; }
      }
    }
    return bestMatch ? db[bestMatch] : 2;
  }

  // ---- COMPUTED PRIORITY ----
  function computeTopicPriority(topic, activeExamTag) {
    if (!topic) return 0;
    var exam = activeExamTag || (typeof getActiveExamTag === "function" ? getActiveExamTag() : "");
    var weight = getTopicWeightage(topic, exam);
    var weightFactor = weight / 5;
    var proximity = 0.5;
    if (exam) {
      var targets = (S.settings && Array.isArray(S.settings.exams)) ? S.settings.exams : [];
      var matching = targets.filter(function(x) {
        return x.date && x.examTag &&
               String(x.examTag).toLowerCase() === String(exam).toLowerCase();
      });
      if (matching.length) {
        var nearest = matching.reduce(function(a, b) {
          var da = Math.abs(diffD(a.date, todayISO()));
          var db = Math.abs(diffD(b.date, todayISO()));
          return da < db ? a : b;
        });
        proximity = examProximity(diffD(nearest.date, todayISO()));
      }
    }
    var statusMap = { "Not started": 1.0, "Learning": 0.9, "Practicing": 0.7,
                       "Reviewing": 0.5, "Mastered": 0.15 };
    var gap = statusMap[topic.status] || 0.8;
    return Math.round(weightFactor * proximity * gap * 100);
  }

  window.getTopicWeightage = getTopicWeightage;
  window.computeTopicPriority = computeTopicPriority;
  window.examProximity = examProximity;
  window.APEX_WEIGHTAGE_DB = WEIGHTAGE_DB;

  // ---- OVERRIDE weaknessScore ----
  var _origWeaknessScore = window.weaknessScore;
  if (typeof _origWeaknessScore === "function") {
    window.weaknessScore = function(t, examTag) {
      var origScore = _origWeaknessScore(t, examTag);
      if (origScore === 0) return 0;
      var now = todayISO();
      var cutoff30 = addDays(now, -30);
      var errs = S.errors.filter(function(e) { return e.topicId === t.id; });
      var recentErrs = errs.filter(function(e) { return e.date && e.date >= cutoff30; }).length;
      var olderErrs = errs.length - recentErrs;
      var mocks = S.mocks.filter(function(m) { return (m.weak || []).indexOf(t.id) > -1; });
      var recentMocks = mocks.filter(function(m) { return m.date && m.date >= cutoff30; }).length;
      var olderMocks = mocks.length - recentMocks;
      var sess = S.sessions.filter(function(s) { return s.topicId === t.id; });
      var again = 0, hard = 0, good = 0, easy = 0;
      sess.forEach(function(s) {
        (s.history || []).forEach(function(h) {
          if (h.grade === "again") again++;
          else if (h.grade === "hard") hard++;
          else if (h.grade === "good") good++;
          else if (h.grade === "easy") easy++;
        });
      });
      var friction = recentErrs * 12 + olderErrs * 4
                   + recentMocks * 18 + olderMocks * 7
                   + again * 20 + hard * 8 - good * 3 - easy * 6;
      if (friction <= 0) return 0;
      var computedPriority = computeTopicPriority(t, examTag);
      var priorityFactor = computedPriority / 100;
      var bias = (typeof sectionBiasForSubject === "function")
        ? sectionBiasForSubject(t.subject, examTag) : 1.0;
      return Math.max(0, Math.round(friction * priorityFactor * bias * 2));
    };
  }

  console.log("[apex-exam-intel] v2 — " + Object.keys(WEIGHTAGE_DB).length +
    " exams, " + Object.keys(WEIGHTAGE_DB["CGL"] || {}).length + " CGL topics, " +
    Object.keys(WEIGHTAGE_DB["RBI GRADE B"] || {}).length + " RBI topics");
})();
