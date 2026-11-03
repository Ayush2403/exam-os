/* ============================================================
   APEX SMART QUICK LOG (One-Tap Suggestions)
   ============================================================ */
(function(){
  if (window._apexQuickLogSmart) return;
  window._apexQuickLogSmart = true;

  function renderSuggestions() {
    const quicklog = document.querySelector('.quicklog');
    if (!quicklog) return;
    if (document.getElementById('smart-ql-suggestions')) return;

    // Get 3 most recent unique topics studied
    const recentTopics = [];
    const seen = new Set();
    for (let i = S.sessions.length - 1; i >= 0; i--) {
      const s = S.sessions[i];
      if (s.topicId && !seen.has(s.topicId)) {
        seen.add(s.topicId);
        const t = topicById(s.topicId);
        if (t) recentTopics.push(t);
        if (recentTopics.length === 3) break;
      }
    }

    if (recentTopics.length === 0) return;

    const wrap = document.createElement('div');
    wrap.id = 'smart-ql-suggestions';
    wrap.style.cssText = 'display:flex;gap:6px;margin-top:-8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;';
    
    const label = document.createElement('span');
    label.className = 'tiny';
    label.style.cssText = 'font-family:JetBrains Mono,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-right:4px;';
    label.textContent = 'Recent:';
    wrap.appendChild(label);

    recentTopics.forEach(t => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.style.cssText = 'padding:4px 10px;min-height:28px;font-size:11px;cursor:pointer;';
      chip.innerHTML = '<i class="dot" style="background:'+subjColor(t.subject)+'"></i> ' + esc(t.topic);
      chip.onclick = (e) => {
        e.preventDefault();
        const inp = document.querySelector('[data-quicklog-input]');
        if (inp) {
          inp.value = t.topic + ' ';
          inp.focus();
        }
      };
      wrap.appendChild(chip);
    });

    quicklog.parentNode.insertBefore(wrap, quicklog.nextSibling);
  }

  // Hook into the app's render loop
  const _origRender = window.renderRoute;
  window.renderRoute = function() {
    const res = _origRender.apply(this, arguments);
    setTimeout(renderSuggestions, 100);
    return res;
  };
  try { renderRoute = window.renderRoute; } catch(e){}

  setTimeout(renderSuggestions, 500);
  console.log('[apex-quicklog-smart] installed');
})();