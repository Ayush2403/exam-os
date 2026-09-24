/* ============================================================
   APEX SERVICE WORKER v2
   Cache-first · stale-while-revalidate · offline-first
   ============================================================ */
const CACHE = 'apex-v2';
const ASSETS = [
  './',
  './index.html',
  './landing.html',
  './manifest.json',
  './apex-mobile.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(ASSETS).catch(function(){ /* tolerate missing */ });
    }).then(function(){ return self.skipWaiting(); })
  );
});

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

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  var url = new URL(e.request.url);

  // Google Fonts and other CDNs — cache-first
  if(/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname)){
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

  // Same-origin assets — stale-while-revalidate
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var fetchPromise = fetch(e.request).then(function(res){
          if(res && res.status === 200){
            var clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          }
          return res;
        }).catch(function(){
          // Offline fallback to index.html for navigations
          if(e.request.mode === 'navigate'){
            return caches.match('./index.html');
          }
          return cached;
        });
        return cached || fetchPromise;
      })
    );
  }
});
