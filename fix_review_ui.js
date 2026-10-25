const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

const css = `
<style id="apex-review-ui-clean">
  /* Turn the card into a flex column so we can reorder the layout */
  #sess-list .sess-card, #err-list .card {
    display: flex !important;
    flex-direction: column !important;
    padding: 20px 24px !important;
    gap: 12px !important;
    border-radius: 14px !important;
    background: var(--surface) !important;
    border: 1px solid var(--border-2) !important;
  }

  /* Reorder elements: Title -> Tags -> Notes -> Grade -> Meta */
  #sess-list .sess-top, #err-list .sess-top { order: 1; }
  #sess-list .sess-tags, #err-list .sess-tags { order: 2; }
  #sess-list .sess-notes, #err-list .err-detail { order: 3; margin: 4px 0 !important; }
  #sess-list .grade-row, #err-list .grade-row { order: 4; margin-top: 4px; }
  #sess-list .sess-meta, #err-list .sess-meta { order: 5; margin-top: 8px; }

  /* Collapse metadata into a tiny single scrolling strip at the bottom */
  #sess-list .sess-meta, #err-list .sess-meta {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    background: transparent !important;
    border: none !important;
    border-top: 1px solid var(--border) !important;
    padding: 10px 0 0 0 !important;
    gap: 16px !important;
    scrollbar-width: none !important;
  }
  #sess-list .sess-meta::-webkit-scrollbar, #err-list .sess-meta::-webkit-scrollbar { display: none; }
  
  #sess-list .sess-meta .fld, #err-list .sess-meta .fld {
    flex: 0 0 auto !important;
    border: none !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 6px !important;
  }
  #sess-list .sess-meta .fld label, #err-list .sess-meta .fld label {
    font-size: 9px !important;
    letter-spacing: .08em !important;
    opacity: 0.5;
    margin: 0 !important;
    text-transform: uppercase;
  }
  #sess-list .sess-meta .fld b, #sess-list .sess-meta .fld .inp,
  #err-list .sess-meta .fld b, #err-list .sess-meta .fld .inp {
    font-size: 11px !important;
    padding: 2px 6px !important;
    min-height: 24px !important;
    background: rgba(255,255,255,.03) !important;
    border-radius: 6px !important;
    border: 1px solid transparent !important;
  }
  #sess-list .sess-meta .fld .inp:hover, #err-list .sess-meta .fld .inp:hover {
    border-color: var(--border-2) !important;
    background: var(--surface-3) !important;
  }

  /* Make grade buttons huge and thumb-friendly */
  #sess-list .grade-row, #err-list .grade-row {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 10px !important;
    padding-top: 16px !important;
    border-top: 1px solid var(--border) !important;
  }
  #sess-list .grade-btn, #err-list .grade-btn {
    width: 100% !important;
    min-height: 52px !important;
    font-size: 13.5px !important;
    font-weight: 700 !important;
    letter-spacing: .06em !important;
    text-transform: uppercase;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 10px !important;
  }

  /* Make notes the absolute focus (premium block) */
  #sess-list .sess-notes {
    background: rgba(167,139,250,.04) !important;
    border: 1px solid rgba(167,139,250,.15) !important;
    border-left: 3px solid var(--accent-2) !important;
    padding: 18px 22px !important;
    border-radius: 10px !important;
    font-size: 14.5px !important;
    line-height: 1.75 !important;
    color: var(--text) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.02);
  }
  #sess-list .sess-notes-h {
    font-size: 11px !important;
    letter-spacing: .1em;
    margin-bottom: 10px !important;
    color: var(--accent-2) !important;
  }

  /* Mobile tweaks */
  @media (max-width: 860px) {
    #sess-list .sess-card, #err-list .card { padding: 16px !important; gap: 10px !important; }
    #sess-list .grade-row, #err-list .grade-row { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    #sess-list .grade-btn, #err-list .grade-btn { min-height: 48px !important; font-size: 13px !important; }
  }
</style>
</head>`;

if (!html.includes('apex-review-ui-clean')) {
    html = html.replace('</head>', css);
    changed++;
    console.log('✅ Injected Review Card UI cleanup CSS');
} else {
    console.log('ℹ️ CSS already injected.');
}

if (changed > 0) {
    fs.writeFileSync('index.html', html);
    
    // Bump SW to force refresh
    let sw = fs.readFileSync('sw.js', 'utf8');
    const m = sw.match(/const CACHE = 'apex-v(\d+)'/);
    if (m) {
        const cur = parseInt(m[1], 10);
        const nxt = cur + 1;
        sw = sw.replace(`const CACHE = 'apex-v${cur}'`, `const CACHE = 'apex-v${nxt}'`);
        fs.writeFileSync('sw.js', sw);
        console.log(`✅ Bumped sw.js cache to v${nxt}`);
    }
}