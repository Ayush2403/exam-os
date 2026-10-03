/* ============================================================
   APEX OBSIDIAN LINK
   Adds "Open in Obsidian" button to every topic modal.
   Uses the obsidian:// URL scheme to open the matching note
   in the user's local vault. No publishing needed.
   ============================================================ */
(function(){
  'use strict';
  if (window._apexObsidian) return;
  window._apexObsidian = true;

  /* CHANGE THIS if your vault name differs. Check Obsidian:
     bottom-left of the sidebar shows the vault name. */
  var VAULT_NAME = 'Apex Notes';

  function subjectFolder(apexSubject){
    return String(apexSubject || '').split(' ')
      .map(function(w){ return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }

  function topicSlug(apexTopic){
    /* Strip leading "12. " or "12.5 " or "1. " */
    return String(apexTopic || '').replace(/^\d+(\.\d+)*\.\s*/, '').trim();
  }

  function encode(s){ return encodeURIComponent(s); }

  function buildURL(t){
    if (!t) return '';
    var folder = subjectFolder(t.subject);
    var slug = topicSlug(t.topic);
    return 'obsidian://open?vault=' + encode(VAULT_NAME) + '&file=' + encode(folder + '/' + slug);
  }

  var _origTopicDetail = window.topicDetail;
  if (typeof _origTopicDetail !== 'function') {
    console.warn('[apex-obsidian] topicDetail not found — patch skipped');
    return;
  }

  window.topicDetail = function(id){
    var r = _origTopicDetail.apply(this, arguments);
    setTimeout(function(){
      var modal = document.querySelector('.modal');
      if (!modal) return;
      var t = topicById(id);
      if (!t) return;
      var chips = modal.querySelector('.mbody .chips');
      if (!chips) return;
      if (chips.querySelector('.apex-obsidian-btn')) return;

      var url = buildURL(t);
      var btn = document.createElement('a');
      btn.className = 'apex-obsidian-btn chip';
      btn.href = url;
      btn.style.textDecoration = 'none';
      btn.textContent = '📖 Open in Obsidian';
      btn.title = subjectFolder(t.subject) + '/' + topicSlug(t.topic) + '.md';
      chips.appendChild(btn);
    }, 80);
    return r;
  };

  console.log('[apex-obsidian] vault="' + VAULT_NAME + '" — button added to topic modal');
})();
