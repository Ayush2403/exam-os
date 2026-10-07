/* ============================================================
   APEX READINESS FIX v3 — brute-force DOM rewrite
   Doesn't try to override readinessHTML. Instead watches the
   DOM and rewrites the chips after every render. Immune to
   function-scope resolution, load-order, and other overrides.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexReadinessFixV3) return;
  window._apexReadinessFixV3 = true;
  window._apexReadinessFixV2 = true;
  window._apexReadinessFix = true;

  function allRelevantExams(){
    var set = [];
    (S.settings.exams || []).forEach(function(x){
      if (x.examTag && set.indexOf(x.examTag) === -1) set.push(x.examTag);
    });
    (S.tax.exams || []).forEach(function(e){
      if (set.indexOf(e) !== -1) return;
      var has = S.syllabus.some(function(t){
        return !t.archived && Array.isArray(t.exams) && t.exams.indexOf(e) > -1;
      });
      if (has) set.push(e);
    });
    return set;
  }

  function statsFor(tag){
    var ids = S.syllabus.filter(function(t){
      return !t.archived && Array.isArray(t.exams) && t.exams.indexOf(tag) > -1;
    }).map(function(t){ return t.id; });
    return {
      topics: ids.length,
      sessions: S.sessions.filter(function(s){ return ids.indexOf(s.topicId) > -1; }).length,
      errors: S.errors.filter(function(e){ return ids.indexOf(e.topicId) > -1; }).length,
      mocks: S.mocks.filter(function(m){
        return (m.weak || []).some(function(w){ return ids.indexOf(w) > -1; });
      }).length
    };
  }

  function tooltipFor(tag){
    var st = statsFor(tag);
    var target = (S.settings.exams || []).filter(function(x){
      return x.date && x.examTag && String(x.examTag).toLowerCase() === String(tag).toLowerCase();
    })[0];
    var dTxt = target ? ('D-' + diffD(target.date, todayISO()) + ' · ' + target.label) : 'No target date';
    if (!st.topics) {
      return 'No topics tagged for ' + tag + ' yet\n· ' + dTxt;
    }
    return 'Scope: ' + tag + ' — ' + dTxt + '\n' +
           '· ' + st.topics + ' topics · ' + st.sessions + ' sessions\n' +
           '· ' + st.errors + ' errors · ' + st.mocks + ' mock tags\n' +
           'Click to switch scope';
  }

  function chipHTMLFor(activeTag){
    var exams = allRelevantExams();
    if (!exams.length) return '';
    return '<div class="chips" style="margin-bottom:10px" data-apex-chips="1">'
      + exams.map(function(e){
          var isActive = e === activeTag;
          var st = statsFor(e);
          var star = st.topics === 0 ? '<span style="color:var(--pri-medium-fg);margin-left:4px">*</span>' : '';
          return '<button class="chip' + (isActive ? ' on' : '') + '"'
            + ' data-action="readiness-exam-set" data-id="' + esc(e) + '"'
            + ' title="' + esc(tooltipFor(e)) + '"'
            + ' style="padding:5px 11px;font-size:11.5px;min-height:30px">'
            + esc(e) + ' · ' + st.topics + star
            + '</button>';
        }).join('')
      + '</div>';
  }

  function rewriteChips(){
    var card = document.querySelector('.ready-card');
    if (!card) return;
    var scopeTag = (typeof window.getActiveExamTag === 'function')
      ? window.getActiveExamTag()
      : '';
    var chips = card.querySelector('.chips');
    if (!chips) {
      // No chips exist — inject them
      var head = card.querySelector('.ready-head');
      if (head) head.insertAdjacentHTML('afterend', chipHTMLFor(scopeTag));
      return;
    }
    // Already ours? Skip.
    if (chips.getAttribute('data-apex-chips') === '1') {
      // Still re-sync the "on" highlight
      var want = scopeTag;
      chips.querySelectorAll('.chip').forEach(function(c){
        c.classList.toggle('on', c.getAttribute('data-id') === want);
      });
      return;
    }
    // Replace the old chips with ours
    chips.outerHTML = chipHTMLFor(scopeTag);
  }

  function injectEmptyStateIfMissing(){
    var view = document.getElementById('view');
    if (!view) return;
    // Only when Home is showing
    var hash = (location.hash || '').replace(/^#\/?/, '');
    if (hash !== 'dashboard' && hash !== '') return;
    // Already present?
    if (view.querySelector('.ready-card')) return;
    // Not on a view that should have it
    var evidenceHdr = null;
    view.querySelectorAll('.home-section-label').forEach(function(el){
      if (/evidence/i.test(el.textContent)) evidenceHdr = el;
    });
    if (!evidenceHdr) return;
    var scopeTag = (typeof window.getActiveExamTag === 'function')
      ? window.getActiveExamTag() : '—';
    var target = (S.settings.exams || []).filter(function(x){
      return x.date && x.examTag && String(x.examTag).toLowerCase() === String(scopeTag).toLowerCase();
    })[0];
    var dLine = target ? ('D-' + diffD(target.date, todayISO()) + ' · ' + target.label) : 'no target set';
    var html = '<div class="ready-card behind" style="padding:22px 26px">'
      + '<div class="ready-head" style="margin-bottom:10px">'
      +   '<div>'
      +     '<div class="ready-title">Exam Readiness</div>'
      +     '<div class="ready-sub">Scope: ' + esc(scopeTag) + ' — ' + dLine + '</div>'
      +   '</div>'
      +   '<div class="ready-pct" style="opacity:.35">0<span class="ready-pct-sign">%</span></div>'
      + '</div>'
      + chipHTMLFor(scopeTag)
      + '<div style="padding:18px 4px;text-align:center">'
      +   '<div style="font-size:13.5px;line-height:1.6;color:var(--text-2);margin-bottom:10px">'
      +     '<b style="color:var(--text)">No topics tagged for ' + esc(scopeTag) + '.</b>'
      +   '</div>'
      +   '<div class="tiny" style="line-height:1.55;margin-bottom:14px">'
      +     'Use the tag fixer to bulk-tag topics for this exam.'
      +   '</div>'
      +   '<button class="btn sm primary" data-action="fix-tags">Fix exam tags →</button>'
      +   ' <button class="btn sm" data-action="open-exams-manager">Manage targets</button>'
      + '</div>'
      + '<div class="tiny" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);opacity:.7">'
      +   '<b style="color:var(--pri-medium-fg)">*</b> = no topics tagged yet'
      + '</div>'
      + '</div>';
    evidenceHdr.insertAdjacentHTML('afterend', html);
  }

  function tick(){
    rewriteChips();
    injectEmptyStateIfMissing();
  }

  // Fire on every DOM change in #view
  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }).observe(view, { childList: true, subtree: true });
  }

  // And on route change
  window.addEventListener('hashchange', function(){
    setTimeout(tick, 60);
    setTimeout(tick, 250);
  });

  // And periodically
  setInterval(tick, 800);

  // And immediately
  setTimeout(tick, 100);
  setTimeout(tick, 600);

  console.log('[apex-readiness-fix] v3 installed — brute-force DOM rewrite');
})();