/* features5: управление группами/каналами (кик, мут, админы, добавление), обязательные чаты */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const ready = () => typeof ME !== 'undefined' && ME && ME.id && typeof CHATS !== 'undefined';
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const SUPPORT = '00000000-0000-4000-8000-00000000b004';

  const _og = window.openGroupInfo;
  if (typeof _og === 'function') window.openGroupInfo = function (chat) {
    _og.apply(this, arguments);
    decorate(chat);
  };
  async function decorate(chat) {
    const r = await rpc('group_state', { p_chat: chat.id }); const st = r.data; if (!st) return;
    const mgr = st.role === 'owner' || st.role === 'admin';
    const muted = {}; (st.mutes || []).forEach(m => muted[m.user] = m.until);
    const list = Q('#giList'); if (!list) return;
    QA('.pick-row', list).forEach(row => {
      const uid = row.dataset.uid, nm = Q('.pick-name', row); if (!nm) return;
      if (uid === st.owner && !/👑/.test(nm.textContent)) nm.insertAdjacentHTML('beforeend', ' 👑');
      if ((st.admins || []).indexOf(uid) >= 0) nm.insertAdjacentHTML('beforeend', ' 🛡');
      if (muted[uid]) nm.insertAdjacentHTML('beforeend', ' 🔇');
      if (mgr && uid !== ME.id) {
        const b = document.createElement('button'); b.className = 'f5-dots'; b.textContent = '⋯'; b.title = 'Управление';
        b.onclick = e => { e.stopPropagation(); manage(chat, st, uid, !!muted[uid]); }; row.appendChild(b);
      }
    });
    if (mgr && !Q('#f5Add')) {
      const a = document.createElement('button'); a.id = 'f5Add'; a.className = 'f2-btn'; a.textContent = '➕ Добавить участника'; a.onclick = () => addUI(chat);
      list.after(a);
    }
    if (!mgr && Q('#f5Add')) Q('#f5Add').remove();
  }
  const reopen = async chat => { try { await loadChats(); } catch (e) { } const c = CHATS.find(x => x.id === chat.id); if (c) openGroupInfo(c); else { const o = Q('#groupInfoOverlay'); if (o) o.classList.remove('open'); } };
  function manage(chat, st, uid, isMuted) {
    const u = (typeof PROFILES !== 'undefined' && PROFILES[uid]) || { username: '?' }; const isAdm = (st.admins || []).indexOf(uid) >= 0, owner = st.role === 'owner';
    const targetStrong = uid === st.owner || (isAdm && !owner);
    const items = [];
    if (!targetStrong) {
      items.push(isMuted ? ['unmute', '🔊 Снять мут'] : ['m10', '🔇 Мут на 10 минут'], ...(isMuted ? [] : [['m60', '🔇 Мут на 1 час'], ['m1440', '🔇 Мут на 1 день'], ['m525600', '🔇 Мут на год']]));
      items.push(['kick', '🚪 Удалить из группы']);
    }
    if (owner && uid !== st.owner) items.push([isAdm ? 'unadmin' : 'admin', isAdm ? '🛡 Снять админа' : '🛡 Назначить админом']);
    items.push(['prof', '👤 Профиль']);
    const ov = document.createElement('div'); ov.className = 'f2-ov'; ov.style.zIndex = 900;
    ov.innerHTML = `<div class="f2-card"><div class="f2-h"><b>@${E(u.username)}</b><button class="f2-x">✕</button></div>${items.map(i => `<button class="f2-opt" data-k="${i[0]}">${i[1]}</button>`).join('')}</div>`;
    document.body.appendChild(ov);
    ov.onclick = async e => {
      if (e.target === ov || e.target.closest('.f2-x')) return ov.remove();
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; ov.remove();
      if (k === 'prof') { const o = Q('#groupInfoOverlay'); if (o) o.classList.remove('open'); return openUserModal(u); }
      let r;
      if (k === 'kick') { if (!await confirmBox('Удалить @' + u.username + '?', 'Он больше не будет видеть этот чат.')) return; r = await rpc('group_kick', { p_chat: chat.id, p_user: uid }); }
      else if (k === 'admin' || k === 'unadmin') r = await rpc('group_set_admin', { p_chat: chat.id, p_user: uid, p_admin: k === 'admin' });
      else if (k === 'unmute') r = await rpc('group_mute', { p_chat: chat.id, p_user: uid, p_minutes: 0 });
      else r = await rpc('group_mute', { p_chat: chat.id, p_user: uid, p_minutes: +k.slice(1) });
      if (r.data && r.data.ok) { tst('Готово ✔'); reopen(chat); } else tst('Нет прав на это действие', 'red');
    };
  }
  function addUI(chat) {
    const have = new Set((chat.members || []).map(m => m.id));
    const cand = (typeof USERS !== 'undefined' ? USERS : []).filter(u => !have.has(u.id) && !/@bot\.invalid$/.test(u.email || '') && !/^00000000-/.test(u.id));
    const ov = document.createElement('div'); ov.className = 'f2-ov'; ov.style.zIndex = 900;
    ov.innerHTML = `<div class="f2-card"><div class="f2-h"><b>Добавить участника</b><button class="f2-x">✕</button></div><input class="f2-in" id="f5q" placeholder="Поиск по имени"><div id="f5l"></div></div>`;
    document.body.appendChild(ov);
    const paint = () => { const q = Q('#f5q', ov).value.toLowerCase(); Q('#f5l', ov).innerHTML = cand.filter(u => (u.username + ' ' + (u.display_name || '')).toLowerCase().includes(q)).slice(0, 40).map(u => `<button class="f2-opt" data-u="${u.id}">${E(u.display_name || u.username)} <small>@${E(u.username)}</small></button>`).join('') || '<div class="f2-note">Никого нет</div>'; };
    paint(); Q('#f5q', ov).oninput = paint;
    ov.onclick = async e => {
      if (e.target === ov || e.target.closest('.f2-x')) return ov.remove();
      const b = e.target.closest('[data-u]'); if (!b) return; ov.remove();
      const r = await rpc('group_add_member', { p_chat: chat.id, p_user: b.dataset.u });
      if (r.data && r.data.ok) { tst('Добавлен ✔'); reopen(chat); } else tst('Не получилось', 'red');
    };
  }

  /* обязательные чаты: поддержка и GOLD NEW */
  let did = false;
  async function defaults() {
    if (did || !ready()) return; did = true;
    await rpc('ensure_defaults');
    const hasSup = CHATS.some(c => c.type === 'direct' && (c.members || []).some(m => m.id === SUPPORT));
    const hasNews = CHATS.some(c => c.name === 'GOLD NEW');
    if ((!hasSup || !hasNews) && typeof loadChats === 'function') { try { await loadChats(); } catch (e) { } }
  }
  function mandatory() {
    if (!ready() || typeof CURRENT === 'undefined' || !CURRENT) return;
    const c = CHATS.find(x => x.id === CURRENT); if (!c) return;
    const must = c.name === 'GOLD NEW' || (c.type === 'direct' && (c.members || []).some(m => m.id === SUPPORT));
    if (!must) return;
    QA('#chatMenu [data-act="leave"], #chatMenu [data-act="del"]').forEach(b => b.remove());
  }
  setInterval(() => { defaults(); mandatory(); }, 700);
  window.F5 = { ensure: defaults };
})();
