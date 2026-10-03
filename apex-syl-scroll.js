/* ============================================================
   APEX SYLLABUS SCROLL FIX v2
   - Disable scroll anchoring on the real scroll container
   - Override toggle-subj / toggle-topic to restore scrollY directly
   ============================================================ */
(function(){
  'use strict';
  if (window._apexSylScroll) return;
  window._apexSylScroll = true;

  /* ---- 1. CSS: turn off scroll anchoring at the actual scroller ---- */
  var st = document.createElement('style');
  st.textContent = [
    'html, body{overflow-anchor:none !important}',
    /* Belt and suspenders — some Chrome versions honor scroll-padding on html */
    'html{scroll-padding-top:0}',
    /* The sticky toolbar and exam bar don't need to be anchoring candidates */
    '.toolbar, .apex-active-exam-bar, .apex-stable-bar{overflow-anchor:none}'
  ].join('\n');
  document.head.appendChild(st);

  /* ---- 2. Override the two toggle handlers ---- */
  function registerOverride(){
    if (typeof ACTIONS !== 'object' || !ACTIONS) { setTimeout(registerOverride, 100); return; }

    ACTIONS['toggle-subj'] = function(id, el){
      var group = el ? el.closest('.subj-group') : null;
      if (!group) {
        var y0 = window.scrollY;
        if (typeof sf !== 'undefined' && sf.closed) sf.closed[id] = !sf.closed[id];
        if (typeof saveSF === 'function') saveSF();
        if (typeof renderSylList === 'function') renderSylList();
        window.scrollTo(0, y0);
        requestAnimationFrame(function(){ window.scrollTo(0, y0); });
        return;
      }
      var y = window.scrollY;
      if (typeof sf !== 'undefined' && sf.closed) sf.closed[id] = !sf.closed[id];
      if (typeof saveSF === 'function') saveSF();
      if (typeof renderSylList === 'function') renderSylList();
      /* Synchronous restore — catches the immediate layout commit */
      window.scrollTo(0, y);
      /* Second-frame restore — catches any late anchoring shift */
      requestAnimationFrame(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        requestAnimationFrame(function(){
          if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        });
      });
      /* Last-ditch restore at 60ms — catches slow layout passes */
      setTimeout(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
      }, 60);
    };

    ACTIONS['toggle-topic'] = function(id, el){
      var y = window.scrollY;
      if (typeof sf !== 'undefined' && sf.closedTopics) sf.closedTopics[id] = !sf.closedTopics[id];
      if (typeof saveSF === 'function') saveSF();
      if (typeof renderSylList === 'function') renderSylList();
      window.scrollTo(0, y);
      requestAnimationFrame(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        requestAnimationFrame(function(){
          if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
        });
      });
      setTimeout(function(){
        if (Math.abs(window.scrollY - y) > 0.5) window.scrollTo(0, y);
      }, 60);
    };

    console.log('[apex-syl-scroll] toggle handlers overridden');
  }
  registerOverride();
})();
