/* ============================================================
   APEX SCROLL PRESERVE
   Stops the view from jumping to the top when the DOM is
   swapped (delete, edit, rate, etc.). Wraps rerender itself,
   so it applies everywhere.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexScrollPreserve) return;
  window._apexScrollPreserve = true;

  function wrap(){
    if (typeof window.rerender !== 'function') {
      setTimeout(wrap, 100);
      return;
    }
    if (window._apexRerenderWrappedScroll) return;
    window._apexRerenderWrappedScroll = true;

    var _orig = window.rerender;

    window.rerender = function(){
      var y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      /* Fast path — nothing to preserve. Common during initial load and
         while the user is at the top of the page. Skips style toggling,
         forced reflows, and scrollTo calls entirely. */
      if (y === 0) {
        return _orig.apply(this, arguments);
      }

      // Pause scroll anchoring so the browser doesn't "correct" scroll
      // when the DOM below the viewport changes
      var htmlAnchor = document.documentElement.style.overflowAnchor;
      var bodyAnchor = document.body.style.overflowAnchor;
      document.documentElement.style.overflowAnchor = 'none';
      document.body.style.overflowAnchor = 'none';

      // Force instant scroll during restore (skip the smooth animation)
      var htmlBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      var result;
      try {
        result = _orig.apply(this, arguments);
      } catch(e) {
        document.documentElement.style.overflowAnchor = htmlAnchor;
        document.body.style.overflowAnchor = bodyAnchor;
        document.documentElement.style.scrollBehavior = htmlBehavior;
        throw e;
      }

      function restore(){
        var max = Math.max(0,
          (document.documentElement.scrollHeight || 0) - (window.innerHeight || 0));
        window.scrollTo(0, Math.min(y, max));
      }

      /* Restore once after layout, then again at 80ms as a safety net
         for slow layouts. Cleanup happens in the safety-net pass. */
      requestAnimationFrame(restore);
      setTimeout(function(){
        restore();
        document.documentElement.style.overflowAnchor = htmlAnchor;
        document.body.style.overflowAnchor = bodyAnchor;
        document.documentElement.style.scrollBehavior = htmlBehavior;
      }, 80);

      return result;
    };
    try { rerender = window.rerender; } catch(e){}

    console.log('[apex scroll preserve] installed');
  }
  wrap();
})();
