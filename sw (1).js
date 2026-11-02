const CACHE = 'bawabat-islam-v3';
const DATA = 'bawabat-data-v1'; // يبقى محفوظاً بين التحديثات (القرآن والأحاديث)
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const DATA_HOSTS = ['api.alquran.cloud', 'cdn.jsdelivr.net'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(SHELL.map(u => cache.add(u)))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== DATA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // بيانات القرآن والأحاديث: من الكاش أولاً، وإن لم توجد تُحمَّل وتُحفظ
  if (DATA_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(DATA).then(cache =>
        cache.match(req).then(hit => hit || fetch(req).then(res => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  // ملفات الموقع نفسه: الشبكة أولاً (لتصل التحديثات) ثم الكاش عند انقطاع الإنترنت
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});
