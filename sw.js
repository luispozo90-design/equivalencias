/* Equivalencias — funciona sin conexión.
   La página se busca siempre primero en internet (así las actualizaciones llegan solas)
   y, si no hay cobertura, se usa la copia guardada. Los datos de Supabase nunca se guardan aquí.
   Cada carpeta (equivalencias, aguado, prueba) tiene su propia copia y no toca la de las demás. */
const PREFIX = 'eq|' + self.registration.scope + '|';
const VERSION = PREFIX + 'v7';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;                       // login y alimentos: siempre en directo
  if (req.mode === 'navigate' || url.href.startsWith(self.registration.scope)) {   // la app: internet primero, copia si no hay
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {   // librería y tipografía
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
