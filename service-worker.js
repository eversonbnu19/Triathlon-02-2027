const CACHE='tri-penha-v18';
const ASSETS=['./','./index.html','./styles.css?v=18','./app.js?v=18','./data.js?v=18','./exercise-overrides.js?v=18','./schedule-overrides.js?v=18','./ui-v18.js?v=18','./manifest.webmanifest?v=18','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});