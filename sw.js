self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: 'icon.svg',
      badge: 'icon.svg',
      tag: e.data.tag || 'golda',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: { url: './' }
    });
  }
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'GOLDA', {
    body: d.body || 'Новое сообщение',
    icon: 'icon.svg',
    badge: 'icon.svg',
    tag: 'golda',
    vibrate: [200, 100, 200],
    data: { url: './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('./');
  }));
});
