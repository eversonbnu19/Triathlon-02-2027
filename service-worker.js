const CACHE='tri-penha-v22';
const ASSETS=['./','./index.html','./styles.css?v=22','./neon-cloud.js?v=22','./app.js?v=22','./data.js?v=22','./exercise-overrides.js?v=22','./schedule-overrides.js?v=22','./ui-v19.js?v=22','./cycles-v20.js?v=22','./cargas-v21.js?v=22','./manifest.webmanifest?v=22','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)))});