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

  /* режим прокси (без WebSocket): новые сообщения подтягиваем опросом */
  (function () {
    if (!window.GOLDA_API) return;
    let wm = new Date(Date.now() - 20000).toISOString(), polling = false, tick = 0;
    setInterval(async () => {
      if (polling || document.visibilityState !== 'visible' || !alive()) return; polling = true; tick++;
      try {
        const { data } = await sb.from('messages').select('*').gt('created_at', wm).order('created_at', { ascending: true }).limit(100);
        if (data && data.length) {
          wm = data[data.length - 1].created_at;
          let unknown = false;
          for (const m of data) { if (!CHATS.find(c => c.id === m.chat_id)) unknown = true; }
          if (unknown && typeof loadChats === 'function') { await loadChats(); }
          for (const m of data) { if (typeof onMsgInsert === 'function') onMsgInsert(m); }
        }
        if (tick % 6 === 0 && window.refreshYupik) window.refreshYupik();
      } catch (e) { }
      polling = false;
    }, 4000);
  })();
})();
