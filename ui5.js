/* Clean: боковое меню, экран настроек, FAB, пользовательские параметры оформления */
(function () {
  'use strict';
  const Q = s => document.querySelector(s), QA = s => [...document.querySelectorAll(s)];
  const LS = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const isClean = () => document.documentElement.getAttribute('data-ui') === 'clean';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = v => { const s = String(v == null ? '0' : v).split('.')[0]; if (/^-?inf/i.test(s)) return '∞'; return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  const I = (d, sz) => `<svg width="${sz || 24}" height="${sz || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.5 2.4 3.5 5.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/>', group: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5M15.5 14.2c2.8-.3 5 1.3 5 4.3"/>',
    bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16.5h6"/>', mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', sticker: '<path d="M20 12a8 8 0 1 1-8-8h1a7 7 0 0 0 7 7z"/><path d="M9 10h.01M13 14c-1 1-2.5 1-3.5 0"/>',
    game: '<rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11h.01M18 13.5h.01"/>', cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a2 2 0 0 0 3 4M16 6h3a2 2 0 0 1-3 4M12 13v4M8.5 20h7"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a2 2 0 0 0 3.4 0"/>', vib: '<path d="M8 4h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM2.5 9v6M21.5 9v6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01"/>',
    text: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>', img: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', key: '<path d="M4 17l6-6M14.5 3.5a5 5 0 1 1-1.5 9.8L10 17H7v3H4v-3l8-8"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', down: '<path d="M12 3v12M7 11l5 5 5-5M5 20h14"/>', phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', back: '<path d="M15 18l-6-6 6-6"/>', coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', enter: '<path d="M20 5v6a3 3 0 0 1-3 3H5M9 18l-4-4 4-4"/>', anim: '<path d="M5 12a7 7 0 0 1 14 0M3 12h3M18 12h3M12 5v-2M12 21v-2"/><circle cx="12" cy="12" r="2"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
  };
  const ic = (k, sz) => I(P[k], sz);
  const call = (fn) => { try { fn && fn(); } catch (e) { console.error(e); } };
  const clickQ = sel => { const e = Q(sel); e && e.click(); };


  /* ---------- замена эмодзи на значки ---------- */
  const EMO = { '🚪': 'out', '🗑': 'trash', '✍': 'pen', '🔓': 'lock', '🔒': 'lock', '🚫': 'ban', '📊': 'chart', '📸': 'cam', '⏱': 'timer', '⏰': 'timer', '🙈': 'eye', '💬': 'chat', '📞': 'phoneC', '📁': 'folder', '✉': 'send', '🔔': 'bell', '🔕': 'bell', '📌': 'pin', '🎁': 'gift', '👤': 'user', '🔑': 'key', '🛡': 'shield', '⚙': 'gear', '👥': 'users', '📣': 'mega', '🎭': 'sticker', '🤖': 'bot', '🔎': 'search', '🎮': 'game', '🏆': 'cup' };
  Object.assign(P, {
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', cam: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/>', chat: '<path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.3A8 8 0 1 1 21 12z"/>', phoneC: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', send: '<path d="M22 3 11 14M22 3l-7 18-4-7-7-4z"/>', pin: '<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8h14v-8M12 8a3 3 0 1 1 3-3c0 1.7-1.3 3-3 3zm0 0a3 3 0 1 0-3-3c0 1.7 1.3 3 3 3z"/>'
  });
  const EMO_RE = /^\s*((?:\p{Extended_Pictographic}|️|‍)+)\s*/u;
  const DRESS_SEL = '.btn,.menu-i,.stab,#f4Folders button,.f2-opt,.f2-chip,.settings-row-title,.pick-name';
  function dress(root) {
    if (!isClean()) return;
    (root || document).querySelectorAll(DRESS_SEL).forEach(el => {
      if (el.dataset.cld) return; const n = el.firstChild; if (!n || n.nodeType !== 3) return;
      const m = n.nodeValue.match(EMO_RE); if (!m) return; el.dataset.cld = '1';
      const key = EMO[m[1].replace(/️/g, '')] || EMO[[...m[1]][0]];
      n.nodeValue = n.nodeValue.slice(m[0].length);
      if (key && P[key] && el.matches('.btn,.menu-i,.stab,#f4Folders button')) { const s = document.createElement('span'); s.className = 'cl-i'; s.innerHTML = I(P[key], el.matches('.btn') ? 18 : 20); el.insertBefore(s, n); }
    });
  }
  let dT = null;
  new MutationObserver(() => { clearTimeout(dT); dT = setTimeout(() => dress(), 60); }).observe(document.body, { childList: true, subtree: true });

  /* ---------- применение сохранённых параметров ---------- */
  const ACC = ['#1aa6a0', '#3390ec', '#2eb67d', '#8e5cf0', '#f08c2b', '#e8478b', '#e5484d'];
  const WALL = [['', 'Без фона', 'var(--bg)'], ['dots', 'Точки', 'var(--bg)'], ['g1', 'Ночь', 'linear-gradient(160deg,#1d3b5c,#2a1f4a)'], ['g2', 'Лес', 'linear-gradient(160deg,#173d34,#163a2a)'], ['g3', 'Закат', 'linear-gradient(160deg,#4a2230,#3a2a1a)'], ['s1', 'Мята', '#c9dcb8'], ['s2', 'Небо', '#cfe0ef']];
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function applyMode() {
    if (!isClean() || typeof applyTheme !== 'function') return;
    const m = LS.g('golda_mode', 'dark'); const t = m === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : m;
    if (document.body.getAttribute('data-theme') !== t) applyTheme(t);
  }
  function applyLook() {
    const r = document.documentElement.style;
    r.setProperty('--ac', LS.g('golda_ac', ACC[0]));
    r.setProperty('--br', LS.g('golda_br', '18') + 'px');
    if (isClean()) r.setProperty('--font-size', LS.g('golda_fs', '15.5') + 'px');
    const wi = LS.g('golda_wall_img', ''); document.body.setAttribute('data-wall', wi ? 'img' : LS.g('golda_wall', 'dots')); if (wi) r.setProperty('--wall-img', 'url(' + wi + ')'); else r.removeProperty('--wall-img');
    document.documentElement.setAttribute('data-motion', LS.g('golda_motion', 'on'));
    applyMode();
  }
  mq && mq.addEventListener && mq.addEventListener('change', applyMode);

  /* ---------- шапка: меню, поиск, FAB ---------- */
  function mount() {
    const head = Q('.side-head'), search = Q('.search'), side = Q('.side');
    if (!head || !side || !search) return setTimeout(mount, 400);
    if (!Q('#clMenu')) { const b = document.createElement('button'); b.id = 'clMenu'; b.type = 'button'; b.title = 'Меню'; b.innerHTML = ic('menu', 24); b.onclick = openDrawer; head.insertBefore(b, head.firstChild); }
    if (!Q('#clFab')) { const f = document.createElement('button'); f.id = 'clFab'; f.type = 'button'; f.title = 'Новый чат'; f.innerHTML = ic('pen', 24); f.onclick = () => clickQ('#btnNewChat'); document.body.appendChild(f); }
    place();
  }
  function place() {
    const head = Q('.side-head'), search = Q('.search'); if (!head || !search) return;
    if (isClean()) { if (search.parentNode !== head) head.appendChild(search); }
    else if (search.parentNode === head) head.parentNode.insertBefore(search, head.nextSibling);
    const tb = Q('.side-tabs'); if (tb && isClean() && tb.parentNode === head) head.after(tb);
    applyLook();
  }
  setInterval(() => { if (isClean()) { const h = Q('.side-head'), tb = Q('.side-tabs'); if (h && tb && tb.parentNode === h) h.after(tb); } }, 1000);
  new MutationObserver(() => { place(); if (!isClean()) { closeDrawer(); closeSet(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui'] });

  /* ---------- боковое меню ---------- */
  let D = null;
  function buildDrawer() {
    if (D) D.remove();
    D = document.createElement('div'); D.id = 'clDrawer';
    const dark = document.body.getAttribute('data-theme') !== 'light';
    const adminOn = Q('#btnAdmin') && !Q('#btnAdmin').classList.contains('hidden');
    const items = [
      ['group', 'Новая группа', () => clickQ('#btnNewGroup')], ['user', 'Новый чат', () => clickQ('#btnNewChat')], ['users', 'Контакты', () => call(window.openNewChatModal)],
      null,
      ['bot', 'Помощник', () => clickQ('#f4Quick [data-q=helper]')], ['mega', 'Каналы', () => clickQ('#f4Quick [data-q=chan]')], ['search', 'Поиск по сообщениям', () => clickQ('#f4Quick [data-q=find]')], ['sticker', 'Стикеры', () => clickQ('#f4Quick [data-q=stk]')],
      null,
      ['game', 'Игры', () => call(window.GAMES_HUB)], ['cup', 'Задания и рейтинг', () => window.F3 && window.F3.hub('tasks')],
      adminOn ? ['shield', 'Админ-панель', () => clickQ('#btnAdmin')] : undefined,
      ['gear', 'Настройки', () => openSet()]
    ].filter(x => x !== undefined);
    let n = 0;
    D.innerHTML = `<div class="sc"></div><div class="pn"><div class="hd"><div id="clDAva"></div><b>${esc((Q('#meName') || {}).textContent)}</b><small>${esc((Q('#meUname') || {}).textContent)}</small><button class="tg" title="Тема">${ic(dark ? 'sun' : 'moon', 22)}</button></div>` +
      items.map(it => it ? `<button class="it" style="--i:${n++}" data-n="${n - 1}">${ic(it[0], 24)}<span>${it[1]}</span></button>` : '<div class="sp"></div>').join('') + `<div class="ft">Golda Messenger</div></div>`;
    document.body.appendChild(D);
    const ava = Q('#meAva'); if (ava) Q('#clDAva').innerHTML = ava.innerHTML;
    const real = items.filter(Boolean);
    D.onclick = e => {
      if (e.target.classList.contains('sc')) return closeDrawer();
      if (e.target.closest('.tg')) { LS.s('golda_mode', dark ? 'light' : 'dark'); applyMode(); closeDrawer(); return; }
      const b = e.target.closest('.it'); if (!b) return; const it = real[+b.dataset.n]; closeDrawer(); setTimeout(() => it[2](), 180);
    };
  }
  function openDrawer() { buildDrawer(); requestAnimationFrame(() => requestAnimationFrame(() => D.classList.add('open'))); }
  function closeDrawer() { D && D.classList.remove('open'); }

  /* ---------- настройки ---------- */
  let S = null;
  const sw = on => `<div class="sw ${on ? 'on' : ''}"></div>`;
  const row = (k, col, t, sub, right, id, cls) => `<div class="rw ${cls || ''}" ${id ? `data-id="${id}"` : ''}><div class="ic" style="background:${col}">${ic(k, 18)}</div><div class="tx"><div>${t}</div>${sub ? `<small>${sub}</small>` : ''}</div>${right || ''}</div>`;
  function buildSet() {
    const pr = (typeof PREFS !== 'undefined') ? PREFS : { sound: 1, vibrate: 1, preview: 1 };
    const mode = LS.g('golda_mode', 'dark'), ac = LS.g('golda_ac', ACC[0]), fs = +LS.g('golda_fs', '15.5'), br = +LS.g('golda_br', '18'), wall = LS.g('golda_wall', 'dots');
    const ui = document.documentElement.getAttribute('data-ui');
    const perm = ('Notification' in window) ? ({ granted: 'Включены', denied: 'Заблокированы', default: 'Не запрошены' }[Notification.permission]) : 'Недоступно';
    S.innerHTML = `<div class="bar"><button data-a="close" title="Назад">${ic('back', 24)}</button><b>Настройки</b></div><div class="bd"><div class="wrap">
      <div class="prof" data-a="profile"><div id="clSAva"></div><b>${esc((Q('#meName') || {}).textContent)}</b><small>${esc((Q('#meUname') || {}).textContent)}${ME && ME.email ? ' · ' + esc(ME.email) : ''}</small></div>
      <div class="sec"><h4>Аккаунт</h4>
        ${row('user', '#3390ec', 'Мой профиль', 'Имя, фото, о себе', '', 'profile')}
        ${row('coin', '#e0a21b', 'Кошелёк', 'gold и праймики', '<span class="vl" id="clBal">…</span>', 'wallet')}
        ${row('chart', '#8e5cf0', 'Моя статистика', 'Сообщения, подарки, игры', '', 'stats')}
        ${row('users', '#3390ec', 'Поделиться профилем', 'Ссылка, по которой тебя найдут', '', 'share')}
        ${row('lock', '#6c5ce7', 'Код-пароль', 'Защита и скрытые чаты', '', 'pass')}
      </div>
      <div class="sec"><h4>Конфиденциальность</h4>
        ${row('eye', '#17b2c4', 'Недавняя активность', 'Кто и когда был в сети', '', 'seen-list')}
        ${row('lock', '#2eb67d', 'Скрывать моё время в сети', 'Другие увидят «был(а) недавно»', sw(LS.g('golda_hide_seen', '0') === '1'), 'hide-seen')}
        ${row('ban', '#e5484d', 'Заблокированные', 'Список и разблокировка', '', 'blocked')}
      </div>
      <div class="sec"><h4>Уведомления</h4>
        ${row('bell', '#e5484d', 'Звук сообщений', 'Сигнал о новом сообщении', sw(pr.sound), 'n-sound')}
        ${row('vib', '#2eb67d', 'Вибрация', 'Вибрировать при сообщении', sw(pr.vibrate), 'n-vib')}
        ${row('eye', '#17b2c4', 'Показывать текст', 'Превью в уведомлении', sw(pr.preview), 'n-prev')}
        ${row('globe', '#f08c2b', 'Системные уведомления', 'Браузер или приложение', `<span class="vl">${perm}</span>`, 'n-perm')}
      </div>
      <div class="sec"><h4>Оформление</h4>
        <div class="ctl"><div class="lab">Тема</div><div class="seg" data-seg="mode">${[['auto', 'Системная'], ['light', 'Светлая'], ['dark', 'Тёмная']].map(a => `<button data-v="${a[0]}" class="${mode === a[0] ? 'on' : ''}">${a[1]}</button>`).join('')}</div>
          <div class="lab">Цвет акцента</div><div class="sws" data-sws="ac">${ACC.map(c => `<i data-v="${c}" style="background:${c}" class="${ac === c ? 'on' : ''}"></i>`).join('')}</div>
          <div class="lab">Размер текста <span id="clFsV">${fs}</span></div><input type="range" min="13" max="20" step="0.5" value="${fs}" data-r="fs">
          <div class="lab">Скругление сообщений <span id="clBrV">${br}</span></div><input type="range" min="4" max="24" step="1" value="${br}" data-r="br">
          <div class="prev"><div class="msg"><div class="bubble"><div class="m-text">Привет! Так выглядят сообщения</div><div class="m-time">12:30</div></div></div><div class="msg own"><div class="bubble"><div class="m-text">Отлично, мне нравится</div><div class="m-time">12:31</div></div></div></div>
          <div class="lab">Фон чата</div><div class="sws wl" data-sws="wall">${WALL.map(w => `<i data-v="${w[0]}" title="${w[1]}" style="background:${w[2]}" class="${wall === w[0] ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        ${row('img', '#17b2c4', 'Свой фон из галереи', LS.g('golda_wall_img', '') ? 'Установлен' : 'Выбрать картинку', LS.g('golda_wall_img', '') ? '<span class="vl">Убрать</span>' : '', 'wallup')}<input type="file" id="clWallIn" accept="image/*" style="display:none">
        ${row('anim', '#8e5cf0', 'Анимации', 'Плавные переходы и эффекты', sw(LS.g('golda_motion', 'on') === 'on'), 'motion')}
        ${row('folder', '#3390ec', 'Компактный список чатов', 'Больше чатов на экране', sw(LS.g('golda_compact', '0') === '1'), 'compact')}
        ${row('user', '#e8478b', 'Аватары-цветки', 'Вместо кругов — мягкая форма', sw(LS.g('golda_flower', '0') === '1'), 'flower')}
      </div>
      <div class="sec"><h4>Чаты</h4>
        ${row('enter', '#3390ec', 'Enter отправляет', 'Выкл — Enter переносит строку, Ctrl+Enter отправляет', sw(LS.g('golda_enter', '1') === '1'), 'enter')}
      </div>
      <div class="sec"><h4>Данные и приложение</h4>
        ${row('phone', '#2eb67d', 'Установить на экран', 'Иконка как у приложения', '', 'install')}
        ${row('down', '#3390ec', 'Скачать для Android', 'Файл APK', '', 'apk')}
        ${row('trash', '#e5484d', 'Очистить кэш', 'Перезагрузит и обновит приложение', '', 'cache')}
      </div>
      <div class="sec"><h4>О приложении</h4>
        ${row('info', '#707579', 'Golda Messenger', 'Сообщения, каналы, игры и NFT', '<span class="vl">v5</span>', '')}
        ${row('out', '#e5484d', 'Выйти из аккаунта', ME && ME.email ? esc(ME.email) : '', '', 'logout', 'red')}
      </div></div></div>`;
    const ava = Q('#meAva'); if (ava) Q('#clSAva').innerHTML = ava.innerHTML;
    sb && ME && Promise.all([sb.from('gold_wallets').select('balance_t').eq('user_id', ME.id).maybeSingle(), sb.from('prime_wallets').select('balance_t').eq('user_id', ME.id).maybeSingle()]).then(r => { const e = Q('#clBal'); if (e) e.textContent = fmt(r[0].data && r[0].data.balance_t) + ' · ' + fmt(r[1].data && r[1].data.balance_t) + ' 💎'; }).catch(() => { });
  }
  function openSet() {
    if (!S) { S = document.createElement('div'); S.id = 'clSet'; document.body.appendChild(S); wireSet(); }
    buildSet(); S.classList.add('open');
  }
  function closeSet() { S && S.classList.remove('open'); }
  window.GoldaSettings = { open: () => openSet() };
  function togglePref(id, key) { const t = Q(id); t && t.click(); const pr = typeof PREFS !== 'undefined' ? PREFS : {}; const e = S.querySelector('[data-id="' + (key) + '"] .sw'); e && e.classList.toggle('on', !!pr[({ 'n-sound': 'sound', 'n-vib': 'vibrate', 'n-prev': 'preview' })[key]]); }
  function wireSet() {
    S.addEventListener('click', e => {
      if (e.target.closest('[data-a="close"]')) { if (S.dataset.sub) { S.dataset.sub = ''; clearInterval(seenT); return buildSet(); } return closeSet(); }
      if (e.target.closest('[data-a="profile"]')) { closeSet(); return call(window.openMyProfile); }
      const sg = e.target.closest('.seg button');
      if (sg) {
        const k = sg.parentNode.dataset.seg, v = sg.dataset.v; sg.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sg));
        if (k === 'mode') { LS.s('golda_mode', v); applyMode(); } else if (k === 'ui') { const b = Q('.ui-opt[data-ui="' + v + '"]'); b && b.click(); if (v !== 'clean') closeSet(); }
        return;
      }
      const sw2 = e.target.closest('.sws i');
      if (sw2) { const k = sw2.parentNode.dataset.sws; sw2.parentNode.querySelectorAll('i').forEach(b => b.classList.toggle('on', b === sw2)); LS.s(k === 'ac' ? 'golda_ac' : 'golda_wall', sw2.dataset.v); applyLook(); return; }
      const rw = e.target.closest('.rw'); if (!rw) return; const id = rw.dataset.id;
      switch (id) {
        case 'profile': closeSet(); call(window.openMyProfile); break;
        case 'share': window.LIVE && window.LIVE.shareProfile(); break;
        case 'stats': showStats(); break;
        case 'wallup': if (LS.g('golda_wall_img', '') && e.target.classList.contains('vl')) { LS.s('golda_wall_img', ''); applyLook(); buildSet(); } else Q('#clWallIn').click(); break;
        case 'seen-list': showSeen(); break;
        case 'hide-seen': { const on = LS.g('golda_hide_seen', '0') === '1'; LS.s('golda_hide_seen', on ? '0' : '1'); rw.querySelector('.sw').classList.toggle('on', !on); try { sb.from('profiles').update({ last_seen: on ? new Date().toISOString() : null }).eq('id', ME.id).then(() => { }); } catch (er) { } break; }
        case 'blocked': showBlocked(); break;
        case 'pass': closeSet(); window.F2 && window.F2.pass && window.F2.pass(); break;
        case 'wallet': closeSet(); call(window.GAMES_HUB); break;
        case 'n-sound': togglePref('#toggleSound', id); break; case 'n-vib': togglePref('#toggleVibrate', id); break; case 'n-prev': togglePref('#togglePreview', id); break;
        case 'n-perm': call(window.requestNotifPermission); setTimeout(buildSet, 1500); break;
        case 'compact': { const on = LS.g('golda_compact', '0') === '1'; LS.s('golda_compact', on ? '0' : '1'); rw.querySelector('.sw').classList.toggle('on', !on); window.GoldaM3 && GoldaM3.apply(); break; }
        case 'flower': { const on = LS.g('golda_flower', '0') === '1'; LS.s('golda_flower', on ? '0' : '1'); rw.querySelector('.sw').classList.toggle('on', !on); window.GoldaM3 && GoldaM3.apply(); break; }
        case 'motion': { const on = LS.g('golda_motion', 'on') === 'on'; LS.s('golda_motion', on ? 'off' : 'on'); rw.querySelector('.sw').classList.toggle('on', !on); applyLook(); break; }
        case 'enter': { const on = LS.g('golda_enter', '1') === '1'; LS.s('golda_enter', on ? '0' : '1'); rw.querySelector('.sw').classList.toggle('on', !on); break; }
        case 'install': clickQ('#settingsInstall'); break;
        case 'apk': window.open('https://github.com/levshlapa919-a11y/QWEN-8/releases/download/apk-latest/golda.apk', '_blank'); break;
        case 'cache': if (confirm('Очистить кэш и перезагрузить приложение?')) { (async () => { try { const rs = await navigator.serviceWorker.getRegistrations(); for (const r of rs) await r.unregister(); const ks = await caches.keys(); for (const k of ks) await caches.delete(k); } catch (er) { } location.reload(); })(); } break;
        case 'logout': closeSet(); clickQ('#btnLogout'); break;
      }
    });
    S.addEventListener('input', e => {
      const r = e.target.closest('[data-r]'); if (!r) return;
      if (r.dataset.r === 'fs') { LS.s('golda_fs', r.value); Q('#clFsV').textContent = r.value; } else { LS.s('golda_br', r.value); Q('#clBrV').textContent = r.value; }
      applyLook();
    });
  }

  /* ---------- подстраницы ---------- */
  let seenT = null;
  const isBot = id => /^00000000-0000-4000-8000-00000000b0|901d07$/.test(id || '');
  function sub(title, html) {
    S.dataset.sub = '1';
    S.innerHTML = `<div class="bar"><button data-a="close" title="Назад">${ic('back', 24)}</button><b>${title}</b></div><div class="bd"><div class="wrap"><div class="sec" id="clSub">${html}</div></div></div>`;
  }
  const pRow = (u, st, on, btn) => `<div class="ppl" data-uid="${u.id}">${avatarHTML(u, 'm')}<div class="tx"><div>${esc(u.display_name || u.username || '—')}</div><small class="${on ? 'on' : ''}">${st}</small></div>${btn || ''}</div>`;
  async function showSeen() {
    sub('Недавняя активность', '<div class="empty">Загрузка…</div>');
    const load = async () => {
      if (S.dataset.sub !== '1' || !Q('#clSub')) return;
      const ids = [...new Set(CHATS.filter(c => c.type === 'direct').map(c => { try { return otherOf(c).id; } catch (e) { return null; } }).filter(id => id && !isBot(id)))];
      if (!ids.length) { Q('#clSub').innerHTML = '<div class="empty">Пока нет личных переписок</div>'; return; }
      const r = await sb.from('profiles').select('id,username,display_name,avatar_url,last_seen').in('id', ids);
      const us = (r.data || []).sort((a, b) => (Date.parse(b.last_seen) || 0) - (Date.parse(a.last_seen) || 0));
      const el = Q('#clSub'); if (!el) return;
      el.innerHTML = us.map(u => { const on = isOnline(u); return pRow(u, on ? 'в сети' : (u.last_seen ? fmtLastSeen(u.last_seen) : 'был(а) недавно'), on); }).join('') || '<div class="empty">Нет данных</div>';
    };
    await load(); clearInterval(seenT); seenT = setInterval(load, 20000);
  }
  async function showBlocked() {
    const draw = async () => {
      const ids = (typeof BLOCKED !== 'undefined' ? BLOCKED : []);
      if (!ids.length) return sub('Заблокированные', '<div class="empty">Вы никого не блокировали</div>');
      const r = await sb.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
      sub('Заблокированные', (r.data || []).map(u => pRow(u, '@' + (u.username || ''), false, '<button data-unb="' + u.id + '">Разблокировать</button>')).join(''));
    };
    await draw();
    S.onclick2 = null;
    Q('#clSub') && Q('#clSub').addEventListener('click', async e => { const b = e.target.closest('[data-unb]'); if (!b) return; b.disabled = true; try { await toggleBlock(b.dataset.unb); } catch (er) { } draw(); });
  }


  async function showStats() {
    sub('Моя статистика', '<div class="empty">Считаю…</div>');
    try {
      const [m, g, gs] = await Promise.all([
        sb.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', ME.id),
        sb.from('user_gifts').select('id', { count: 'exact', head: true }).eq('owner_id', ME.id),
        sb.from('game_stats').select('game,plays,wins,net').eq('user_id', ME.id)]);
      const N = { coin: 'Монетка', dice: 'Кости', wheel: 'Колесо', rps: 'Камень-ножницы-бумага', slots: 'Слоты' };
      const rows = (gs.data || []).map(r => `<div class="rw"><div class="tx"><div>${N[r.game] || r.game}</div><small>${r.plays} игр · побед ${r.wins}</small></div><span class="vl" style="color:${Number(r.net) >= 0 ? '#4fae4e' : '#e5484d'}">${Number(r.net) >= 0 ? '+' : ''}${fmt(r.net)}</span></div>`).join('');
      const el = Q('#clSub'); if (!el) return;
      el.innerHTML = `<div class="rw"><div class="tx"><div>Отправлено сообщений</div></div><span class="vl">${fmt(m.count || 0)}</span></div><div class="rw"><div class="tx"><div>Чатов</div></div><span class="vl">${CHATS.length}</span></div><div class="rw"><div class="tx"><div>Подарков в коллекции</div></div><span class="vl">${fmt(g.count || 0)}</span></div>` + (rows ? '<h4>Игры</h4>' + rows : '');
    } catch (e) { const el = Q('#clSub'); if (el) el.innerHTML = '<div class="empty">Не удалось загрузить</div>'; }
  }
  document.addEventListener('change', e => {
    if (e.target.id !== 'clWallIn') return; const f = e.target.files[0]; if (!f) return;
    const im = new Image(), u = URL.createObjectURL(f);
    im.onload = () => { const k = Math.min(1, 1080 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); try { LS.s('golda_wall_img', c.toDataURL('image/jpeg', 0.72)); } catch (er) { } applyLook(); buildSet(); };
    im.src = u;
  });

  /* перехват старой кнопки настроек */
  document.addEventListener('click', e => { if (isClean() && e.target.closest('#btnSettings')) { e.preventDefault(); e.stopImmediatePropagation(); openSet(); } }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeSet(); } });
  /* Enter / Ctrl+Enter */
  document.addEventListener('keydown', e => {
    if (e.target.id !== 'msgInput' || e.key !== 'Enter' || e.isComposing) return;
    if (LS.g('golda_enter', '1') === '1') return;
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopImmediatePropagation(); clickQ('#sendBtn'); } else { e.stopImmediatePropagation(); }
  }, true);

  /* скрытие времени захода и «был(а) недавно» */
  (function () {
    const of = window.fmtLastSeen; if (typeof of === 'function') window.fmtLastSeen = iso => iso ? of(iso) : 'был(а) недавно';
    const wrap = () => {
      if (typeof sb === 'undefined' || sb.__clw) return !!(typeof sb !== 'undefined' && sb.__clw);
      const from = sb.from.bind(sb);
      sb.from = t => { const q = from(t); if (t === 'profiles' && q.update) { const u = q.update.bind(q); q.update = (p, ...a) => { if (p && 'last_seen' in p && LS.g('golda_hide_seen', '0') === '1') p = Object.assign({}, p, { last_seen: null }); return u(p, ...a); }; } return q; };
      sb.__clw = 1; return true;
    };
    if (!wrap()) { const iv = setInterval(() => { if (wrap()) clearInterval(iv); }, 300); }
  })();
  applyLook(); mount();
})();
