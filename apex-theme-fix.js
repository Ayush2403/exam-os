/* ============================================================
   APEX COSMOS THEME FIX v3 — display:none on non-apex themes
   ============================================================ */
(function(){
  'use strict';
  if (window._apexCosmosFixV3) return;
  window._apexCosmosFixV3 = true;

  var style = document.createElement('style');
  style.id = 'apex-cosmos-theme-fix';
  style.textContent =
    'html:not([data-theme="apex"]) #apex-cosmos{' +
    '  display:none !important;' +
    '  opacity:0 !important;' +
    '  visibility:hidden !important;' +
    '  contain:none !important;' +
    '}' +
    'html:not([data-theme="apex"]) #apex-cosmos *{' +
    '  animation:none !important;' +
    '  display:none !important;' +
    '}';
  document.head.appendChild(style);

  function enforce(){
    var theme = document.documentElement.getAttribute('data-theme') || 'apex';
    var all = document.querySelectorAll('#apex-cosmos');
    for(var i = 0; i < all.length; i++){
      if(theme === 'apex'){
        all[i].style.display = '';
        all[i].style.visibility = '';
        all[i].style.opacity = '';
      } else {
        all[i].style.display = 'none';
        all[i].style.visibility = 'hidden';
        all[i].style.opacity = '0';
      }
    }
  }

  window.addEventListener('scroll', enforce, {passive:true, capture:true});
  document.addEventListener('scroll', enforce, {passive:true, capture:true});
  new MutationObserver(enforce).observe(document.body, {childList:true, subtree:true});
  new MutationObserver(enforce).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  setInterval(enforce, 250);
  enforce();

  console.log('[apex-cosmos-fix-v3] installed');
})();
