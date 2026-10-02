/* APEX — keyboard + focus preservation */
(function(){
  if (window._apexA11y) return;
  window._apexA11y = true;

  /* Enter/Space activate role=button */
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('input, textarea, select')) return;
    var el = e.target.closest('[role="button"][tabindex="0"]');
    if (!el) return;
    e.preventDefault();
    el.click();
  }, true);

  /* Preserve focus + cursor position across rerender() */
  function wrapRerender(){
    if (typeof window.rerender !== 'function') { setTimeout(wrapRerender, 100); return; }
    if (window._apexRerenderWrapped) return;
    window._apexRerenderWrapped = true;
    var orig = window.rerender;
    window.rerender = function(){
      var a = document.activeElement;
      var id = a && a.id;
      var name = a && a.name;
      var tag = a && a.tagName;
      var s = null, e = null;
      try { if (a && a.selectionStart != null) { s = a.selectionStart; e = a.selectionEnd; } } catch(_){}
      var r;
      try { r = orig.apply(this, arguments); } catch(err){ console.error('[apex] rerender', err); }
      if (id) {
        var el = document.getElementById(id);
        if (el) { try { el.focus({preventScroll:true}); } catch(_) { el.focus(); } }
      } else if (name && tag) {
        var el2 = document.querySelector(tag.toLowerCase() + '[name="' + name + '"]');
        if (el2) { try { el2.focus({preventScroll:true}); } catch(_) { el2.focus(); } }
      }
      if ((id || name) && s != null) {
        var focusEl = document.activeElement;
        if (focusEl && focusEl.setSelectionRange) try { focusEl.setSelectionRange(s, e); } catch(_){}
      }
      return r;
    };
    console.log('[apex-a11y] rerender wrapped (focus preserved)');
  }
  wrapRerender();

  console.log('[apex-a11y] installed');
})();
