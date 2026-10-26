
(function() {
  if (window._apexTitleExpand) return;
  window._apexTitleExpand = true;
  document.addEventListener('click', function(e) {
    const title = e.target.closest('.sess-name');
    if (title) {
      title.classList.toggle('expanded');
    }
  });
})();
