/* golda-mesenger service worker: push + офлайн-оболочка */
const CACHE = 'golda-shell-v7';
const SHELL = ['./', './index.html', './manifest.json', './mobile.css', './push.js', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const hadOld = keys.some(k => k !== CACHE);
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    // новая версия сайта: перезагружаем открытые окна, чтобы у всех сразу был свежий код
    if (hadOld) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach(c => { try { c.navigate(c.url); } catch (_) {} });
    }
  })());
});

// Сеть в приоритете (чтобы обновления приходили сразу), кэш — запасной вариант
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // supabase, шрифты и т.д. не трогаем
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

// ===== PUSH =====
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { data = { body: e.data ? e.data.text() : '' }; }

  const title = data.title || 'golda-mesenger';
  const isCall = data.type === 'call';
  const options = {
    body: data.body || 'Новое сообщение',
    icon: 'icon-192.png',
    badge: 'badge-96.png',
    tag: data.tag || 'golda',
    renotify: true,
    vibrate: isCall ? [600, 250, 600, 250, 600, 250, 600, 250, 600] : [200, 100, 200],
    requireInteraction: isCall,
    data: {
      chatId: data.chatId || null,
      callId: data.callId || null,
      type: data.type || 'msg',
      url: './' + (data.callId && isCall ? '?call=' + data.callId : (data.chatId ? '?chat=' + data.chatId : ''))
    }
  };
  if (isCall) options.actions = [{ action: 'answer', title: 'Ответить' }, { action: 'decline', title: 'Отклонить' }];

  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const focused = list.find(c => c.visibilityState === 'visible' && c.focused);
    if (focused && !isCall) {
      // Приложение открыто и на экране: показываем тихо и сразу убираем
      // (iOS требует показывать уведомление на каждый push)
      options.silent = true;
      await self.registration.showNotification(title, options);
      setTimeout(async () => {
        const ns = await self.registration.getNotifications({ tag: options.tag });
        ns.forEach(n => n.close());
      }, 1200);
      return;
    }
    await self.registration.showNotification(title, options);
    if (self.navigator && self.navigator.setAppBadge) {
      try { await self.navigator.setAppBadge(); } catch (_) {}
    }
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {};
  if (e.action === 'decline') return; // просто закрываем; звонящему уйдёт «нет ответа»
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) {
        await c.focus();
        if (d.type === 'call' && d.callId) c.postMessage({ type: 'open-call', callId: d.callId });
        else c.postMessage({ type: 'open-chat', chatId: d.chatId });
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(d.url || './');
  })());
});
