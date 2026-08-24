const CACHE='tri-penha-v9';
const ASSETS=['./','./index.html','./styles.css?v=9','./app.js?v=9','./data.js?v=9','./exercise-overrides.js?v=9','./schedule-overrides.js?v=9','./ui-v9.js?v=9','./manifest.webmanifest?v=9','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});
