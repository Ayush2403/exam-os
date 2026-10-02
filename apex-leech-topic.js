/* Topic-level leech flag in Radar */
(function(){
  if (window._apexTopicLeech) return;
  window._apexTopicLeech = true;

  function topicLeechCount(topicId){
    var s = S.sessions.filter(function(x){ return x.topicId === topicId && window.isLeech && window.isLeech(x); });
    var e = S.errors.filter(function(x){ return x.topicId === topicId && window.isLeech && window.isLeech(x); });
    return s.length + e.length;
  }
  window.topicLeechCount = topicLeechCount;

  function paint(){
    if ((location.hash || '').replace(/^#\/?/, '') !== 'radar') return;
    var view = document.getElementById('view');
    if (!view) return;
    view.querySelectorAll('.weak-item').forEach(function(row){
      var t = row.querySelector('.weak-t');
      if (!t) return;
      if (t.querySelector('.topic-leech-flag')) return;
      var idAttr = t.getAttribute('data-id');
      if (!idAttr) return;
      var n = topicLeechCount(idAttr);
      if (n >= 2) {
        var flag = document.createElement('span');
        flag.className = 'topic-leech-flag pill';
        flag.style.cssText = 'font-size:9px;padding:1px 7px;margin-left:8px;background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.45);color:#fca5a5;font-weight:700;letter-spacing:.1em';
        flag.textContent = '🩸 TOPIC LEECH';
        flag.title = n + ' cards under this topic are leeches. Reset the topic, don\'t keep rating.';
        t.appendChild(flag);
      }
    });
  }

  var view = document.getElementById('view');
  if (view) {
    var raf = null;
    new MutationObserver(function(){
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    }).observe(view, { childList: true, subtree: true });
  }
  setTimeout(paint, 500);
  console.log('[apex-topic-leech] installed');
})();
