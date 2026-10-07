/* ============================================================
   APEX READINESS POLISH v1
   1. Replaces "Not achievable" with action-oriented guidance
   2. Adds a "why is this number low?" explanation under the
      composite when it's below 30%
   3. Rewrites the Syllabus Projection block so it always
      reflects the actual scope:
        - matching exam target → correct topic count + D-Day
        - no matching target → "Add a target" prompt
   Runs as a post-render DOM patch, immune to function overrides.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexReadinessPolish) return;
  window._apexReadinessPolish = true;

  function polishCard(){
    var card = document.querySelector('.ready-card');
    if (!card) return;
    var scopeTag = (typeof window.getActiveExamTag === 'function')
      ? window.getActiveExamTag()
      : '';

    /* ---------- 1. Softer messaging ---------- */
    card.querySelectorAll('.ready-legend').forEach(function(el){
      var b = el.querySelector('b, strong');
      if (b && /Not achievable/i.test(b.textContent)) {
        b.textContent = 'Focus Critical topics';
        b.style.color = 'var(--pri-medium-fg)';
      }
    });

    /* ---------- 2. Explanation under composite ---------- */
    var head = card.querySelector('.ready-head');
    if (head && !card.querySelector('[data-apex-expl]')) {
      var pctEl = head.querySelector('.ready-pct');
      if (pctEl) {
        var pctNum = parseInt((pctEl.textContent || '').replace(/[^\d]/g, ''), 10);
        if (!isNaN(pctNum) && pctNum < 30) {
          var expl = document.createElement('div');
          expl.setAttribute('data-apex-expl', '1');
          expl.className = 'tiny';
          expl.style.cssText = 'margin-top:8px;padding:10px 14px;border-left:2px solid var(--accent-2);background:rgba(125,211,252,.04);border-radius:0 8px 8px 0;line-height:1.6;color:var(--text-2);max-width:640px';
          expl.innerHTML = '<b style="color:var(--text)">Why this number is low:</b> Apex weights mastery at 30% and coverage at 15% — both are near zero right now, so the composite is dominated by those. The score climbs the moment you start logging sessions and rating reviews.';
          head.parentNode.insertBefore(expl, head.nextSibling);
        }
      }
    }

    /* ---------- 3. Fix the projection block ---------- */
    var target = null;
    if (scopeTag) {
      var targets = (S.settings.exams || []).filter(function(x){
        return x.date && x.examTag &&
          String(x.examTag).toLowerCase() === String(scopeTag).toLowerCase();
      });
      target = targets[0];
    }

    // Locate the projection block by finding the "Syllabus projection" label
    var projLabel = null;
    card.querySelectorAll('.tiny').forEach(function(el){
      if (!projLabel && /^Syllabus projection$/i.test((el.textContent || '').trim())) {
        projLabel = el;
      }
    });
    var projBlock = projLabel ? projLabel.parentElement : null;
    if (!projBlock) return;

    // Idempotence marker: skip if we've already written this exact state
    var marker = (scopeTag || '') + '::' + (target ? target.label + '::' + target.date : 'no-target');
    if (projBlock.getAttribute('data-polish-marker') === marker) return;

    if (!target) {
      projBlock.innerHTML =
        '<div class="tiny" style="font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-bottom:8px">Syllabus projection</div>' +
        '<div style="padding:14px;border:1px dashed var(--border-2);border-radius:8px;font-size:12.5px;line-height:1.6;color:var(--text-2);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
          '<span>No exam date set for <b style="color:var(--accent-2)">' + esc(scopeTag || 'this scope') + '</b>. Add a target to unlock the D-Day projection.</span>' +
          '<button class="btn sm" data-action="open-exams-manager">Add target →</button>' +
        '</div>';
      projBlock.setAttribute('data-polish-marker', marker);
      return;
    }

    var scopedTopics = S.syllabus.filter(function(t){
      return !t.archived && !hasKids(t.id) && _tagMatchesTopic(t, scopeTag);
    });
    var total = scopedTopics.length;
    var mastered = scopedTopics.filter(function(t){ return isTopicMastered(t); }).length;
    var days = diffD(target.date, todayISO());
    var masteredPct = total ? Math.round(mastered / total * 100) : 0;

    projBlock.innerHTML =
      '<div class="tiny" style="font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-bottom:8px">Syllabus projection</div>' +
      '<div class="ready-legend" style="margin-bottom:8px">' +
        '<span><b>' + mastered + '</b> / ' + total + ' mastered</span>' +
        '<span>D-' + days + ' · ' + esc(target.label) + '</span>' +
      '</div>' +
      '<div class="ready-bar"><div class="ready-fill" style="width:' + masteredPct + '%"></div></div>' +
      '<div class="ready-legend" style="margin-top:6px">' +
        '<span>Projected <b>' + masteredPct + '%</b> at D-Day</span>' +
        '<span>' + (total - mastered) + ' topic' + ((total - mastered) === 1 ? '' : 's') + ' remaining</span>' +
      '</div>';

    projBlock.setAttribute('data-polish-marker', marker);
  }

  /* ---- Trigger on every render + poll ---- */
  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){ setTimeout(polishCard, 40); });
    }).observe(view, { childList: true, subtree: true });
  }
  window.addEventListener('hashchange', function(){
    setTimeout(polishCard, 80);
    setTimeout(polishCard, 400);
  });
  setInterval(polishCard, 1000);
  setTimeout(polishCard, 150);
  setTimeout(polishCard, 700);

  console.log('[apex-readiness-polish] installed');
})();