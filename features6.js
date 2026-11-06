/* features6: улучшенная админ-панель (поиск, фильтры, сортировка, карточка пользователя) */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const isBot = u => /@bot\.invalid$/.test(u.email || '');
  const muted = u => u.muted_until && Date.parse(u.muted_until) > Date.now();
  const online = u => { try { return isOnline(u); } catch (e) { return u.last_seen && Date.now() - Date.parse(u.last_seen) < 120000; } };
  const DAY = 86400000;
  const FILTERS = [['all', 'Все', u => !isBot(u)], ['on', '🟢 Онлайн', u => !isBot(u) && online(u)], ['new', '🆕 Новые 7д', u => !isBot(u) && Date.now() - Date.parse(u.created_at) < 7 * DAY], ['adm', '⚡ Админы', u => u.is_admin && !isBot(u)], ['mute', '🔇 В муте', u => muted(u)], ['ban', '⛔ Забанены', u => u.is_banned], ['bot', '🤖 Боты', u => isBot(u)]];
  const SORTS = { reg: ['Сначала новые', (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)], seen: ['По последнему входу', (a, b) => Date.parse(b.last_seen || 0) - Date.parse(a.last_seen || 0)], name: ['По имени', (a, b) => String(a.display_name || a.username).localeCompare(String(b.display_name || b.username), 'ru')], old: ['Сначала старые', (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)] };
  const S = { q: '', f: 'all', sort: 'seen', open: null, limit: 40 };
  const ownerMail = () => { try { return OWNER_EMAIL; } catch (e) { return null; } };
  const iAmOwner = () => { try { return isOwner(); } catch (e) { return false; } };
  const seen = u => { try { return online(u) ? '<span class="st-on">● в сети</span>' : fmtLastSeen(u.last_seen); } catch (e) { return ''; } };
  const date = d => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

  function match(u) {
    const q = S.q.trim().toLowerCase(); if (!q) return true;
    return [u.username, u.display_name, u.email, u.id].some(v => String(v || '').toLowerCase().includes(q));
  }
  function card(u) {
    const self = u.id === ME.id, own = u.email === ownerMail(), prot = own || self, isO = S.open === u.id;
    const tags = (own ? '<span class="tag gold">👑 Создатель</span>' : self ? '<span class="tag green">это ты</span>' : '') + (u.is_admin && !own ? '<span class="tag gold">админ</span>' : '') + (u.is_banned ? '<span class="tag red">бан</span>' : '') + (muted(u) ? '<span class="tag green">🔇 до ' + new Date(u.muted_until).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + '</span>' : '') + (isBot(u) ? '<span class="tag">бот</span>' : '');
    let h = `<div class="f6-row ${isO ? 'open' : ''}" data-id="${u.id}"><div class="f6-head">${avatarHTML(u, 's')}<div class="f6-main"><div class="f6-name">${E(u.display_name || u.username)} ${tags}</div><div class="f6-sub">@${E(u.username)} · ${seen(u)}</div></div><span class="f6-arr">${isO ? '▴' : '▾'}</span></div>`;
    if (isO) {
      h += `<div class="f6-body"><div class="f6-info"><div><small>Почта</small><b class="f6-copy" data-copy="${E(u.email)}">${E(u.email)}</b></div><div><small>Регистрация</small><b>${date(u.created_at)}</b></div><div><small>Gold</small><b id="f6g">…</b></div><div><small>Праймики</small><b id="f6p">…</b></div><div><small>ID</small><b class="f6-copy" data-copy="${u.id}">${u.id.slice(0, 8)}…</b></div></div><div class="f6-acts" data-uid="${u.id}">`;
      h += '<button data-a="chats">👁 Чаты</button><button data-a="dm">✉️ Написать</button>';
      if (prot) h += '<span class="f6-lock">🔒 защищён от действий</span>';
      else {
        h += '<button data-a="m10">🔇 10м</button><button data-a="m60">🔇 1ч</button><button data-a="m1440">🔇 24ч</button><button data-a="mc">🔇 Своё…</button>';
        if (muted(u)) h += '<button data-a="unmute">🔓 Размут</button>';
        h += `<button class="${u.is_banned ? 'ok' : 'bad'}" data-a="ban">${u.is_banned ? '✔ Разбанить' : '⛔ Бан'}</button><button class="${u.is_admin ? 'bad' : 'ok'}" data-a="adm">${u.is_admin ? '🚫 Снять админа' : '⚡ Сделать админом'}</button>`;
        if (iAmOwner()) h += '<button class="bad" data-a="del">🗑 Удалить</button>';
      }
      h += '</div></div>';
    }
    return h + '</div>';
  }
  function paint() {
    const pane = Q('#admUserList'); if (!pane) return;
    const f = FILTERS.find(x => x[0] === S.f) || FILTERS[0];
    const all = USERS.filter(match), cnt = k => all.filter(FILTERS.find(x => x[0] === k)[2]).length;
    const list = all.filter(f[2]).sort(SORTS[S.sort][1]);
    const chips = QA('.f6-chip'); if (chips.length) chips.forEach(c => { const k = c.dataset.f; c.classList.toggle('on', k === S.f); c.querySelector('i').textContent = cnt(k); });
    const box = Q('#f6List'); if (!box) return;
    box.innerHTML = list.slice(0, S.limit).map(card).join('') || '<div class="empty-note">Никого не нашли</div>';
    if (list.length > S.limit) box.insertAdjacentHTML('beforeend', `<button class="f6-more" id="f6more">Показать ещё (${list.length - S.limit})</button>`);
    const t = Q('#f6Count'); if (t) t.textContent = 'Найдено: ' + list.length;
    if (S.open) { loadBal(S.open); }
  }
  async function loadBal(uid) {
    try {
      const [g, p] = await Promise.all([sb.from('gold_wallets').select('balance_t').eq('user_id', uid).maybeSingle(), sb.from('prime_wallets').select('balance_t').eq('user_id', uid).maybeSingle()]);
      const f = v => { const s = String(v == null ? '0' : v).split('.')[0]; return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
      const a = Q('#f6g'), b = Q('#f6p'); if (a) a.textContent = f(g.data && g.data.balance_t); if (b) b.textContent = f(p.data && p.data.balance_t);
    } catch (e) { }
  }
  function stats() {
    const hu = USERS.filter(u => !isBot(u));
    return [['Всего', hu.length], ['Онлайн', hu.filter(online).length], ['За сутки', hu.filter(u => Date.now() - Date.parse(u.created_at) < DAY).length], ['Бан/мут', hu.filter(u => u.is_banned || muted(u)).length]].map(s => `<div class="f6-st"><b>${s[1]}</b><small>${s[0]}</small></div>`).join('');
  }
  window.refreshAdminUsers = async function () {
    await fetchAllUsers();
    const pane = Q('#admUserList'); if (!pane) return;
    if (!Q('#f6Top')) {
      pane.innerHTML = `<div id="f6Top" class="f6-top"><div class="f6-stats" id="f6Stats"></div><input class="f2-in" id="f6q" placeholder="🔎 Поиск: имя, @username, почта или ID" autocomplete="off"><div class="f6-chips">${FILTERS.map(x => `<button class="f6-chip" data-f="${x[0]}">${x[1]} <i>0</i></button>`).join('')}</div><div class="f6-bar"><span id="f6Count"></span><select id="f6sort" class="f6-sel">${Object.keys(SORTS).map(k => `<option value="${k}" ${k === S.sort ? 'selected' : ''}>${SORTS[k][0]}</option>`).join('')}</select></div></div><div id="f6List"></div>`;
      let t; Q('#f6q').oninput = e => { clearTimeout(t); t = setTimeout(() => { S.q = e.target.value; S.limit = 40; S.open = null; paint(); }, 200); };
      Q('#f6sort').onchange = e => { S.sort = e.target.value; paint(); };
      pane.addEventListener('click', onClick);
    }
    Q('#f6Stats').innerHTML = stats(); paint();
  };
  async function onClick(e) {
    const chip = e.target.closest('.f6-chip'); if (chip) { S.f = chip.dataset.f; S.limit = 40; S.open = null; return paint(); }
    if (e.target.closest('#f6more')) { S.limit += 40; return paint(); }
    const cp = e.target.closest('[data-copy]'); if (cp) { try { await navigator.clipboard.writeText(cp.dataset.copy); tst('Скопировано ✔'); } catch (er) { } return; }
    const a = e.target.closest('.f6-acts [data-a]');
    if (a) { e.stopPropagation(); return act(a.closest('[data-uid]').dataset.uid, a.dataset.a); }
    const head = e.target.closest('.f6-head'); if (head) { const id = head.parentNode.dataset.id; S.open = S.open === id ? null : id; paint(); const r = Q('.f6-row.open'); if (r) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  async function act(uid, k) {
    const u = USERS.find(x => x.id === uid); if (!u) return;
    if (k === 'chats') return showUserChats(uid);
    if (k === 'dm') { const o = Q('#adminOverlay'); if (o) o.classList.remove('open'); return openDirectWith(uid); }
    if (u.email === ownerMail() && k !== 'chats') return tst('👑 Создателя нельзя трогать', 'red');
    if (uid === ME.id) return tst('На себе нельзя', 'red');
    if (k === 'del') { if (!await confirmBox('Удалить аккаунт?', 'Все данные пользователя будут удалены безвозвратно.')) return; const { error } = await sb.from('profiles').delete().eq('id', uid); if (error) return tst('Ошибка: ' + ru(error.message), 'red'); tst('Аккаунт удалён ✔'); S.open = null; return window.refreshAdminUsers(); }
    let upd;
    if (k === 'ban') upd = { is_banned: !u.is_banned };
    else if (k === 'adm') upd = { is_admin: !u.is_admin };
    else if (k === 'unmute') upd = { muted_until: null };
    else {
      let mins = { m10: 10, m60: 60, m1440: 1440 }[k];
      if (k === 'mc') { const v = prompt('На сколько минут замутить? (например 30, или 10080 = неделя)'); mins = parseInt(v, 10); if (!mins || mins <= 0) return; }
      upd = { muted_until: new Date(Date.now() + mins * 60000).toISOString() };
    }
    if (k === 'ban' && !u.is_banned && !await confirmBox('Забанить @' + u.username + '?', 'Он потеряет доступ к мессенджеру.')) return;
    const { error } = await sb.from('profiles').update(upd).eq('id', uid); if (error) return tst(ru(error.message), 'red');
    tst('Готово ✔'); await fetchAllUsers(); Q('#f6Stats').innerHTML = stats(); paint();
  }
})();
