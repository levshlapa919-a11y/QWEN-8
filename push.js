/* golda-mesenger: Web Push (Android + iPhone PWA)
   Подключается ПОСЛЕ основного <script> в index.html.
   Использует глобальные sb, ME, PREFS, CHATS, openChat, toast из index.html */
(function () {
  'use strict';

  // ВСТАВЬ СЮДА ПУБЛИЧНЫЙ VAPID-КЛЮЧ (npx web-push generate-vapid-keys)
  const VAPID_PUBLIC_KEY = 'BF97Zrcj0VeH_GMiuASNdbRwOTSYh1LpmQJG0I6ON-QcSZkhWAIaAbpJVoNvKxcJIUWvZ6MrQ2d5q6R4lgES8b8';

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  function b64ToU8(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }

  async function savePushSubscription() {
    if (!ME || !supported || Notification.permission !== 'granted') return false;
    if (VAPID_PUBLIC_KEY.startsWith('PASTE')) { console.warn('VAPID key not set'); return false; }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID_PUBLIC_KEY) });
      }
      const j = sub.toJSON();
      const { error } = await sb.rpc('register_push', {
        p_endpoint: j.endpoint,
        p_p256dh: j.keys.p256dh,
        p_auth: j.keys.auth,
        p_preview: !!PREFS.preview,
        p_ua: navigator.userAgent.slice(0, 200)
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('push subscribe failed', e);
      return false;
    }
  }

  async function removePushSubscription() {
    try {
      if (!supported) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sb.rpc('unregister_push', { p_endpoint: sub.endpoint });
    } catch (_) {}
  }

  // ===== Баннер =====
  let banner = null;
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }
  function showBanner(html, btnText, onClick, dismissKey) {
    hideBanner();
    if (dismissKey && sessionStorage.getItem(dismissKey)) return;
    banner = document.createElement('div');
    banner.className = 'push-banner';
    banner.innerHTML = `<div class="pb-text">${html}</div>` +
      (btnText ? `<button class="pb-btn" type="button">${btnText}</button>` : '') +
      `<button class="pb-x" type="button" aria-label="Закрыть">✕</button>`;
    document.body.appendChild(banner);
    const b = banner.querySelector('.pb-btn');
    if (b) b.onclick = onClick;
    banner.querySelector('.pb-x').onclick = () => { if (dismissKey) sessionStorage.setItem(dismissKey, '1'); hideBanner(); };
  }

  async function enablePush() {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      const ok = await savePushSubscription();
      hideBanner();
      toast(ok ? '🔔 Push-уведомления включены' : 'Разрешение есть, но подписка не создалась', ok ? '' : 'red');
    } else {
      hideBanner();
      toast('Уведомления отклонены. Включить можно в настройках браузера/телефона', 'red');
    }
  }

  async function initPush() {
    if (!ME) return;
    if (isIOS && !isStandalone) {
      showBanner('📱 На iPhone уведомления работают только из приложения: <b>Поделиться → На экран «Домой»</b>, затем открой иконку GOLDA.', '', null, 'push_ios_hint');
      return;
    }
    if (!supported) return;
    if (Notification.permission === 'granted') { await savePushSubscription(); return; }
    if (Notification.permission === 'default') {
      showBanner('🔔 Включи уведомления, чтобы получать сообщения даже при закрытом приложении', 'Включить', enablePush, 'push_ask');
    }
  }

  // Подменяем вызов из enterApp()
  window.requestNotifPermission = initPush;
  try { requestNotifPermission = initPush; } catch (_) {}

  // Синхронизация настройки «превью» с сервером
  document.addEventListener('click', e => {
    if (e.target.closest('#togglePreview')) setTimeout(savePushSubscription, 300);
    if (e.target.closest('#btnLogout, #settingsLogout')) removePushSubscription();
  }, true);

  // Открытие чата по клику на уведомление
  function openFromId(id) {
    if (!id || typeof CHATS === 'undefined') return;
    const go = () => { if (CHATS.some(c => c.id === id)) openChat(id); };
    if (CHATS.length) go(); else setTimeout(go, 1200);
  }
  if (supported) {
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data && e.data.type === 'open-chat') openFromId(e.data.chatId);
    });
  }
  const qs = new URLSearchParams(location.search);
  if (qs.get('chat')) { setTimeout(() => openFromId(qs.get('chat')), 1500); history.replaceState(null, '', location.pathname); }

  // Сброс бейджа иконки, когда приложение открыто
  function clearBadge() { try { navigator.clearAppBadge && navigator.clearAppBadge(); } catch (_) {} }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { clearBadge(); savePushSubscription(); } });
  clearBadge();
})();
