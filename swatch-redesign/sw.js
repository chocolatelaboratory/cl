/* Offline support for Ohuhu Swatch Chart Maker.
   First visit saves the app on the phone. Online: always fetches the newest
   version (waits at most 4 s before using the saved copy). Offline: saved copy. */
var SCOPE = new URL(self.registration.scope).pathname;
var PREFIX = 'swatch:' + SCOPE + ':', CACHE = PREFIX + 'v1';
var FILES = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf(PREFIX) === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;
  var key = (url.search || url.pathname.endsWith('/index.html')) ? new Request(url.origin + url.pathname.replace(/index\.html$/, '')) : req;
  e.respondWith(caches.open(CACHE).then(function(cache){
    var net = fetch(key).then(function(res){ if(res && res.ok) cache.put(key, res.clone()); return res; });
    var saved = cache.match(key).then(function(hit){ return hit || (req.mode === 'navigate' ? cache.match('./') : undefined); });
    var timeout = new Promise(function(r){ setTimeout(r, 4000); }).then(function(){ return saved; });
    return Promise.race([net.catch(function(){ return saved; }), timeout]).then(function(res){
      return res || net.catch(function(){ return saved; }).then(function(r){ return r || new Response('Offline', { status: 503 }); });
    });
  }));
});
