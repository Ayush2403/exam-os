const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// Fix Show all themes
const old1 = 'S.settings.showAllThemes=Array.isArray(v.showAllThemes);';
const new1 = 'S.settings.showAllThemes=(v.showAllThemes&&v.showAllThemes.length>0);';
if (html.includes(old1)) { html = html.replace(old1, new1); changed++; }

// Fix Flashcard mode
const old2 = 'S.settings.flashcardMode=Array.isArray(v.flashcardMode);';
const new2 = 'S.settings.flashcardMode=(v.flashcardMode&&v.flashcardMode.length>0);';
if (html.includes(old2)) { html = html.replace(old2, new2); changed++; }

// Fix Auto export
const old3 = 'S.settings.autoExportEvery=Array.isArray(v.autoExport)?20:0;';
const new3 = 'S.settings.autoExportEvery=(v.autoExport&&v.autoExport.length>0)?20:999999;';
if (html.includes(old3)) { html = html.replace(old3, new3); changed++; }

// Fallback for spacing differences
if (changed === 0) {
    const old1b = 'S.settings.showAllThemes = Array.isArray(v.showAllThemes);';
    const new1b = 'S.settings.showAllThemes = (v.showAllThemes && v.showAllThemes.length > 0);';
    if (html.includes(old1b)) { html = html.replace(old1b, new1b); changed++; }

    const old2b = 'S.settings.flashcardMode = Array.isArray(v.flashcardMode);';
    const new2b = 'S.settings.flashcardMode = (v.flashcardMode && v.flashcardMode.length > 0);';
    if (html.includes(old2b)) { html = html.replace(old2b, new2b); changed++; }

    const old3b = 'S.settings.autoExportEvery = Array.isArray(v.autoExport) ? 20 : 0;';
    const new3b = 'S.settings.autoExportEvery = (v.autoExport && v.autoExport.length > 0) ? 20 : 999999;';
    if (html.includes(old3b)) { html = html.replace(old3b, new3b); changed++; }
}

if (changed > 0) {
    fs.writeFileSync('index.html', html);
    console.log(`✅ Successfully fixed ${changed} Advanced Settings toggles.`);
} else {
    console.log('❌ Could not find the exact strings. Let me know.');
}