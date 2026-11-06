/* features4: каналы, помощник, папки, поиск по сообщениям, стикер-паки */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const ready = () => typeof ME !== 'undefined' && ME && ME.id && typeof CHATS !== 'undefined';
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const M = (t, b, mount) => F2.modal(t, b, mount);
  const ttl = c => { try { return titleOf(c); } catch (e) { return c.name || 'Чат'; } };

  /* ---------- быстрые кнопки ---------- */
  function mountQuick() {
    const s = Q('.search'); if (!s) return setTimeout(mountQuick, 800);
    if (Q('#f4Quick')) return;
    const d = document.createElement('div'); d.id = 'f4Quick'; d.className = 'f4-quick';
    d.innerHTML = '<button data-q="helper">🤖 Помощник</button><button data-q="chan">📣 Каналы</button><button data-q="find">🔎 Поиск</button><button data-q="stk">🎭 Паки</button>';
    s.after(d);
    const f = document.createElement('div'); f.id = 'f4Folders'; f.className = 'f4-folders'; d.after(f);
    d.onclick = e => { const b = e.target.closest('[data-q]'); if (!b) return; ({ helper: openHelper, chan: channelsUI, find: searchUI, stk: packsUI })[b.dataset.q](); };
    renderFolders();
  }
  /* ---------- помощник ---------- */
  async function openHelper() {
    const r = await rpc('open_helper'); if (!r.data) return tst('Не удалось открыть помощника', 'red');
    if (typeof loadChats === 'function') await loadChats();
    if (typeof openChat === 'function') openChat(r.data);
  }

  /* ---------- каналы ---------- */
  function channelsUI() {
    M('📣 Каналы', `<input class="f2-in" id="cq" placeholder="Поиск каналов"><div id="cl" class="g3-body">…</div><button class="f2-btn" id="cnew">＋ Создать канал</button>`, (ov, close) => {
      const load = async () => {
        const r = await rpc('list_channels', { p_q: Q('#cq', ov).value.trim() }); const l = r.data || [];
        Q('#cl', ov).innerHTML = l.length ? l.map(c => `<div class="g3-task"><div style="min-width:0"><b>📣 ${E(c.name)}</b><div class="g3-s">${E(c.description || '')}</div><div class="g3-s">${c.subs} подписчиков · ${E(c.owner || '')}</div></div><button class="f2-chip" data-j="${c.id}">${c.joined ? 'Открыть' : 'Подписаться'}</button></div>`).join('') : '<div class="f2-note">Каналов пока нет — создай первый</div>';
      };
      let t; Q('#cq', ov).oninput = () => { clearTimeout(t); t = setTimeout(load, 300); }; load();
      ov.addEventListener('click', async e => {
        const b = e.target.closest('[data-j]'); if (!b) return;
        if (b.textContent !== 'Открыть') { const r = await rpc('join_channel', { p_id: b.dataset.j }); if (!r.data || !r.data.ok) return tst('Не получилось', 'red'); }
        if (typeof loadChats === 'function') await loadChats(); close(); if (typeof openChat === 'function') openChat(b.dataset.j);
      });
      Q('#cnew', ov).onclick = () => { close(); M('Новый канал', `<input class="f2-in" id="cn" maxlength="60" placeholder="Название"><input class="f2-in" id="cd" maxlength="300" placeholder="Описание"><label class="f2-chk"><input type="checkbox" id="cp" checked> Публичный (виден в поиске)</label><div class="f2-note">В канале пишешь только ты, подписчики читают и реагируют.</div><button class="f2-btn" id="cgo">Создать</button>`, (o2, c2) => {
        Q('#cgo', o2).onclick = async () => { const n = Q('#cn', o2).value.trim(); if (!n) return tst('Нужно название', 'red'); const r = await rpc('create_channel', { p_name: n, p_desc: Q('#cd', o2).value.trim(), p_public: Q('#cp', o2).checked }); if (!r.data || !r.data.ok) return tst('Не вышло', 'red'); c2(); if (typeof loadChats === 'function') await loadChats(); openChat(r.data.id); tst('Канал создан 📣'); };
      }); };
    });
  }
  let chanFor = null, bar = null;
  async function checkChannel() {
    if (!ready()) return; const cur = typeof CURRENT !== 'undefined' ? CURRENT : null; if (cur === chanFor) return; chanFor = cur;
    const ib = Q('#inputBar'); if (bar) { bar.remove(); bar = null; } if (ib && !(ME.is_banned)) ib.classList.remove('hidden');
    if (!cur) return; const r = await rpc('channel_info', { p_chat: cur }); if (cur !== CURRENT || !r.data) return;
    const info = r.data; const mine = info.owner === ME.id;
    const sub = Q('#headSub'); if (sub) sub.textContent = '📣 канал · ' + info.subs + ' подписчиков';
    if (!mine && ib) { ib.classList.add('hidden'); bar = document.createElement('div'); bar.className = 'f4-chbar'; bar.textContent = '📣 Канал · пишет только владелец'; ib.after(bar); }
  }

  /* ---------- папки ---------- */
  let FOLD = [], curFold = null;
  async function loadFolders() { if (!ready()) return; const { data } = await sb.from('chat_folders').select('*').eq('user_id', ME.id).order('pos'); FOLD = data || []; renderFolders(); applyFolder(); }
  function renderFolders() {
    const f = Q('#f4Folders'); if (!f) return;
    if (!FOLD.length) { f.innerHTML = '<button class="f4-t add" data-f="new">📁 Папка</button>'; return; }
    f.innerHTML = `<button class="f4-t ${!curFold ? 'on' : ''}" data-f="all">Все</button>` + FOLD.map(x => `<button class="f4-t ${curFold === x.id ? 'on' : ''}" data-f="${x.id}">${E(x.name)}</button>`).join('') + '<button class="f4-t add" data-f="new">＋</button>' + (curFold ? '<button class="f4-t add" data-f="edit">✎</button>' : '');
  }
  document.addEventListener('click', e => { const b = e.target.closest('#f4Folders [data-f]'); if (!b) return; const k = b.dataset.f; if (k === 'new') return folderEdit(null); if (k === 'edit') return folderEdit(FOLD.find(x => x.id === curFold)); curFold = k === 'all' ? null : k; renderFolders(); applyFolder(); });
  function applyFolder() { const f = FOLD.find(x => x.id === curFold); QA('#chatList .chat-item').forEach(el => { if (f && f.chat_ids.indexOf(el.dataset.id) < 0) el.style.display = 'none'; else if (el.style.display === 'none' && !hiddenByOther(el)) el.style.display = ''; }); }
  const hiddenByOther = el => { try { return JSON.parse(localStorage.getItem('golda_hidden') || '[]').indexOf(el.dataset.id) >= 0; } catch (e) { return false; } };
  const _rcl = window.renderChatList;
  if (typeof _rcl === 'function') window.renderChatList = function () { const r = _rcl.apply(this, arguments); try { applyFolder(); } catch (e) { } return r; };
  function folderEdit(f) {
    const sel = new Set(f ? f.chat_ids : []);
    M(f ? 'Папка' : 'Новая папка', `<input class="f2-in" id="fn" maxlength="30" placeholder="Название" value="${E(f ? f.name : '')}"><div class="g3-h">Чаты в папке</div><div id="fc">${CHATS.map(c => `<label class="f2-chk"><input type="checkbox" data-c="${c.id}" ${sel.has(c.id) ? 'checked' : ''}> ${E(ttl(c))}</label>`).join('')}</div><button class="f2-btn" id="fs">Сохранить</button>${f ? '<button class="f2-btn ghost" id="fd">Удалить папку</button>' : ''}`, (ov, close) => {
      Q('#fs', ov).onclick = async () => { const name = Q('#fn', ov).value.trim(); if (!name) return tst('Нужно название', 'red'); const ids = QA('[data-c]', ov).filter(x => x.checked).map(x => x.dataset.c); const row = { user_id: ME.id, name, chat_ids: ids }; const r = f ? await sb.from('chat_folders').update(row).eq('id', f.id) : await sb.from('chat_folders').insert(Object.assign(row, { pos: FOLD.length })); if (r.error) return tst('Не вышло', 'red'); close(); await loadFolders(); };
      const d = Q('#fd', ov); if (d) d.onclick = async () => { await sb.from('chat_folders').delete().eq('id', f.id); curFold = null; close(); await loadFolders(); };
    });
  }

  /* ---------- поиск по всем сообщениям ---------- */
  function searchUI() {
    M('🔎 Поиск по сообщениям', `<input class="f2-in" id="sq" placeholder="Что ищем? (от 2 букв)" autofocus><div id="sr" class="g3-body"><div class="f2-note">Ищу во всех твоих чатах</div></div>`, (ov, close) => {
      let t; const inp = Q('#sq', ov); setTimeout(() => inp.focus(), 100);
      inp.oninput = () => { clearTimeout(t); t = setTimeout(async () => {
        const q = inp.value.trim(); if (q.length < 2) return; const r = await rpc('search_messages', { p_q: q }); const l = r.data || [];
        Q('#sr', ov).innerHTML = l.length ? l.map(m => { const c = CHATS.find(x => x.id === m.chat_id); return `<div class="f4-hit" data-c="${m.chat_id}" data-m="${m.id}"><div class="g3-s">${E(c ? ttl(c) : 'Чат')} · ${E(m.sender || '')} · ${new Date(m.created_at).toLocaleDateString('ru-RU')}</div><div>${E(m.content).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), s => '<mark>' + s + '</mark>')}</div></div>`; }).join('') : '<div class="f2-note">Ничего не найдено</div>';
      }, 350); };
      ov.addEventListener('click', async e => { const h = e.target.closest('.f4-hit'); if (!h) return; close(); await openChat(h.dataset.c); let n = 0; const go = () => { const el = Q('.msg[data-id="' + h.dataset.m + '"]'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('f2-flash'); setTimeout(() => el.classList.remove('f2-flash'), 1600); } else if (n++ < 6) setTimeout(go, 400); else tst('Сообщение далеко вверх по истории'); }; setTimeout(go, 500); });
    });
  }

  /* ---------- стикер-паки ---------- */
  async function packsUI() {
    M('🎭 Стикер-паки', `<div id="pk" class="g3-body">…</div><button class="f2-btn" id="pnew">＋ Создать пак из моих стикеров</button>`, (ov, close) => {
      const load = async () => { const r = await rpc('list_packs'); const l = r.data || [];
        Q('#pk', ov).innerHTML = l.length ? l.map(p => `<div class="g3-task"><div style="min-width:0"><b>${E(p.name)}</b><div class="g3-s">${p.cnt} шт. · ${E(p.owner || '')}</div><div class="f4-pv">${(p.preview || []).map(u => `<img src="${E(u)}" alt="">`).join('')}</div></div><div><button class="f2-chip" data-a="${p.id}">Добавить</button>${p.mine ? ` <button class="f2-chip" data-d="${p.id}">🗑</button>` : ''}</div></div>`).join('') : '<div class="f2-note">Паков пока нет — собери свой</div>'; };
      load();
      ov.addEventListener('click', async e => {
        const a = e.target.closest('[data-a]'), d = e.target.closest('[data-d]');
        if (a) { const r = await rpc('add_pack', { p_id: a.dataset.a }); tst(r.data && r.data.ok ? 'Добавлено стикеров: ' + r.data.added : 'Не вышло', r.data && r.data.ok ? '' : 'red'); }
        if (d) { await rpc('delete_pack', { p_id: d.dataset.d }); load(); }
      });
      Q('#pnew', ov).onclick = async () => {
        const { data } = await sb.from('user_stickers').select('url').eq('user_id', ME.id); const st = data || [];
        if (!st.length) return tst('Сначала сохрани свои стикеры (долгое нажатие на стикер в чате → «Добавить в мои стикеры»)', 'red');
        close(); M('Новый пак', `<input class="f2-in" id="pn" maxlength="40" placeholder="Название пака"><div class="g3-grid">${st.map(s => `<div class="g3-cell" data-u="${E(s.url)}"><img src="${E(s.url)}" alt=""></div>`).join('')}</div><button class="f2-btn" id="pgo2">Создать</button>`, (o2, c2) => {
          const sel = new Set(); o2.addEventListener('click', e => { const c = e.target.closest('[data-u]'); if (!c) return; const u = c.dataset.u; if (sel.has(u)) sel.delete(u); else if (sel.size < 30) sel.add(u); c.classList.toggle('sel', sel.has(u)); });
          Q('#pgo2', o2).onclick = async () => { const n = Q('#pn', o2).value.trim(); if (!n || !sel.size) return tst('Название и хотя бы один стикер', 'red'); const r = await rpc('create_pack', { p_name: n, p_urls: [...sel] }); if (r.data && r.data.ok) { c2(); tst('Пак создан 🎭'); } else tst('Не вышло', 'red'); };
        });
      };
    });
  }

  /* ---------- аватар бота (создатель) ---------- */
  const BOTIDS = ['00000000-0000-4000-8000-00000000b001', '00000000-0000-4000-8000-00000000b002', '00000000-0000-4000-8000-00000000b003', '00000000-0000-4000-8000-000000901d07'];
  let owner = null; (async function () { const r = await rpc('am_owner'); owner = !!r.data; })();
  const _ou = window.openUserModal;
  if (typeof _ou === 'function') window.openUserModal = function (u) {
    _ou.apply(this, arguments);
    if (!u || BOTIDS.indexOf(u.id) < 0) return;
    setTimeout(async () => {
      if (owner === null) { const r = await rpc('am_owner'); owner = !!r.data; } if (!owner) return;
      const sec = Q('#uGiftSec'); if (!sec) return; let box = Q('#uBotAva'); if (!box) { box = document.createElement('div'); box.id = 'uBotAva'; box.className = 'tg-sec'; sec.before(box); }
      box.innerHTML = '<div class="tg-sec-h">👑 Создатель</div><button class="f2-btn ghost" id="baBtn">🖼 Сменить аватарку бота</button><button class="f2-btn ghost" id="baDel">Убрать аватарку</button>';
      const save = async url => { const r = await rpc('owner_set_bot_avatar', { p_bot: u.id, p_url: url }); if (!r.data || !r.data.ok) return tst('Не вышло', 'red'); try { PROFILES[u.id] = Object.assign(PROFILES[u.id] || {}, { avatar_url: url || null }); u.avatar_url = url || null; renderChatList(); if (CURRENT) renderChatHeader(); const a = Q('#uAva'); if (a) a.innerHTML = avatarHTML(u, 'l'); } catch (e) { } tst('Аватарка бота обновлена ✔'); };
      Q('#baBtn', box).onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { const f = i.files[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) return tst('Файл больше 5 МБ', 'red'); tst('Загружаю…'); const ext = (f.name.match(/\.([a-z0-9]{2,5})$/i) || [, 'png'])[1].toLowerCase(); let path = ME.id + '/bot_' + u.id.slice(-4) + '_' + Date.now() + '.' + ext; let up = await sb.storage.from('avatars').upload(path, f, { contentType: f.type || 'image/png' }); if (up.error) return tst('Не загрузилось: ' + up.error.message, 'red'); save(sb.storage.from('avatars').getPublicUrl(path).data.publicUrl); }; i.click(); };
      Q('#baDel', box).onclick = () => save('');
    }, 300);
  };

  setInterval(() => { if (!ready()) return; checkChannel(); if (!window.__f4f && ME) { window.__f4f = 1; loadFolders(); } }, 800);
  mountQuick();
  window.F4 = { channels: channelsUI, search: searchUI, packs: packsUI, helper: openHelper };
})();
