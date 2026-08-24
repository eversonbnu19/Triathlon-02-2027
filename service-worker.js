const CACHE='tri-penha-v11';
const ASSETS=['./','./index.html','./styles.css?v=11','./app.js?v=11','./data.js?v=11','./exercise-overrides.js?v=11','./schedule-overrides.js?v=11','./ui-v9.js?v=11','./ui-v10.js?v=11','./manifest.webmanifest?v=11','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});
