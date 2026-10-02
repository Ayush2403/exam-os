/* ============================================================
   APEX POLISH — passphrase memory, banking subjects, syllabus focus
   ============================================================ */
(function(){
  'use strict';
  if (window._apexPolish) return;
  window._apexPolish = true;

  /* ---- 1. Remember passphrase on this device (opt-in) ---- */
  var REMEMBER_KEY = 'apex-sync-pass-remembered';
  var REMEMBER_NEXT = 'apex-sync-remember-next';

  /* Auto-unlock from localStorage on load */
  setTimeout(function(){
    if (!S.sync || !S.sync.enabled || !S.sync.room) return;
    if (typeof syncKey !== 'undefined' && syncKey) return;
    var remembered = null;
    try { remembered = localStorage.getItem(REMEMBER_KEY); } catch(e){}
    if (!remembered) return;
    if (typeof setPassphrase !== 'function') return;
    setPassphrase(remembered).then(function(){
      if (typeof startSync === 'function') startSync();
      console.log('[apex-polish] auto-unlocked from remembered passphrase');
    }).catch(function(e){
      console.log('[apex-polish] remembered passphrase failed:', e.message);
    });
  }, 1800);

  /* Inject checkbox into Sync settings */
  function injectCheckbox(){
    var modal = document.querySelector('.modal');
    if (!modal) return;
    var passField = modal.querySelector('[name="syncPass"]');
    if (!passField) return;
    if (passField.parentElement.querySelector('.apex-remember-cb')) return;

    var label = document.createElement('label');
    label.className = 'apex-remember-cb';
    label.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;cursor:pointer;font-size:12.5px;color:var(--text-2);padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface-2)';
    var checked = false;
    try { checked = !!localStorage.getItem(REMEMBER_KEY); } catch(e){}
    label.innerHTML =
      '<input type="checkbox" ' + (checked ? 'checked' : '') + ' style="accent-color:var(--accent);flex-shrink:0">' +
      '<span><b>Remember on this device</b> — auto-unlock next time. Anyone with devtools access can read it.</span>';
    passField.parentElement.appendChild(label);

    label.querySelector('input').addEventListener('change', function(e){
      try {
        if (e.target.checked) {
          var pass = passField.value;
          if (pass) { localStorage.setItem(REMEMBER_KEY, pass); }
          else { localStorage.setItem(REMEMBER_NEXT, '1'); }
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.removeItem(REMEMBER_NEXT);
        }
      } catch(_){}
    });
  }

  var modalRoot = document.getElementById('modal-root');
  if (modalRoot) new MutationObserver(injectCheckbox).observe(modalRoot, { childList: true, subtree: true });

  /* Capture passphrase as it's typed if "remember next" is armed */
  document.addEventListener('input', function(e){
    if (!e.target || e.target.name !== 'syncPass') return;
    try {
      if (localStorage.getItem(REMEMBER_NEXT) === '1' && e.target.value) {
        localStorage.setItem(REMEMBER_KEY, e.target.value);
      }
    } catch(_){}
  }, true);

  /* On sync Save, capture the passphrase from the form */
  document.addEventListener('click', function(e){
    if (!e.target.closest('[data-msave]')) return;
    var modal = e.target.closest('.modal');
    if (!modal) return;
    var passField = modal.querySelector('[name="syncPass"]');
    var cb = modal.querySelector('.apex-remember-cb input');
    if (!passField || !cb) return;
    setTimeout(function(){
      try {
        if (cb.checked && passField.value) {
          localStorage.setItem(REMEMBER_KEY, passField.value);
        }
      } catch(_){}
    }, 400);
  }, true);

  /* ---- 2. Seed banking awareness + computer awareness subjects ---- */
  var SEED = {
    'banking awareness': [
      'RBI — Role, Functions, and Monetary Policy',
      'Banking Structure in India — Public, Private, Cooperative, Small Finance',
      'Types of Bank Accounts — Current, Savings, FD, RD',
      'NPA (Non-Performing Assets) — Classification and Recovery',
      'Basel Norms I, II, III — Capital Adequacy, Liquidity',
      'Financial Inclusion — Jan Dhan, Mudra, Payment Banks',
      'Digital Banking — UPI, NEFT, RTGS, IMPS, NACH',
      'Priority Sector Lending — Categories and Targets',
      'Monetary Policy Tools — Repo, Reverse Repo, CRR, SLR, MSF',
      'Banking Ombudsman and Consumer Protection',
      'Negotiable Instruments — Cheque, Draft, Bill of Exchange',
      'KYC and AML Norms',
      'Foreign Exchange and FEMA Basics',
      'Financial Markets — Money vs Capital',
      'Government Schemes — PMJDY, PMSBY, PMJJBY, APY'
    ],
    'computer awareness': [
      'Computer Fundamentals — Hardware, Software, Generations',
      'Operating Systems — Windows, Linux, macOS',
      'MS Office Suite — Word, Excel, PowerPoint',
      'Computer Networking — LAN, WAN, IP, DNS, Protocols',
      'DBMS — Tables, Queries, RDBMS Concepts',
      'Internet and Web — HTTP, HTTPS, URL, Browser',
      'Cyber Security — Malware, Firewall, Encryption, Phishing',
      'Shortcut Keys — Windows and MS Office',
      'Computer Abbreviations — RAM, ROM, CPU, GPU, SSD',
      'Cloud Computing and Virtualisation'
    ]
  };
  var BANKING_EXAMS = ['SBI PO','IBPS PO','IBPS CLERK','SBI CLERK','RBI ASSISTANT','RRB PO','RRB CLERK','RBI GRADE B','NABARD GRADE A'];
  var COMPUTER_EXAMS = ['SBI PO','IBPS PO','IBPS CLERK','SBI CLERK','RBI ASSISTANT','RRB PO','RRB CLERK'];

  function ensureSubject(subj, topics, exams){
    var existing = new Set(S.syllabus.filter(function(t){ return t.subject === subj; }).map(function(t){ return t.topic.toLowerCase(); }));
    if (topics.every(function(t){ return existing.has(t.toLowerCase()); })) return 0;
    if (S.tax && Array.isArray(S.tax.subjects) && S.tax.subjects.indexOf(subj) === -1) {
      S.tax.subjects.push(subj);
    }
    var added = 0;
    topics.forEach(function(name){
      if (existing.has(name.toLowerCase())) return;
      S.syllabus.push({
        id: 't_' + subj.replace(/\s+/g,'_') + '_' + added + '_' + Date.now().toString(36),
        topic: name,
        subject: subj,
        exams: exams.slice(),
        priority: '',
        status: 'Not started',
        weightage: '',
        remarks: '',
        notes: '',
        parentId: null
      });
      added++;
    });
    return added;
  }

  if (!S.settings._apexBankingSeeded) {
    var n1 = ensureSubject('banking awareness', SEED['banking awareness'], BANKING_EXAMS);
    var n2 = ensureSubject('computer awareness', SEED['computer awareness'], COMPUTER_EXAMS);
    S.settings._apexBankingSeeded = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
    if (n1 + n2 > 0) console.log('[apex-polish] added ' + n1 + ' banking + ' + n2 + ' computer topics');
  }

  /* Also tag existing finance topics for banking exams */
  if (!S.settings._apexFinanceTagged) {
    S.syllabus.forEach(function(t){
      if (t.subject === 'finance' && Array.isArray(t.exams)) {
        ['SBI PO','IBPS PO','IBPS CLERK','SBI CLERK','RBI ASSISTANT','RRB PO','RRB CLERK'].forEach(function(ex){
          if (t.exams.indexOf(ex) === -1) t.exams.push(ex);
        });
      }
      if (t.subject === 'economical issues' && Array.isArray(t.exams)) {
        ['SBI PO','IBPS PO','RBI ASSISTANT','RRB PO'].forEach(function(ex){
          if (t.exams.indexOf(ex) === -1) t.exams.push(ex);
        });
      }
    });
    S.settings._apexFinanceTagged = 1;
    try { store.set(KEY, JSON.stringify(S)); } catch(e){}
  }

  /* ---- 3. Focus syllabus on active exam + collapse by default ---- */
  var FOCUS_KEY = 'apex-syl-focus-mode';
  function focusMode(){ try { return localStorage.getItem(FOCUS_KEY) !== 'all'; } catch(e) { return true; } }

  /* Show only subjects that have topics for the active exam */
  function filterSylByActiveExam(){
    if (!focusMode()) return null;
    var exam = (typeof window.getActiveExam === 'function') ? window.getActiveExam() : '';
    if (!exam) return null;
    var subs = new Set();
    S.syllabus.forEach(function(t){
      if (t.archived) return;
      if (Array.isArray(t.exams) && t.exams.indexOf(exam) > -1) subs.add(t.subject);
    });
    return subs;
  }

  /* Patch renderSylList to hide irrelevant subjects + force-collapse */
  function wrapRender(){
    if (typeof window.renderSylList !== 'function') { setTimeout(wrapRender, 300); return; }
    if (window._apexPolishWrapped) return;
    window._apexPolishWrapped = true;
    var orig = window.renderSylList;
    window.renderSylList = function(){
      var subs = filterSylByActiveExam();
      var r = orig.apply(this, arguments);
      if (subs) {
        document.querySelectorAll('#syl-list .subj-group').forEach(function(g){
          if (!subs.has(g.dataset.subj)) g.style.display = 'none';
        });
      }
      /* Show-all toggle chip */
      var list = document.getElementById('syl-list');
      if (list && !document.querySelector('.apex-focus-toggle')) {
        var chip = document.createElement('button');
        chip.className = 'btn ghost sm apex-focus-toggle';
        chip.style.cssText = 'position:sticky;top:0;float:right;z-index:10;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase';
        chip.textContent = focusMode() ? '▾ Show all subjects' : '▴ Only active exam';
        chip.addEventListener('click', function(){
          try {
            localStorage.setItem(FOCUS_KEY, focusMode() ? 'all' : 'focus');
          } catch(e){}
          if (typeof window.renderSylList === 'function') window.renderSylList();
        });
        list.parentNode.insertBefore(chip, list);
      }
      return r;
    };
    console.log('[apex-polish] syllabus focus installed');
  }
  wrapRender();

  console.log('[apex-polish] installed');
})();
