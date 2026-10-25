const fs = require('fs');

// 1. Fix manifest.json to start at the root
try {
  let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.start_url = "/";
  manifest.scope = "/";
  manifest.id = "/";
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
  console.log('✅ Fixed manifest.json: start_url, scope, id set to "/"');
} catch (e) {
  console.error('❌ Error updating manifest.json:', e.message);
}

// 2. Fix sw.js to ignore redirected responses and bump cache
try {
  let sw = fs.readFileSync('sw.js', 'utf8');
  
  // Prevent caching redirected responses
  const oldCacheCondition = "if (res && res.status === 200 && res.type === 'basic')";
  const newCacheCondition = "if (res && res.status === 200 && res.type === 'basic' && !res.redirected)";
  
  if (sw.includes(oldCacheCondition)) {
    sw = sw.replace(oldCacheCondition, newCacheCondition);
    console.log('✅ Fixed sw.js: will no longer cache redirected responses');
  } else if (sw.includes("if (res && res.status === 200 && res.type === 'basic' && !res.redirected)")) {
    console.log('ℹ️ sw.js already ignores redirected responses');
  } else {
    console.log('⚠️ Could not find the exact caching condition in sw.js. Check manually.');
  }

  // Bump the cache version to clear the old bad cache
  const cacheMatch = sw.match(/const CACHE = 'apex-v(\d+)'/);
  if (cacheMatch) {
    const currentVersion = parseInt(cacheMatch[1], 10);
    const nextVersion = currentVersion + 1;
    sw = sw.replace(`const CACHE = 'apex-v${currentVersion}'`, `const CACHE = 'apex-v${nextVersion}'`);
    fs.writeFileSync('sw.js', sw);
    console.log(`✅ Bumped sw.js cache from v${currentVersion} to v${nextVersion}`);
  } else {
    console.error('❌ Could not find CACHE version in sw.js');
  }
} catch (e) {
  console.error('❌ Error updating sw.js:', e.message);
}