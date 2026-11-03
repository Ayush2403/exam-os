const fs = require('fs');
let html = fs.readFileSync('landing.html', 'utf8');

// Update text mentions
if (html.includes('Adaptive · rate Again / Hard / Good / Easy. Mastered → +90d → +180d → +365d.')) {
    html = html.replace('Adaptive · rate Again / Hard / Good / Easy. Mastered → +90d → +180d → +365d.', 'FSRS-Powered · rate Again / Hard / Good / Easy. Calculates exact memory stability.');
}
if (html.includes('Tells you what to work on today, schedules revision automatically, and ranks weak topics by what actually costs you marks.')) {
    // It's already good, but let's emphasize Marks at Risk
}
// Update the hero subtitle
html = html.replace('A study system for competitive exams. Tells you what to work on today, schedules your revision on its own, and ranks your weak topics by what actually costs you marks.', 'A study system for competitive exams. Uses FSRS to schedule revision perfectly, and ranks your weak topics by exact "Marks at Risk" for your upcoming exam.');
// Update footer version
html = html.replace('SYS.01 · <b>v22</b>', 'SYS.01 · <b>v24</b>');
html = html.replace('Apex / The Exam OS · Public Interface', 'Apex / The Exam OS · Public Interface · v24');

fs.writeFileSync('landing.html', html);
console.log("✅ Updated landing.html copy");