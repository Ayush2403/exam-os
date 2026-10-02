/* APEX — keyboard-first review grading */
(function(){
  'use strict';
  if (window._apexKeys) return;
  window._apexKeys = true;

  function topDueCard(){
    var list = document.getElementById('sess-list');
    if (!list) return null;
    var due = (typeof dueSessions === 'function') ? dueSessions() : [];
    if (!due.length) return null;
    /* Find first card in DOM that corresponds to a due session */
    var dueIds = {};
    due.forEach(function(s){ dueIds[s.id] = s; });
    var cards = list.querySelectorAll('.sess-card[data-id]');
    for (var i = 0; i < cards.length; i++) {
      if (dueIds[cards[i].dataset.id]) return { el: cards[i], id: cards[i].dataset.id };
    }
    /* Also errors on the today tab */
    var errs = (typeof dueErrors === 'function') ? dueErrors() : [];
    var errIds = {};
    errs.forEach(function(e){ errIds[e.id] = e; });
    for (var j = 0; j < cards.length; j++) {
      if (errIds[cards[j].dataset.id]) return { el: cards[j], id: cards[j].dataset.id };
    }
    return null;
  }

  function gradeTop(grade){
    if ((location.hash || '').replace(/^#\/?/, '') !== 'reviews') return;
    if (document.querySelector('.modal, .overlay')) return;
    var t = topDueCard();
    if (!t) return;
    var el = t.el;
    /* Pick the error-grade action if the card is an error, else review */
    var isError = el.querySelector('.err-detail, [data-action="grade-error"]');
    var action = isError ? 'grade-error' : 'grade-review';
    var btn = el.querySelector('[data-action="' + action + '"][data-grade="' + grade + '"]');
    if (btn) btn.click();
  }

  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (document.querySelector('.modal, .cmd-overlay.open')) return;

    var k = e.key;
    if (k === '1') { e.preventDefault(); gradeTop('again'); }
    else if (k === '2') { e.preventDefault(); gradeTop('hard'); }
    else if (k === '3') { e.preventDefault(); gradeTop('good'); }
    else if (k === '4') { e.preventDefault(); gradeTop('easy'); }
    else if (k === ' ') { e.preventDefault(); gradeTop('good'); }
  }, true);

  /* esc() single-quote future-proofing */
  try {
    var _origEsc = window.esc;
    if (typeof _origEsc === 'function') {
      window.esc = function(s){
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };
    }
  } catch(e){}

  console.log('[apex-keys] 1/2/3/4 grade the top card · Space = Good');
})();
