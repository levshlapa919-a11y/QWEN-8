/* YZITK Chats: профиль группы в стиле Telegram — шапка, о группе, участники, медиа, файлы, ссылки, управление */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const SYS = /^00000000-/;
  const I = {
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', edit: '<path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>',
    add: '<circle cx="10" cy="8" r="3.600"/><path d="M3 20c0-3.800 3.200-6 7-6 1.300 0 2.500.3 3.500.8"/><path d="M18 14v6M15 17h6"/>',
    out: '<path d="M9 21H5.500a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9M16 17l5-5-5-5M21 12H9"/>', dots: '<circle cx="12" cy="5" r="1.700" fill="currentColor"/><circle cx="12" cy="12" r="1.700" fill="currentColor"/><circle cx="12" cy="19" r="1.700" fill="currentColor"/>',
    file: '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>', link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
    cam: '<path d="M4 8h3l1.500-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>', bell: '<path d="M6 9.500a6 6 0 0 1 12 0c0 5.500 2.200 7 2.200 7H3.800S6 15 6 9.500z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
  };
  const ic = (k, s) => `<svg width="${s || 22}" height="${s || 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.900" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;
  const pl = (n, a, b, c) => { n = Math.abs(n) % 100; const m = n % 10; return n > 10 && n < 20 ? c : m > 1 && m < 5 ? b : m === 1 ? a : c; };
  const dstr = s => { try { return new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
  const seen = p => {
    if (!p) return '';
    if (SYS.test(p.id)) return 'бот';
    const t = p.last_seen && Date.parse(p.last_seen); if (!t) return 'был(а) давно';
    const d = (Date.now() - t) / 60000;
    if (d < 3) return 'в сети'; if (d < 60) return 'был(а) ' + Math.round(d) + ' мин. назад'; if (d < 1440) return 'был(а) сегодня';
    if (d < 2880) return 'был(а) вчера'; return 'был(а) ' + new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };
  const ava = (name, url, sz) => {
    const n = name || '?', st = `width:${sz}px;height:${sz}px;border-radius:50%`;
    if (url) return `<img src="${E(url)}" alt="" style="${st};object-fit:cover;display:block">`;
    let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) | 0;
    const g = G(() => GRADS[Math.abs(h) % GRADS.length]) || 'linear-gradient(135deg,#6b87d9,#3b4f94)';
    return `<div style="${st};background:${g};display:grid;place-items:center;color:#fff;font-weight:700;font-size:${Math.round(sz * .42)}px">${E(n[0].toUpperCase())}</div>`;
  };

  let st = null;
  function close() { const o = Q('#gp'); if (o) { o.classList.remove('on'); setTimeout(() => o.remove(), 220); } st = null; }

  async function open(chat) {
    if (!chat || chat.type !== 'group') return typeof G(() => window.__ogGroup) === 'function' ? window.__ogGroup(chat) : undefined;
    const ov0 = Q('#groupInfoOverlay'); if (ov0) ov0.classList.remove('open');
    Q('#gp') && Q('#gp').remove();
    const o = document.createElement('div'); o.id = 'gp';
    o.innerHTML = '<div class="gp-in"><div class="gp-top"><button class="gp-b" data-a="back" aria-label="Назад">' + ic('back') + '</button><span></span><button class="gp-b gp-ed" data-a="edit" aria-label="Изменить" style="display:none">' + ic('edit') + '</button></div><div id="gpBody"></div></div>';
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    st = { chat, tab: 'm', desc: '', role: 'member', owner: chat.created_by, admins: [], mutes: {}, media: null, files: null, links: null };
    paint();
    o.onclick = onClick;
    const [g, c] = await Promise.all([rpc('group_state', { p_chat: chat.id }), sb.from('chats').select('description,name,avatar_url').eq('id', chat.id).maybeSingle()]);
    if (!st) return;
    if (g.data) { st.role = g.data.role; st.owner = g.data.owner; st.admins = g.data.admins || []; (g.data.mutes || []).forEach(m => st.mutes[m.user] = m.until); st.channel = !!g.data.channel; }
    if (c.data) { st.desc = c.data.description || ''; if (c.data.name) chat.name = c.data.name; chat.avatar_url = c.data.avatar_url; }
    const mgr = st.role === 'owner' || st.role === 'admin'; const eb = Q('.gp-ed', o); if (eb) eb.style.display = mgr ? '' : 'none';
    paint();
  }

  function paint() {
    if (!st) return; const c = st.chat, body = Q('#gpBody'); if (!body) return;
    const mgr = st.role === 'owner' || st.role === 'admin', n = (c.members || []).length;
    const online = (c.members || []).filter(m => m && !SYS.test(m.id) && seen(m) === 'в сети').length;
    const sub = n + ' ' + pl(n, 'участник', 'участника', 'участников') + (online ? ', ' + online + ' в сети' : '');
    const tabs = [['m', 'Участники'], ['p', 'Медиа'], ['f', 'Файлы'], ['l', 'Ссылки']];
    body.innerHTML = `<div class="gp-head"><div class="gp-av">${ava(c.name || 'Г', c.avatar_url, 108)}</div><div class="gp-name">${E(c.name || 'Группа')}</div><div class="gp-sub">${st.channel ? 'канал · ' : ''}${sub}</div></div>
