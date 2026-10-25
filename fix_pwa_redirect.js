const fs = require('fs');

// 1. Fix manifest.json to start at the root
try {
  let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.id = "/";
  manifest.start_url = "/";
  manifest.scope = "/";
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
  console.log('✅ manifest.json updated: start_url, scope, and id are now "/"');
} catch (e) {
  console.error('❌ Error updating manifest.json:', e.message);
}

// 2. Fix sw.js to intercept /index.html navigations and serve "/"
try {
  let sw = fs.readFileSync('sw.js', 'utf8');
  
  const oldCatch = `if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }`;
          
  const newCatch = `if (e.request.mode === 'navigate') {
            return caches.match('/') || caches.match('./index.html');
          }`;

  if (sw.includes(oldCatch)) {
    sw = sw.replace(oldCatch, newCatch);
    console.log('✅ sw.js updated: navigation fallback now serves "/" first');
  } else {
    // If spacing is different, try a broader replace
    sw = sw.replace(/return caches\.match\('\.\/index\.html'\);/, "return caches.match('/') || caches.match('./index.html');");
    console.log('✅ sw.js updated via fallback regex');
  }

  // Bump cache version
  const cacheMatch = sw.match(/const CACHE = 'apex-v(\d+)'/);
  if (cacheMatch) {
    const currentVersion = parseInt(cacheMatch[1], 10);
    const nextVersion = currentVersion + 1;
    sw = sw.replace(`const CACHE = 'apex-v${currentVersion}'`, `const CACHE = 'apex-v${nextVersion}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ sw.js cache bumped from v${currentVersion} to v${nextVersion}`);
  }
} catch (e) {
  console.error('❌ Error updating sw.js:', e.message);
}