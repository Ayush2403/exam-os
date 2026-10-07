/* ============================================================
   APEX SERVICE WORKER v3
   - Full precache: all app files, offline works on second load
   - Never caches /api/ requests (sync must always be live)
   - Cache-first for CDN assets, stale-while-revalidate for app
   ============================================================ */

const CACHE = 'apex-v26';

const ASSETS = [
  './',
  './index.html',
  './landing.html',
  './manifest.json',
  './favicon.png',
  './icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './apex-a11y.js',
  './apex-exam-sync.js',
  './apex-final-batch.js',
  './apex-final.js',
  './apex-katex-fix.js',
  './apex-keys.js',
  './apex-layout-fix.css',
  './apex-leech-topic.js',
  './apex-mobile-ux.css',
  './apex-mobile.js',
  './apex-new-exam.js',
  './apex-nopillchurn.js',
  './apex-obsidian-link.js',
  './apex-polish.js',
  './apex-scope.js',
  './apex-scope2.js',
  './apex-syl-focus.js',
  './apex-syl-scroll.js',
  './apex-tag-fix.js',
  './apex-tags-final.js',
  './apex-task-rollover.js',
  './apex-theme-fix.js',
  './exam-config.js',
  './exam-weightage.js',
  './sw.js',
  './sync.js'
];

/* ---- install: precache everything ---- */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(
        ASSETS.map(function(url){
          return c.add(url).catch(function(){
            /* Tolerate missing files (e.g. if an icon path is wrong) */
            console.log('[sw] skip cache for', url);
          });
        })
      );
    }).then(function(){ return self.skipWaiting(); })
  );
});

/* ---- activate: drop old caches ---- */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

/* ---- fetch ---- */
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;

  var url = new URL(e.request.url);

  /* 1. API calls — network only, never cached */
  if (url.pathname.indexOf('/api/') === 0) {
    return; // let browser handle it directly
  }

  /* 2. Google Fonts + CDNs — cache-first */
  if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname)) {
    e.respondWith(
      caches.match(e.request).then(function(hit){
        return hit || fetch(e.request).then(function(res){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }

  /* 3. Same-origin — stale-while-revalidate */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var fetchPromise = fetch(e.request).then(function(res){
          if (res && res.status === 200 && res.type === 'basic') {
            var clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          }
          return res;
        }).catch(function(){
          /* Offline navigation → serve index.html */
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  /* 4. Anything else (analytics, external links) — passthrough */
});
