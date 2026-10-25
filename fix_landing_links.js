const fs = require('fs');
let html = fs.readFileSync('landing.html', 'utf8');
let changed = 0;

// Replace all instances of index.html in the landing page with "/"
const old1 = '<a href="index.html" class="btn btn-primary">';
const new1 = '<a href="/" class="btn btn-primary">';

const old2 = '<a href="index.html" class="btn btn-primary reveal">';
const new2 = '<a href="/" class="btn btn-primary reveal">';

const old3 = '<a href="index.html">Enter Apex</a>';
const new3 = '<a href="/">Enter Apex</a>';

if (html.includes(old1)) { html = html.split(old1).join(new1); changed++; }
if (html.includes(old2)) { html = html.split(old2).join(new2); changed++; }
if (html.includes(old3)) { html = html.split(old3).join(new3); changed++; }

if (changed > 0) {
  fs.writeFileSync('landing.html', html);
  console.log(`✅ Fixed ${changed} links in landing.html to point to "/"`);
} else {
  console.log('ℹ️ Could not find the links, they might already be fixed.');
}