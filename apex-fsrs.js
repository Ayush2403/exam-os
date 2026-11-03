/* ============================================================
   APEX FSRS ENGINE (Free Spaced Repetition Scheduler)
   ============================================================ */
(function(){
  if (window._apexFSRS) return;
  window._apexFSRS = true;

  // Standard FSRS-4.5 default weights
  const w = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
  
  const DECAY = -0.5;
  const FACTOR = 19 / 81;

  // Calculate retrievability
  function retrievability(elapsed_days, stability) {
    if (stability <= 0) return 0;
    return Math.pow(1 + FACTOR * elapsed_days / stability, DECAY);
  }

  // Calculate next interval based on desired retention (90%)
  function next_interval(stability) {
    const desired_retention = 0.9;
    return Math.min(Math.max(Math.round(stability / FACTOR * (Math.pow(desired_retention, 1 / DECAY) - 1)), 1), 36500);
  }

  // Calculate initial stability and difficulty
  function init_ds(rating) {
    return {
      stability: w[rating - 1],
      difficulty: Math.min(Math.max(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1), 10)
    };
  }

  // Calculate next stability and difficulty
  function next_ds(d, s, r, rating) {
    const next_d = Math.min(Math.max(d - w[6] * (rating - 3), 1), 10);
    
    let next_s;
    if (rating === 1) {
      next_s = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
    } else {
      const hard_penalty = rating === 2 ? w[15] : 1;
      const easy_bonus = rating === 4 ? w[16] : 1;
      next_s = s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * hard_penalty * easy_bonus);
    }
    
    return {
      stability: next_s,
      difficulty: next_d
    };
  }

  // Map Apex's string grades to FSRS integer ratings
  function mapGrade(grade) {
    if (grade === 'again') return 1;
    if (grade === 'hard') return 2;
    if (grade === 'good') return 3;
    if (grade === 'easy') return 4;
    return 3; // Default to good
  }

  // Expose the calculate function to the app
  window.fsrsCalculate = function(s, grade) {
    const rating = mapGrade(grade);
    const now = new Date();
    
    // Check if it's a new card (no history or explicit state 1)
    if (!s.history || s.history.length === 0 || !s.fsrs_stability) {
      const init = init_ds(rating);
      return {
        interval: next_interval(init.stability),
        stability: init.stability,
        difficulty: init.difficulty
      };
    }

    // It's an existing card
    const lastDate = s.history[s.history.length - 1].date;
    const elapsed_days = Math.max(0, Math.round((now - new Date(lastDate)) / (1000 * 60 * 60 * 24)));
    const r = retrievability(elapsed_days, s.fsrs_stability);
    
    const ds = next_ds(s.fsrs_difficulty, s.fsrs_stability, r, rating);
    
    return {
      interval: next_interval(ds.stability),
      stability: ds.stability,
      difficulty: ds.difficulty
    };
  };

  console.log("[apex-fsrs] Engine installed");
})();