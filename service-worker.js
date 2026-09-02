// Vantik service worker — cachea el shell de la app para instalación/offline básico.
const CACHE = 'vantik-v34';
const ASSETS = [
  './',
  './app.html',
  './diagnostico.js',
  './estilos.css',
  './app.js',
  './vantik-core.js',
  './inicio.js',
  './navegacion.js',
  './cuenta.js',
  './predicciones.js',
  './tutorial.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './cow-white.png',
  './cow-moo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // No cachear llamadas a Supabase (datos siempre frescos / requieren red)
  if (req.url.includes('supabase.co') || req.url.includes('supabase.in')) return;

  // Páginas HTML: primero la red, para que las actualizaciones lleguen de inmediato.
  // Si no hay señal, se usa la copia guardada.
  const esPagina = req.mode === 'navigate' ||
    (req.destination === 'document') ||
    (req.headers.get('accept') || '').includes('text/html') ||
    (req.url.startsWith(self.location.origin) && /\.(js|css)$/.test(new URL(req.url).pathname));
  if (esPagina) {
    e.respondWith(
      fetch(req, {cache:'reload'}).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./app.html')))
    );
    return;
  }
  // App shell: cache-first con actualización en segundo plano
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && req.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