<div class="gp-acts">${mgr ? `<button data-a="add">${ic('add')}<span>Добавить</span></button><button data-a="edit">${ic('edit')}<span>Изменить</span></button>` : ''}<button data-a="leave" class="red">${ic('out')}<span>Выйти</span></button></div>
${st.desc || c.created_at ? `<div class="gp-card">${st.desc ? `<div class="gp-l">О группе</div><div class="gp-t">${E(st.desc).replace(/\n/g, '<br>')}</div>` : ''}${c.created_at ? `<div class="gp-l" style="margin-top:${st.desc ? 12 : 0}px">Создана</div><div class="gp-t">${dstr(c.created_at)}</div>` : ''}</div>` : ''}
<div class="gp-tabs">${tabs.map(t => `<button data-t="${t[0]}" class="${st.tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div><div id="gpTab"></div>`;
    tab();
  }

  function memberRow(m, mgr) {
    const tag = m.id === st.owner ? 'владелец' : st.admins.indexOf(m.id) >= 0 ? 'админ' : '';
    const muted = st.mutes[m.id] ? ' · без голоса' : '';
    return `<div class="gp-row" data-u="${m.id}"><div class="gp-ra">${ava(m.display_name || m.username, m.avatar_url, 46)}</div><div class="gp-rm"><div class="gp-rn">${E(m.display_name || m.username || '—')}${m.id === G(() => ME.id) ? ' <small>(вы)</small>' : ''}</div><div class="gp-rs${seen(m) === 'в сети' ? ' on' : ''}">${E(seen(m))}${muted}</div></div>${tag ? `<span class="gp-tag">${tag}</span>` : ''}${mgr && m.id !== G(() => ME.id) && !SYS.test(m.id) ? `<button class="gp-dots" data-m="${m.id}" aria-label="Управление">${ic('dots', 20)}</button>` : ''}</div>`;
  }

  async function tab() {
    const box = Q('#gpTab'); if (!box || !st) return; const c = st.chat, t = st.tab, mgr = st.role === 'owner' || st.role === 'admin';
    if (t === 'm') {
      const rank = m => m.id === st.owner ? 0 : st.admins.indexOf(m.id) >= 0 ? 1 : 2;
      const ms = (c.members || []).filter(Boolean).slice().sort((a, b) => rank(a) - rank(b) || (seen(a) === 'в сети' ? -1 : 0) - (seen(b) === 'в сети' ? -1 : 0));
      box.innerHTML = '<div class="gp-list">' + ms.map(m => memberRow(m, mgr)).join('') + '</div>'; return;
    }
    box.innerHTML = '<div class="gp-empty">Загрузка…</div>';
    const key = { p: 'media', f: 'files', l: 'links' }[t];
    if (st[key] == null) {
      try {
        const q = (pat) => sb.from('messages').select('id,content,created_at').eq('chat_id', c.id).like('content', pat).order('created_at', { ascending: false }).limit(60);
        let rows = [];
        if (t === 'p') { const r = await Promise.all([q('[[image|%'), q('[[video|%')]); rows = [].concat(...r.map(x => x.data || [])); }
        else if (t === 'f') { const r = await Promise.all([q('[[file|%'), q('[[big|%')]); rows = [].concat(...r.map(x => x.data || [])); }
        else { const r = await sb.from('messages').select('id,content,created_at').eq('chat_id', c.id).ilike('content', '%http%').not('content', 'like', '[[%').order('created_at', { ascending: false }).limit(80); rows = r.data || []; }
        rows.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
        st[key] = rows;
      } catch (e) { st[key] = []; }
    }
    if (!st || st.tab !== t) return; const rows = st[key];
    if (!rows.length) { box.innerHTML = '<div class="gp-empty">' + { p: 'Здесь появятся фото и видео', f: 'Здесь появятся файлы', l: 'Здесь появятся ссылки' }[t] + '</div>'; return; }
    if (t === 'p') {
      box.innerHTML = '<div class="gp-grid">' + rows.map(r => { const md = G(() => parseMedia(r.content)); if (!md) return ''; return md.kind === 'video' ? `<a href="${E(md.url)}" target="_blank" rel="noopener" class="gp-cell"><video src="${E(md.url)}#t=0.1" preload="metadata" muted playsinline></video><i>▶</i></a>` : `<a href="${E(md.url)}" target="_blank" rel="noopener" class="gp-cell"><img src="${E(md.url)}" loading="lazy" alt=""></a>`; }).join('') + '</div>';
    } else if (t === 'f') {
      box.innerHTML = '<div class="gp-list">' + rows.map(r => {
        const m = String(r.content).match(/^\[\[(file|big)\|([^\]]+)\]\]/); if (!m) return ''; const p = m[2].split('|'); let nm = p[m[1] === 'big' ? 2 : 1] || 'файл'; try { nm = decodeURIComponent(nm); } catch (e) { } const sz = +p[m[1] === 'big' ? 3 : 2] || 0; const url = m[1] === 'file' ? p[0] : '';
        return `<${url ? `a href="${E(url)}" target="_blank" rel="noopener"` : 'div'} class="gp-row">${`<div class="gp-fi">${ic('file')}</div>`}<div class="gp-rm"><div class="gp-rn">${E(nm)}</div><div class="gp-rs">${sz ? (sz > 1048576 ? (sz / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round(sz / 1024)) + ' КБ') + ' · ' : ''}${dstr(r.created_at)}</div></div></${url ? 'a' : 'div'}>`;
      }).join('') + '</div>';
    } else {
      const seenU = new Set(), items = [];
      rows.forEach(r => { (String(r.content).match(/https?:\/\/[^\s<>"']+/g) || []).forEach(u => { if (!seenU.has(u)) { seenU.add(u); items.push([u, r.created_at]); } }); });
      box.innerHTML = '<div class="gp-list">' + items.slice(0, 60).map(([u, d]) => { let h = u; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { } return `<a href="${E(u)}" target="_blank" rel="noopener" class="gp-row"><div class="gp-fi">${ic('link')}</div><div class="gp-rm"><div class="gp-rn">${E(h)}</div><div class="gp-rs" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(u)}</div></div></a>`; }).join('') + '</div>';
    }
  }

  function sheet(html, onReady) {
    const ov = document.createElement('div'); ov.className = 'f2-ov'; ov.style.zIndex = 9000;
    ov.innerHTML = '<div class="f2-card">' + html + '</div>'; document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.f2-x')) ov.remove(); });
    onReady && onReady(ov); return ov;
  }
  const refresh = async () => { if (!st) return; const id = st.chat.id; try { await loadChats(); } catch (e) { } const c = CHATS.find(x => x.id === id); if (c) { Object.assign(st.chat, c); st.media = st.files = st.links = null; const r = await rpc('group_state', { p_chat: id }); if (r.data) { st.role = r.data.role; st.owner = r.data.owner; st.admins = r.data.admins || []; st.mutes = {}; (r.data.mutes || []).forEach(m => st.mutes[m.user] = m.until); } paint(); try { renderChatHeader(); } catch (e) { } } else close(); };

  function manage(uid) {
    const u = G(() => PROFILES[uid]) || { username: '?', id: uid }, isAdm = st.admins.indexOf(uid) >= 0, owner = st.role === 'owner', isMuted = !!st.mutes[uid];
    const strong = uid === st.owner || (isAdm && !owner), items = [];
    if (!strong) { items.push(isMuted ? ['unmute', 'Вернуть голос'] : ['m10', 'Заглушить на 10 минут'], ...(isMuted ? [] : [['m60', 'Заглушить на час'], ['m1440', 'Заглушить на сутки']])); items.push(['kick', 'Удалить из группы']); }
    if (owner && uid !== st.owner) items.push([isAdm ? 'unadmin' : 'admin', isAdm ? 'Снять с админов' : 'Сделать админом']);
    items.push(['prof', 'Открыть профиль']);
    sheet(`<div class="f2-h"><b>${E(u.display_name || u.username)}</b><button class="f2-x">✕</button></div>${items.map(i => `<button class="f2-opt${i[0] === 'kick' ? ' gp-danger' : ''}" data-k="${i[0]}">${i[1]}</button>`).join('')}`, ov => {
      ov.addEventListener('click', async e => {
        const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; ov.remove();
        if (k === 'prof') { close(); return G(() => openUserModal(u)); }
        let r;
        if (k === 'kick') { if (!await confirmBox('Удалить ' + (u.display_name || u.username) + '?', 'Человек больше не будет видеть эту группу.')) return; r = await rpc('group_kick', { p_chat: st.chat.id, p_user: uid }); }
        else if (k === 'admin' || k === 'unadmin') r = await rpc('group_set_admin', { p_chat: st.chat.id, p_user: uid, p_admin: k === 'admin' });
        else r = await rpc('group_mute', { p_chat: st.chat.id, p_user: uid, p_minutes: k === 'unmute' ? 0 : +k.slice(1) });
        if (r && r.data && r.data.ok) { tst('Готово'); refresh(); } else tst('Нет прав на это действие', 'red');
      });
    });
  }

  function addUI() {
    const have = new Set((st.chat.members || []).map(m => m.id));
    G(() => fetchAllUsers());
    const cand = (G(() => USERS) || []).filter(u => !have.has(u.id) && !/@bot\.invalid$/.test(u.email || '') && !SYS.test(u.id));
    sheet('<div class="f2-h"><b>Добавить участника</b><button class="f2-x">✕</button></div><input class="f2-in" id="gpQ" placeholder="Поиск по имени" autocomplete="off"><div id="gpL"></div>', ov => {
      const paintL = () => { const q = Q('#gpQ', ov).value.toLowerCase(); Q('#gpL', ov).innerHTML = cand.filter(u => (u.username + ' ' + (u.display_name || '')).toLowerCase().includes(q)).slice(0, 40).map(u => `<button class="f2-opt" data-u="${u.id}">${E(u.display_name || u.username)} <small style="opacity:.6">@${E(u.username)}</small></button>`).join('') || '<div class="gp-empty">Никого не найдено</div>'; };
      paintL(); Q('#gpQ', ov).oninput = paintL;
      ov.addEventListener('click', async e => { const b = e.target.closest('[data-u]'); if (!b) return; ov.remove(); const r = await rpc('group_add_member', { p_chat: st.chat.id, p_user: b.dataset.u }); if (r.data && r.data.ok) { tst('Добавлен'); refresh(); } else tst(r.data && r.data.error === 'privacy' ? 'Человек запретил добавлять себя в группы' : 'Не получилось', 'red'); });
    });
  }

  async function shrink(file, max) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const s = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * s), h = Math.round(img.height * s);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
      return await new Promise(ok => cv.toBlob(b => ok(b), 'image/jpeg', .86));
    } finally { URL.revokeObjectURL(url); }
  }

  function editUI() {
    const c = st.chat; let newAva, delAva = false;
    sheet(`<div class="f2-h"><b>Изменить группу</b><button class="f2-x">✕</button></div>
<div style="display:flex;align-items:center;gap:14px;margin:6px 0 12px"><div id="gpEA">${ava(c.name || 'Г', c.avatar_url, 64)}</div><div><button class="f2-opt" id="gpPick" style="margin:0 0 6px;padding:8px 12px">Выбрать фото</button><button class="f2-opt" id="gpDel" style="margin:0;padding:8px 12px;display:${c.avatar_url ? 'block' : 'none'}">Убрать фото</button></div><input type="file" id="gpFile" accept="image/*" hidden></div>
<input class="f2-in" id="gpN" maxlength="60" placeholder="Название" value="${E(c.name || '')}">
<textarea class="f2-in" id="gpD" rows="4" maxlength="500" placeholder="Описание группы" style="resize:none">${E(st.desc)}</textarea>
<button class="f2-opt" id="gpSave" style="text-align:center;font-weight:700;background:var(--accent,var(--ac,#7f9be6));color:var(--on-ac,#000);border:0">Сохранить</button>`, ov => {
      Q('#gpPick', ov).onclick = () => Q('#gpFile', ov).click();
      Q('#gpFile', ov).onchange = async e => { const f = e.target.files[0]; if (!f) return; const b = await shrink(f, 640); if (!b) return tst('Не удалось прочитать фото', 'red'); newAva = b; delAva = false; Q('#gpEA', ov).innerHTML = ava('', URL.createObjectURL(b), 64); Q('#gpDel', ov).style.display = 'block'; };
      Q('#gpDel', ov).onclick = () => { newAva = null; delAva = true; Q('#gpEA', ov).innerHTML = ava(c.name || 'Г', '', 64); Q('#gpDel', ov).style.display = 'none'; };
      Q('#gpSave', ov).onclick = async () => {
        const btn = Q('#gpSave', ov); btn.disabled = true; btn.textContent = 'Сохраняю…';
        let avatar = null, setA = false;
        try {
          if (newAva) { const path = `groups/${G(() => ME.id)}/${c.id}_${Date.now()}.jpg`; const up = await sb.storage.from('avatars').upload(path, newAva, { contentType: 'image/jpeg' }); if (up.error) throw up.error; avatar = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl; setA = true; }
          else if (delAva) { avatar = ''; setA = true; }
        } catch (e) { btn.disabled = false; btn.textContent = 'Сохранить'; return tst('Не удалось загрузить фото', 'red'); }
        const r = await rpc('group_edit', { p_chat: c.id, p_name: Q('#gpN', ov).value, p_desc: Q('#gpD', ov).value, p_avatar: avatar, p_set_avatar: setA });
        if (r.data && r.data.ok) { ov.remove(); tst('Сохранено'); st.desc = Q('#gpD', ov).value.trim(); refresh(); } else { btn.disabled = false; btn.textContent = 'Сохранить'; tst('Нет прав на изменение', 'red'); }
      };
    });
  }

  async function onClick(e) {
    const t = e.target.closest('[data-t]'); if (t && st) { st.tab = t.dataset.t; QA('.gp-tabs button').forEach(b => b.classList.toggle('on', b === t)); return tab(); }
    const d = e.target.closest('[data-m]'); if (d) { e.stopPropagation(); return manage(d.dataset.m); }
    const a = e.target.closest('[data-a]');
    if (a) {
      const k = a.dataset.a;
      if (k === 'back') return close(); if (k === 'add') return addUI(); if (k === 'edit') return editUI();
      if (k === 'leave') {
        if (!await confirmBox('Покинуть группу?', 'Ты сможешь вернуться, только если тебя добавят снова.')) return;
        const id = st.chat.id, { error } = await sb.from('chat_members').delete().eq('chat_id', id).eq('user_id', ME.id);
        if (error) return tst(G(() => ru(error.message)) || 'Не получилось', 'red'); close(); G(() => removeChatLocal(id)); return;
      }
    }
    const r = e.target.closest('.gp-row[data-u]'); if (r) { const u = G(() => PROFILES[r.dataset.u]); if (u && !SYS.test(u.id)) { close(); G(() => openUserModal(u)); } }
  }

  const _rch = window.renderChatHeader;
  if (typeof _rch === 'function') window.renderChatHeader = function () {
    const r = _rch.apply(this, arguments);
    try { const c = CHATS.find(x => x.id === CURRENT); const h = Q('#headAva'); if (c && c.type === 'group' && c.avatar_url && h) h.innerHTML = `<img class="ava m" src="${E(c.avatar_url)}" alt="">`; } catch (e) { }
    return r;
  };
  window.__ogGroup = window.openGroupInfo;
  window.openGroupInfo = open;
  window.GoldaGroup = { open, close };
})();
