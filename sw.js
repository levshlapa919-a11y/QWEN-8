const CACHE = 'golda-v4';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// АВТОПОДСТАНОВКА push.js в страницы, чтобы не править index.html
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode !== 'navigate') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      const type = res.headers.get('content-type') || '';
      if (!type.includes('text/html')) return res;
      let html = await res.text();
      if (html.indexOf('push.js') === -1) {
        html = html.replace('</body>', '<script src="push.js"></script></body>');
      }
      return new Response(html, { headers: res.headers, status: res.status });
    } catch (err) {
      return fetch(req);
    }
  })());
});

// Показ push-уведомлений
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'GOLDA', {
    body: d.body || 'Новое сообщение',
    icon: 'icon.svg',
    badge: 'icon.svg',
    tag: 'golda',
    vibrate: [200, 100, 200],
    data: { url: './' }
  }));
});

// Клик по уведомлению открывает сайт
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('./');
  }));
});
