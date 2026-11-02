/* golda-mesenger: после сворачивания/выхода из приложения чаты и сообщения подтягиваются сами, без перезахода */
(function () {
  'use strict';
  let busy = false, lastHide = Date.now();
  const alive = () => typeof ME !== 'undefined' && ME && document.getElementById('app') && !document.getElementById('app').classList.contains('hidden');
  async function resync(force) {
    if (busy || !alive()) return; busy = true;
    try {
      try { await sb.auth.getSession(); } catch (e) { }
      if (typeof subscribeRT === 'function') subscribeRT();
      if (typeof loadChats === 'function') await loadChats();
      if (typeof renderChatList === 'function') renderChatList();
      if (typeof CURRENT !== 'undefined' && CURRENT && typeof openChat === 'function') {
        const inp = document.getElementById('msgInput');
        if (!(inp && inp.value)) await openChat(CURRENT);
      }
      if (window.refreshYupik) window.refreshYupik();
    } catch (e) { console.error('resume', e); }
    busy = false;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { lastHide = Date.now(); return; }
    if (Date.now() - lastHide > 4000) resync();
  });
  addEventListener('pageshow', e => { if (e.persisted) resync(); });
  addEventListener('online', () => resync());
  /* страховка: если канал реального времени отвалился — пересоздаём */
  setInterval(() => {
    if (document.visibilityState !== 'visible' || !alive()) return;
    try { if (typeof rtChannel !== 'undefined' && rtChannel && rtChannel.state !== 'joined') resync(); } catch (e) { }
  }, 15000);
})();
