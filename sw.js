var CACHE = 'tukompa-v1';
var URLS = ['/', '/index.html'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(URLS) }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(k) {
    return Promise.all(k.filter(function(n) { return n !== CACHE }).map(function(n) { return caches.delete(n) }));
  }));
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request) }));
});
