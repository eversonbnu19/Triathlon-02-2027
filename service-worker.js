const CACHE='tri-penha-v21';
const ASSETS=['./','./index.html','./styles.css?v=21','./app.js?v=21','./data.js?v=21','./exercise-overrides.js?v=21','./schedule-overrides.js?v=21','./ui-v19.js?v=21','./cycles-v20.js?v=21','./cargas-v21.js?v=21','./manifest.webmanifest?v=21','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});