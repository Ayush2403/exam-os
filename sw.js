self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  if(e.request.url.indexOf(location.origin) !== 0) return;
  e.respondWith(
    caches.open("apex-v1").then(function(c){
      return fetch(e.request).then(function(r){
        if(r && r.status === 200){ c.put(e.request, r.clone()); }
        return r;
      }).catch(function(){
        return c.match(e.request).then(function(hit){ return hit || c.match("./index.html"); });
      });
    })
  );
});
