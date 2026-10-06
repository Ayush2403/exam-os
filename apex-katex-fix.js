/* ============================================================
   APEX KATEX FIX v3
   - Renders \(...\), \[...\], and $$...$$ as KaTeX
   - Contains inline math (no horizontal page bleed)
   - Handles both Errors and Reviews cards
   ============================================================ */
(function(){
  'use strict';
  if (window._apexKatexFix) return;
  window._apexKatexFix = true;

  /* ---- renderMath ---- */
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

  /* ---- CSS: containment for inline and display math ---- */
  var style = document.createElement('style');
  style.id = 'apex-katex-fix-style';
  style.textContent = [
    /* Inline KaTeX: allow scroll within the card, never expand the page */
    '.err-detail .katex,',
    '.err-detail .katex-html,',
    '.sess-notes-body .katex,',
    '.sess-notes-body .katex-html {',
    '  max-width: 100%;',
    '  overflow-x: auto;',
    '  overflow-y: hidden;',
    '  display: inline-block;',
    '  vertical-align: middle;',
    '  scrollbar-width: thin;',
    '}',
    /* Display KaTeX: same containment, block-level */
    '.err-detail .katex-display,',
    '.sess-notes-body .katex-display {',
    '  overflow-x: auto;',
    '  overflow-y: hidden;',
    '  max-width: 100%;',
    '  padding: 4px 0;',
    '  -webkit-overflow-scrolling: touch;',
    '  scrollbar-width: thin;',
    '}',
    /* The wrapping containers must allow wrapping and never grow */
    '.err-detail,',
    '.err-detail > div,',
    '.err-detail > div > div:last-child,',
    '.sess-notes-body {',
    '  min-width: 0;',
    '  max-width: 100%;',
    '  overflow-wrap: anywhere;',
    '  word-break: break-word;',
    '  white-space: normal;',
    '}',
    /* Card shells: clip anything that escapes */
    '.card[data-id],',
    '.sess-card[data-id],',
    '.sess-card .err-detail {',
    '  min-width: 0;',
    '  max-width: 100%;',
    '  overflow-x: hidden;',
    '}',
    '@media (max-width: 860px) {',
    '  .err-detail .katex-display { font-size: .92em; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  /* ---- Re-render math in error cards ---- */
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

  /* ---- Re-render math in review cards ---- */
  function rerenderSessMath() {
    var list = document.getElementById('sess-list');
    if (!list) return;
    list.querySelectorAll('.sess-notes-body').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    list.querySelectorAll('.err-detail > div > div:last-child').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('\\[') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw).replace(/\n/g, '<br>');
        el.dataset.katexDone = '1';
      }
    });
    list.querySelectorAll('.sess-name').forEach(function(el){
      if (el.dataset.katexDone === '1') return;
      var raw = el.textContent || '';
      if (raw.indexOf('\\(') > -1 || raw.indexOf('$$') > -1) {
        el.innerHTML = window.renderMath(raw);
        el.dataset.katexDone = '1';
      }
    });
  }

  /* ---- Watch for new cards ---- */
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
