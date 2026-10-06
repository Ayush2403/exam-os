/* ============================================================
   APEX KATEX FIX v2
   Fixes LaTeX rendering for \(...\), \[...\], and $$...$$
   Also fixes the mobile overflow leak in error cards.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexKatexFix) return;
  window._apexKatexFix = true;

  window.renderMath = function(str){
    if (!str) return "";
    if (!window.katex) return esc(str);
    var src = String(str);
    var cacheKey = "katex::" + src;

    if (!window._katexCache) window._katexCache = new Map();
    if (window._katexCache.has(cacheKey)) return window._katexCache.get(cacheKey);

    var out = [];
    var pattern = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
    var last = 0, m;
    while ((m = pattern.exec(src)) !== null) {
      if (m.index > last) out.push(esc(src.slice(last, m.index)));
      var expr = (m[1] || m[2] || m[3]).trim();
      var isDisplay = !!(m[1] || m[2]);
      try {
        out.push(window.katex.renderToString(expr, {
          displayMode: isDisplay,
          throwOnError: false,
          output: "html"
        }));
      } catch (e) {
        out.push(esc(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < src.length) out.push(esc(src.slice(last)));

    var result = out.join("");
    window._katexCache.set(cacheKey, result);
    if (window._katexCache.size > 400) {
      var firstKey = window._katexCache.keys().next().value;
      window._katexCache.delete(firstKey);
    }
    return result;
  };

  var style = document.createElement('style');
  style.id = 'apex-katex-fix-style';
  style.textContent = [
    '.err-detail .katex-display,',
    '.sess-notes-body .katex-display,',
    '.sess-notes .katex-display {',
    '  overflow-x: auto;',
    '  overflow-y: hidden;',
    '  max-width: 100%;',
    '  padding: 4px 0;',
    '  -webkit-overflow-scrolling: touch;',
    '  scrollbar-width: thin;',
    '}',
    '.err-detail .katex,',
    '.sess-notes-body .katex { max-width: 100%; }',
    '.err-detail,',
    '.err-detail > div,',
    '.err-detail > div > div:last-child {',
    '  min-width: 0;',
    '  max-width: 100%;',
    '  overflow-wrap: anywhere;',
    '  word-break: break-word;',
    '}',
    '.sess-card .err-detail { overflow-x: hidden; }',
    '.card[data-id],',
    '.sess-card[data-id] {',
    '  min-width: 0;',
    '  max-width: 100%;',
    '  overflow-x: hidden;',
    '}',
    '@media (max-width: 860px) {',
    '  .err-detail .katex-display { font-size: .92em; }',
    '  .err-detail > div > div:last-child { white-space: normal; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  function rerenderErrorMath() {
    var list = document.getElementById('err-list');
    if (!list) return;
    list.querySelectorAll('.err-detail > div > div:last-child').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    list.querySelectorAll('.row-item .t').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw);
        el.dataset.katexDone = '1';
      }
    });
  }

  function rerenderSessMath() {
    var list = document.getElementById('sess-list');
    if (!list) return;
    // Review-card study notes
    list.querySelectorAll('.sess-notes-body').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    // Embedded error details inside review cards
    list.querySelectorAll('.err-detail > div > div:last-child').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    // Review card titles that contain math
    list.querySelectorAll('.sess-name').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw);
        el.dataset.katexDone = '1';
      }
    });
  }

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){
        rerenderErrorMath();
        rerenderSessMath();
      });
    }).observe(view, { childList: true, subtree: true });
  }

  setTimeout(function(){ rerenderErrorMath(); rerenderSessMath(); }, 400);
  setTimeout(function(){ rerenderErrorMath(); rerenderSessMath(); }, 1200);
  setTimeout(function(){ rerenderErrorMath(); rerenderSessMath(); }, 2500);

  var _origEdit = window.edit;
  if (typeof _origEdit === 'function') {
    window.edit = function(){
      if (window._katexCache) window._katexCache.clear();
      return _origEdit.apply(this, arguments);
    };
    try { edit = window.edit; } catch(e){}
  }

  console.log('[apex-katex-fix] installed');
})();
