const CACHE='cuttrack-static-v1',OFFLINE='/offline';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([OFFLINE,'/manifest.json','/icons/icon-192.png']))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.pathname.startsWith('/api')||u.port==='3030'){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  }else if(['style','script','image','font'].includes(e.request.destination)){
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})));
  }else{
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match(OFFLINE))));
  }
});
self.addEventListener('push',e=>{const p=e.data?.json()||{};e.waitUntil(self.registration.showNotification(p.title||'CutTrack',{body:p.body,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',data:p.data||{}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const id=e.notification.data?.sessionId;e.waitUntil(clients.openWindow(id?`/workout/${id}`:'/dashboard'))});
self.addEventListener('sync',e=>{if(e.tag==='sync-workout-logs')e.waitUntil(clients.matchAll({type:'window'}).then(list=>Promise.all(list.map(c=>c.postMessage({type:'SYNC_WORKOUT_LOGS'})))))});
