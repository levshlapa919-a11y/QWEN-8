/* Визуальная доводка: палитры, анимация новых сообщений, тип чата */
(function () {
  'use strict';
  try {
    // живые цвета аватарок и имён (как в Telegram), меняем массивы на месте
    if (typeof GRADS !== 'undefined' && Array.isArray(GRADS)) GRADS.splice(0, GRADS.length,
      'linear-gradient(135deg,#ff885e,#ff516a)', 'linear-gradient(135deg,#ffcd6a,#ffa85c)', 'linear-gradient(135deg,#82b1ff,#665fff)',
      'linear-gradient(135deg,#a0de7e,#54cb68)', 'linear-gradient(135deg,#53edd6,#28c9b7)', 'linear-gradient(135deg,#72d5fd,#2a9ef1)', 'linear-gradient(135deg,#e0a2f3,#d669ed)');
    if (typeof PALETTE !== 'undefined' && Array.isArray(PALETTE)) PALETTE.splice(0, PALETTE.length,
      '#ff7a7a', '#ffb066', '#b09bff', '#8fdc6f', '#5fd9c9', '#6cb8f5', '#f58cc0');
  } catch (e) { }

  const Q = (s, r) => (r || document).querySelector(s);
  // тип открытого чата для стилей (в личных чатах не показываем имя в пузыре)
  function mark() {
    const v = Q('#chatView'); if (!v) return;
    let k = '';
    try { const c = CHATS.find(x => x.id === CURRENT); k = c ? c.type : ''; } catch (e) { }
    if (v.dataset.k !== k) v.dataset.k = k;
  }
  const oc = window.openChat;
  if (typeof oc === 'function') window.openChat = async function () { const r = await oc.apply(this, arguments); mark(); return r; };
  setInterval(mark, 700);

  // плавное появление только для сообщений, пришедших после загрузки
  let armed = false; setTimeout(() => { armed = true; }, 2500);
  const box = () => Q('#messages');
  new MutationObserver(ms => {
    const b = box(); if (!b || !armed) return;
    for (const m of ms) {
      if (m.target !== b || m.addedNodes.length !== 1) continue;
      const n = m.addedNodes[0];
      if (n.classList && n.classList.contains('msg') && n === b.lastElementChild) { n.classList.add('msg-in'); setTimeout(() => n.classList.remove('msg-in'), 400); }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
