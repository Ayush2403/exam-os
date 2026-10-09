/* ============================================================
   APEX a11y v2
   1. Enter/Space activation for role=button
   2. Focus preserved across rerender()
   3. Every visible button gets an accessible name
   4. Hidden containers become inert immediately
   ============================================================ */
(function(){
  'use strict';
  if (window._apexA11yV2) return;
  window._apexA11yV2 = true;

  /* --- 1. role=button activation --- */
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('input, textarea, select')) return;
    var el = e.target.closest('[role="button"][tabindex="0"]');
    if (!el) return;
    e.preventDefault();
    el.click();
  }, true);

  /* --- 2. Focus preservation across rerender() --- */
  function wrapRerender(){
    if (typeof window.rerender !== 'function') { setTimeout(wrapRerender, 100); return; }
    if (window._apexRerenderWrappedV2) return;
    window._apexRerenderWrappedV2 = true;
    var orig = window.rerender;
    window.rerender = function(){
      var a = document.activeElement;
      var id = a && a.id, name = a && a.name, tag = a && a.tagName;
      var s = null, e = null;
      try { if (a && a.selectionStart != null) { s = a.selectionStart; e = a.selectionEnd; } } catch(_){}
      var r;
      try { r = orig.apply(this, arguments); } catch(err) { console.error('[apex] rerender', err); }
      if (id) { var el = document.getElementById(id); if (el) try { el.focus({preventScroll:true}); } catch(_) { el.focus(); } }
      else if (name && tag) { var el2 = document.querySelector(tag.toLowerCase() + '[name="' + name + '"]'); if (el2) try { el2.focus({preventScroll:true}); } catch(_) { el2.focus(); } }
      if ((id || name) && s != null) {
        var fe = document.activeElement;
        if (fe && fe.setSelectionRange) try { fe.setSelectionRange(s, e); } catch(_){}
      }
      return r;
    };
    console.log('[apex-a11y] rerender wrapped (focus preserved)');
  }
  wrapRerender();

  /* --- 3. Accessible names --- */
  var ACTION_LABELS = {
    'gcal-review':'Add review to Google Calendar','gcal-task':'Add task to Google Calendar',
    'focus-task-from-review':'Start focus session','edit-session':'Edit this session',
    'del-session':'Delete this session','goto-topic':'Open this topic',
    'timer-start-task':'Start focus timer for task','timer-start-topic':'Start focus timer for topic',
    'timer-start-session':'Start focus timer for session','edit-task':'Edit this task',
    'del-task':'Delete this task','del-link':'Delete this link','edit-error':'Edit this error',
    'del-error':'Delete this error','edit-mock':'Edit this mock','del-mock':'Delete this mock',
    'add-subtopic':'Add a subtopic','edit-topic':'Edit this topic','del-topic':'Archive this topic',
    'subj-up':'Move subject up','subj-down':'Move subject down','del-subject':'Delete this subject',
    'radar-breakdown':'Show friction breakdown','mock-tag-topic':'Tag as a weak topic',
    'edit-exam-target':'Edit exam target','del-exam-target':'Delete exam target',
    'edit-section-set':'Edit section set','del-section-set':'Delete section set',
    'scratch-close':'Close scratch pad','scratch-add':'Add scratch note',
    'scratch-toggle':'Toggle scratch item','scratch-del':'Delete scratch item',
    'focus-panel-close':'Close focus panel','focus-history':'View focus history',
    'focus-zen':'Enter zen mode','focus-zen-exit':'Exit zen mode',
    'focus-music-open':'Open focus music','open-more':'Show more navigation',
    'undo':'Undo last change','add-link':'Add quick link','open-add-task':'Add task',
    'open-add-error':'Log an error','open-add-session':'Log a study session',
    'open-add-topic':'Add a topic','open-add-mock':'Log a mock test',
    'edit-notes-inline':'Edit topic notes','toggle-topic':'Expand or collapse topic',
    'topic-detail':'Open topic detail','open-pyq-log':'Log practice session',
    'open-bulk-errors':'Log multiple errors','open-bulk-import':'Bulk import topics',
    'open-full-plan':'See full plan','open-planner':'Plan a session',
    'task-template':'Insert routine template','task-advance':'Advance task status',
    'task-reopen':'Reopen this task','add-subject':'Add a subject',
    'dismiss-welcome':'Dismiss welcome','start-tour':'Start the guided tour',
    'export-notes':'Export notes as PDF','export-data':'Export a backup',
    'import-data':'Import a backup','test-import':'Test-import a backup',
    'reset-data':'Reset all data','edit-habits':'Edit habit definitions',
    'notif-enable':'Enable notifications','notif-test':'Send test notification',
    'sync-push':'Push to cloud now','sync-pull':'Pull from cloud now',
    'sync-lock':'Lock cloud sync','sync-disable':'Disconnect cloud sync',
    'gen-room':'Generate new room code','copy-room-code':'Copy room code',
    'open-settings':'Open settings','open-discord':'Open Discord',
    'open-exams-manager':'Manage exam targets','open-sections-manager':'Manage section sets',
    'edit-focus-targets':'Edit focus targets','focus-preset':'Set focus preset',
    'focus-mode':'Switch focus mode','focus-start':'Start focus timer',
    'focus-pause':'Pause focus timer','focus-reset':'Reset focus timer',
    'focus-skip':'Skip to next phase','focus-complete':'Complete and log focus session',
    'focus-pick-topic':'Change focus topic','focus-clear-topic':'Clear focus topic',
    'readiness-exam-set':'Set active exam','toggle-flashcard':'Toggle flashcard mode',
    'toggle-all-themes':'Show all themes','enter-app':'Enter the app',
    'bulk-toggle':'Toggle bulk selection','bulk-clear':'Clear selection',
    'bulk-apply':'Apply to selection','fix-tags':'Fix exam tags',
    'open-settings-data':'Open data settings','open-settings-sync':'Open sync settings'
  };

  function actionLabel(a){
    if (!a) return null;
    if (ACTION_LABELS[a]) return ACTION_LABELS[a];
    return a.replace(/^open-/, '').replace(/^del-/, 'Delete ').replace(/^edit-/, 'Edit ')
            .replace(/^add-/, 'Add ').replace(/-/g, ' ')
            .replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }

  function contextName(el){
    var node = el;
    for (var h = 0; h < 6 && node; h++) {
      node = node.parentElement;
      if (!node) break;
      var t = node.querySelector('.sess-name, .name, .tt, .t');
      if (t && t.textContent.trim()) return t.textContent.trim().slice(0, 80);
    }
    return null;
  }

  function labelFor(btn){
    /* WCAG 2.5.3 — if the button already has visible text, do not add
       an aria-label that would replace it. The visible text IS the name. */
    if (btn.getAttribute('aria-label') && btn.getAttribute('aria-label').trim()) return null;
    var text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    var visibleReal = text.length >= 3 && !/^[\s×✕✓+−—·]{1,3}$/.test(text);
    if (visibleReal) return null;

    /* Icon-only from here on */
    var fromAction = actionLabel(btn.dataset && btn.dataset.action);
    if (fromAction) return fromAction;
    var title = btn.getAttribute('title');
    if (title && title.trim()) return title.trim().split('—')[0].trim();
    if (btn.classList.contains('danger')) return 'Delete';
    if (btn.classList.contains('accent')) return 'Start';
    var ctx = contextName(btn);
    if (ctx) {
      if (/pencil/i.test(btn.innerHTML || '')) return 'Edit ' + ctx;
      if (btn.classList.contains('mini-icon')) return 'Action on ' + ctx;
    }
    return 'Action';
  }

  function decorateButtons(){
    document.querySelectorAll('button:not([aria-label])').forEach(function(b){
      if (!b.offsetParent) return;
      var label = labelFor(b);
      if (label) b.setAttribute('aria-label', label);
    });
  }

  /* --- 4. Inert hidden containers --- */
  function toggleInert(el, shouldBeHidden){
    if (!el || el === document.body || el === document.documentElement) return;
    if (shouldBeHidden) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }

  function applyInert(){
    document.querySelectorAll('[aria-hidden="true"]').forEach(function(el){ toggleInert(el, true); });
    document.querySelectorAll('[aria-hidden="false"]').forEach(function(el){ toggleInert(el, false); });
    var drawer = document.getElementById('scratch-drawer');
    if (drawer) toggleInert(drawer, !drawer.classList.contains('open'));
    var focusScr = document.getElementById('focus-screen');
    if (focusScr) toggleInert(focusScr, !focusScr.classList.contains('open'));
    var mr = document.getElementById('modal-root');
    if (mr) toggleInert(mr, !mr.children.length);
    var sr = document.getElementById('sheet-root');
    if (sr) toggleInert(sr, !sr.children.length);
    var wr = document.getElementById('welcome-root');
    if (wr) toggleInert(wr, !wr.children.length);
  }

  function rescueFocus(){
    var a = document.activeElement;
    if (!a || a === document.body) return;
    var trapped = a.closest('[aria-hidden="true"], [inert]');
    if (!trapped) return;
    try { a.blur(); } catch(_){}
    var fb = document.querySelector('#view button, #view a, #topbar button');
    if (fb) try { fb.focus({preventScroll:true}); } catch(_) { fb.focus(); }
    else document.body.focus();
  }

  document.addEventListener('focusin', function(e){
    var t = e.target;
    if (!t) return;
    if (t.closest('[aria-hidden="true"], [inert]')) {
      try { t.blur(); } catch(_){}
      rescueFocus();
    }
  }, true);

  /* --- wiring --- */
  function pass(){ decorateButtons(); applyInert(); }
  var raf = null;
  function schedule(){
    if (raf) return;
    raf = requestAnimationFrame(function(){ raf = null; pass(); });
  }
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['aria-hidden', 'class', 'inert']
  });
  pass();
  setTimeout(pass, 400);
  setTimeout(pass, 1500);
  window.addEventListener('hashchange', function(){ setTimeout(pass, 100); });


  /* WCAG 2.5.3 cleanup: any aria-label set on a button with visible text
     that doesn't CONTAIN that text is invalid. Remove it and let the
     visible text be the name. */
  function stripMismatchedLabels(){
    document.querySelectorAll('button[aria-label]').forEach(function(b){
      var visible = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (visible.length < 3) return;  /* icon-only — keep the aria-label */
      if (/^[\s×✕✓+−—·]{1,3}$/.test(visible)) return;
      var label = (b.getAttribute('aria-label') || '').trim();
      /* Normalize both to compare */
      var v = visible.toLowerCase();
      var l = label.toLowerCase();
      if (l && v.indexOf(l) === -1 && l.indexOf(v) === -1) {
        b.removeAttribute('aria-label');
      }
    });
  }
  setTimeout(stripMismatchedLabels, 600);
  setTimeout(stripMismatchedLabels, 2000);
  window.addEventListener('hashchange', function(){ setTimeout(stripMismatchedLabels, 200); });

  console.log('[apex-a11y] v2 installed — labelled buttons + inert hidden containers');
})();
