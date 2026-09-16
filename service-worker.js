const CACHE='tri-penha-v16';
const ASSETS=['./','./index.html','./styles.css?v=16','./app.js?v=16','./data.js?v=16','./exercise-overrides.js?v=16','./schedule-overrides.js?v=16','./ui-v9.js?v=16','./ui-v10.js?v=16','./ui-v13.js?v=16','./youtube-layer-v16.js?v=16','./manifest.webmanifest?v=16','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});