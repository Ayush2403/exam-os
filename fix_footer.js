const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

// 1. Safely bump the version number
const oldVer = 'const APP_VERSION="v22.0.0";';
const newVer = 'const APP_VERSION="v23.0.0";';
if (html.includes(oldVer)) {
  html = html.replace(oldVer, newVer);
  changed++;
  console.log('✅ Bumped version to v23.0.0');
}

// 2. Safely fix the landing page link
const oldLink = '<a class="btn ghost sm" href="landing.html" target="_blank" rel="noopener">landing</a>';
const newLink = '<button class="btn ghost sm" onclick="window.open(\'./landing.html\',\'_blank\',\'noopener\')">landing</button>';
if (html.includes(oldLink)) {
  html = html.replace(oldLink, newLink);
  changed++;
  console.log('✅ Replaced landing <a> with inline button');
}

// Save the file if changes were made
if (changed > 0) {
  fs.writeFileSync('index.html', html);
} else {
  console.log('ℹ️ Exact strings not found. (They might already be updated).');
}