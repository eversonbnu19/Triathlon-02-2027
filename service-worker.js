const CACHE='tri-penha-v12';
const ASSETS=['./','./index.html','./styles.css?v=12','./app.js?v=12','./data.js?v=12','./exercise-overrides.js?v=12','./schedule-overrides.js?v=12','./ui-v9.js?v=12','./ui-v10.js?v=12','./exercise-images-v12.js?v=12','./photo-layer-v12.js?v=12','./manifest.webmanifest?v=12','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});
