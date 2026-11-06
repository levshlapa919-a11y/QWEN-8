/* core-fix: правка сообщений и ответы реально работают; в длинных чатах открываются НОВЫЕ сообщения + подгрузка старых */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s);
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };

  async function send() {
    const inp = Q('#msgInput'); if (!inp) return;
    const text = inp.value.trim();
    if (!text || !CURRENT || restricted()) return;
    const V = window.V3 || {};
    if (V.edit && V.trySendEdit) {
      if (text === String(V.edit.content || '').trim()) { V.edit = null; inp.value = ''; inp.style.height = 'auto'; try { V.afterSend && V.afterSend(); } catch (e) { } return tst('Без изменений'); }
      const eid = V.edit.id;
      await V.trySendEdit(text);
      const chat0 = CHATS.find(c => c.id === CURRENT); if (chat0 && chat0.lastMsg && chat0.lastMsg.id === eid) { chat0.lastMsg = Object.assign({}, chat0.lastMsg, { content: text }); renderChatList(); }
      return;
    }
    const chat = CHATS.find(c => c.id === CURRENT);
    if (chat.type === 'direct' && BLOCKED.includes(otherOf(chat).id)) { tst('Сначала разблокируй пользователя'); return; }
    inp.value = ''; inp.style.height = 'auto'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    const row = { chat_id: CURRENT, sender_id: IMPERSONATE_USER ? IMPERSONATE_USER.id : ME.id, content: text };
    try { if (V.sendExtra) Object.assign(row, V.sendExtra()); } catch (e) { }
    const { data, error } = await sb.from('messages').insert(row).select().single();
    if (error) { inp.value = text; tst('Ошибка: ' + ru(error.message), 'red'); return; }
    try { V.afterSend && V.afterSend(); } catch (e) { }
    if (!MSG_IDS.has(data.id)) { MSG_IDS.add(data.id); chat.lastMsg = data; appendMsg(data, chat); scrollBottom(); renderChatList(); }
  }
  window.send = send;
  const sb_ = Q('#sendBtn'); if (sb_) sb_.onclick = send;

  /* подгрузка старых сообщений */
  const _oc = window.openChat;
  window.openChat = async function (id) {
    await _oc.apply(this, arguments);
    setTimeout(addOlder, 50);
  };
  function addOlder() {
    const box = Q('#messages'); if (!box || !window.__moreOlder || Q('#olderBtn')) return;
    const b = document.createElement('button'); b.id = 'olderBtn'; b.className = 'older-btn'; b.textContent = '↑ Загрузить более ранние сообщения';
    box.prepend(b);
    b.onclick = async () => {
      if (!window.__firstTs) return; b.disabled = true; b.textContent = 'Загрузка…';
      const id = CURRENT, chat = CHATS.find(c => c.id === id);
      const { data } = await sb.from('messages').select('*').eq('chat_id', id).lt('created_at', window.__firstTs).order('created_at', { ascending: false }).limit(300);
      if (id !== CURRENT) return;
      const list = (data || []).slice().reverse();
      if (!list.length) { b.remove(); window.__moreOlder = false; return; }
      const sc = Q('#msgScroll'), h0 = sc ? sc.scrollHeight : 0;
      let html = '', last = '';
      for (const m of list) { if (MSG_IDS.has(m.id)) continue; MSG_IDS.add(m.id); const d = dayLabel(m.created_at); if (d !== last) { html += `<div class="day">${d}</div>`; last = d; } html += msgHTML(m, chat); }
      b.insertAdjacentHTML('afterend', html);
      window.__firstTs = list[0].created_at; window.__moreOlder = list.length >= 300;
      if (sc) sc.scrollTop += sc.scrollHeight - h0;
      if (window.__moreOlder) { b.disabled = false; b.textContent = '↑ Загрузить более ранние сообщения'; } else b.remove();
    };
  }
})();
