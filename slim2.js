/* Slim You: главный экран, страницы (профиль, приватность, устройства, язык, истории), шапка чата, обои */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const LS = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, c) => G(() => toast(m, c));
  const ME_ = () => G(() => ME);
  const err = e => G(() => ru(e && e.message || String(e))) || (e && e.message) || 'Ошибка';

  /* ---------- перевод интерфейса ---------- */
  const RU = {
    chats: 'Чаты', contacts: 'Контакты', profile: 'Профиль', settings: 'Настройки', search: 'Поиск', find_chats: 'Поиск по чатам', news: 'Лента', no_feed: 'Ленты пока нет',
    new_chat: 'Новый чат', new_group: 'Создать группу', add_story: 'Добавить историю', saved: 'Избранное', stories: 'Истории', no_stories: 'Нет недавних историй', expires: 'Исчезает через 24 часа', you: 'Вы',
    privacy: 'Конфиденциальность', last_seen: 'Последний раз в сети', photo: 'Фото профиля', about: 'О себе', who_writes: 'Кто может писать', add_groups: 'Добавление в группы и каналы',
    all: 'Все', contacts_v: 'Контакты', nobody: 'Никто', blacklist: 'Чёрный список', blacklist_empty: 'Вы никого не блокировали', unblock: 'Разблокировать',
    devices: 'Устройства', this_device: 'Это устройство', other_devices: 'Другие устройства', activity: 'Активность', connect: 'Подключить устройство', connect_s: 'Войти на другом устройстве по ссылке', end_all: 'Завершить все остальные сеансы', end: 'Завершить', change_pass: 'Сменить пароль', change_pass_s: 'Если кто-то чужой вошёл в аккаунт',
    language: 'Язык', now: 'Сейчас', find_lang: 'Найти язык', create_loc: 'Создать локализацию', create_loc_s: 'Свои надписи для основных экранов', your_locs: 'Ваши локализации', none_yet: 'Пока ни одной', main_langs: 'Основные языки', base: 'Базовый', partial: 'Основные экраны', soon: 'Скоро',
    edit_profile: 'Редактирование профиля', pick_photo: 'Выбрать фото', name_about: 'Имя и о себе', name: 'Имя', username: 'Имя пользователя', uname_hint: 'Латинские буквы, цифры и подчёркивание', other: 'Остальное', email: 'Почта', birthday: 'День рождения', gender: 'Пол', not_set: 'Не указан', male: 'Мужской', female: 'Женский', save: 'Сохранить',
    notifications: 'Уведомления', sound: 'Звук', vibration: 'Вибрация', preview: 'Текст в уведомлении', allow_push: 'Разрешить уведомления', appearance: 'Оформление и чат', appearance_s: 'Тема, цвет, обои, шрифт, форма аватара',
    wallet: 'Кошелёк и игры', wallet_s: 'gold, TIX, магазин, игры', stats: 'Моя статистика', share: 'Поделиться профилем', passcode: 'Код-пароль', passcode_s: 'Защита и скрытые чаты', calls: 'Звонки', logout: 'Выйти', admin: 'Админ-панель', about_app: 'О приложении', clear_cache: 'Очистить кэш', get_apk: 'Скачать приложение для Android',
    account: 'Аккаунт', app: 'Приложение', security: 'Безопасность', copied: 'Ссылка скопирована', saved_ok: 'Сохранено', today: 'Сегодня', enc: 'Сообщения хранятся зашифрованными, и читают их только участники этого чата.', notes: 'заметки для себя', cancel: 'Отмена', reset: 'Сбросить', apply: 'Применить'
  };
  const EN = {
    chats: 'Chats', contacts: 'People', profile: 'Profile', settings: 'Settings', search: 'Search', find_chats: 'Search chats', news: 'Feed', no_feed: 'No feed yet',
    new_chat: 'New chat', new_group: 'Create group', add_story: 'Add story', saved: 'Saved', stories: 'Stories', no_stories: 'No recent stories', expires: 'Disappears in 24 hours', you: 'You',
    privacy: 'Privacy', last_seen: 'Last seen', photo: 'Profile photo', about: 'About', who_writes: 'Who can message me', add_groups: 'Adding to groups and channels',
    all: 'Everyone', contacts_v: 'Contacts', nobody: 'Nobody', blacklist: 'Blocked users', blacklist_empty: 'You have not blocked anyone', unblock: 'Unblock',
    devices: 'Devices', this_device: 'This device', other_devices: 'Other devices', activity: 'Activity', connect: 'Link a device', connect_s: 'Sign in on another device with a link', end_all: 'End all other sessions', end: 'End', change_pass: 'Change password', change_pass_s: 'If someone else got into your account',
    language: 'Language', now: 'Now', find_lang: 'Find a language', create_loc: 'Create localization', create_loc_s: 'Your own labels for the main screens', your_locs: 'Your localizations', none_yet: 'None yet', main_langs: 'Main languages', base: 'Base', partial: 'Main screens', soon: 'Soon',
    edit_profile: 'Edit profile', pick_photo: 'Choose photo', name_about: 'Name and about', name: 'Name', username: 'Username', uname_hint: 'Latin letters, digits and underscore', other: 'Other', email: 'Email', birthday: 'Birthday', gender: 'Gender', not_set: 'Not set', male: 'Male', female: 'Female', save: 'Save',
    notifications: 'Notifications', sound: 'Sound', vibration: 'Vibration', preview: 'Message text in notification', allow_push: 'Allow notifications', appearance: 'Appearance and chat', appearance_s: 'Theme, color, wallpaper, font, avatar shape',
    wallet: 'Wallet and games', wallet_s: 'gold, TIX, shop, games', stats: 'My statistics', share: 'Share profile', passcode: 'Passcode', passcode_s: 'Protection and hidden chats', calls: 'Calls', logout: 'Log out', admin: 'Admin panel', about_app: 'About', clear_cache: 'Clear cache', get_apk: 'Get the Android app',
    account: 'Account', app: 'App', security: 'Security', copied: 'Link copied', saved_ok: 'Saved', today: 'Today', enc: 'Messages are stored encrypted and only the members of this chat can read them.', notes: 'notes to self', cancel: 'Cancel', reset: 'Reset', apply: 'Apply'
  };
  const lang = () => LS.g('golda_lang', 'ru');
  const custom = () => { try { return JSON.parse(LS.g('golda_loc', 'null')) || null; } catch (e) { return null; } };
  const t = k => { const l = lang(); if (l === 'custom') { const c = custom(); if (c && c.s && c.s[k]) return c.s[k]; } return ((l === 'en' ? EN : RU)[k]) || RU[k] || k; };

  /* ---------- иконки ---------- */
  const P = {
    search: '<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', chev: '<path d="M9 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    news: '<rect x="4" y="3.500" width="13" height="17" rx="3"/><path d="M8 8.500h5M8 12h5M8 15.500h3"/><path d="M17 8.500h1.500A1.500 1.500 0 0 1 20 10v7.500a3 3 0 0 1-3 3"/>',
    bookmark: '<path d="M7 3.500h10a1.500 1.500 0 0 1 1.500 1.500v15.500L12 17l-6.500 3.500V5A1.500 1.500 0 0 1 7 3.500z"/>',
    shield: '<path d="M12 3l7.500 3v5.500c0 4.800-3.200 8.200-7.500 9.500-4.300-1.300-7.500-4.700-7.500-9.500V6z"/><path d="M8.800 12l2.300 2.300 4.200-4.400"/>',
    devices: '<rect x="2.500" y="5" width="14" height="10" rx="1.800"/><path d="M1.500 19h11"/><rect x="15" y="9" width="6.500" height="11" rx="1.800"/>',
    phone: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.200 3.200 3.200 14.800 0 18M12 3c-3.200 3.200-3.200 14.800 0 18"/>',
    lock: '<rect x="5" y="11" width="14" height="9.500" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    bell: '<path d="M6 9.500a6 6 0 0 1 12 0c0 5.500 2.200 7 2.200 7H3.800S6 15 6 9.500z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 1.500-2.200-.5-1.300.3-2.300 1.700-2.300H17a4 4 0 0 0 4-4c0-5-4-9.500-9-9.500z"/><circle cx="7.500" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.500" r="1"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10.500h18M16 15h2"/>',
    chart: '<path d="M5 20V11M12 20V4M19 20v-6.500"/>', share: '<circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="6" r="2.500"/><circle cx="18" cy="18" r="2.500"/><path d="M8.300 11l7.400-3.500M8.300 13l7.400 3.500"/>',
    brush: '<path d="M20 4L10.500 13.500"/><path d="M9 13c-2.500 0-4 1.600-4 4 0 1.600-1 2.600-2 3.200 3.200 1 8.500.3 8.500-4.200A3 3 0 0 0 9 13z"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7"/>', image: '<rect x="3" y="4" width="18" height="16" rx="3.500"/><circle cx="9" cy="10" r="1.800"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-3.500 3-5.500 6.500-5.500s6.500 2 6.500 5.500"/><circle cx="17" cy="9" r="2.600"/><path d="M17 14c3 0 4.800 1.700 4.800 4.500"/>',
    call: '<path d="M5.500 4h3.500l1.800 4.800-2.400 1.500a11 11 0 0 0 5.300 5.300l1.500-2.400 4.800 1.800v3.500a2 2 0 0 1-2 2A16 16 0 0 1 3.500 6a2 2 0 0 1 2-2z"/>',
    logout: '<path d="M9 21H5.500a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9M16 17l5-5-5-5M21 12H9"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.5"/>',
    dots: '<circle cx="12" cy="5" r="1.600" fill="currentColor"/><circle cx="12" cy="12" r="1.600" fill="currentColor"/><circle cx="12" cy="19" r="1.600" fill="currentColor"/>',
    eye: '<path d="M2 12s3.800-7 10-7 10 7 10 7-3.800 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', block: '<circle cx="12" cy="12" r="9"/><path d="M5.600 5.600l12.800 12.800"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
    key: '<circle cx="8" cy="15" r="4.500"/><path d="M11.500 11.500L20 3M16 7l3 3"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.500 14a4 4 0 0 0 7 0"/><circle cx="9" cy="9.800" r="1" fill="currentColor"/><circle cx="15" cy="9.800" r="1" fill="currentColor"/>', plusc: '<circle cx="12" cy="12" r="9.500"/><path d="M12 7.500v9M7.500 12h9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', wave: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.500v3"/>', cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100"/>'
  };
  const ic = (n, s, w) => `<svg width="${s || 24}" height="${s || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 2.2}" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

  /* ---------- шторка ---------- */
  function sheet(html, onMount) {
    const ov = document.createElement('div'); ov.className = 's2sh'; ov.innerHTML = '<div>' + html + '</div>'; document.body.appendChild(ov);
    const close = () => { ov.remove(); };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    onMount && onMount(ov, close); return { ov, close };
  }
  function choose(title, opts, cur) {
    return new Promise(res => {
      const { ov, close } = sheet(`<h3>${E(title)}</h3>` + opts.map(o => `<button class="s2r ${o[0] === cur ? 'sel' : ''}" data-v="${E(o[0])}"><div class="s2rt"><b>${E(o[1])}</b></div>${o[0] === cur ? '<span class="s2ch">' + ic('check', 24, 2.6) + '</span>' : ''}</button>`).join(''), (ov2) => {
        ov2.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; close(); res(b.dataset.v); });
      });
      const o = new MutationObserver(() => { if (!document.body.contains(ov)) { o.disconnect(); res(null); } }); o.observe(document.body, { childList: true });
    });
  }
  const row = (o) => `<${o.href ? 'a' : 'button'} class="s2r ${o.cls || ''}" ${o.id ? 'data-id="' + o.id + '"' : ''} type="button">${o.ic ? '<span class="s2ri" ' + (o.icbg ? 'style="background:' + o.icbg + ';color:#fff"' : '') + '>' + ic(o.ic, 24) + '</span>' : ''}<span class="s2rt"><b>${o.t}</b>${o.s ? '<small ' + (o.wrap ? 'class="wrap"' : '') + '>' + o.s + '</small>' : ''}</span>${o.v != null ? '<span class="s2rv">' + o.v + '</span>' : ''}${o.sw != null ? '<span class="s2sw ' + (o.sw ? 'on' : '') + '"></span>' : ''}${o.ch === false || o.sw != null || o.v != null ? '' : '<span class="s2ch">' + ic('chev', 22, 2.6) + '</span>'}</${o.href ? 'a' : 'button'}>`;

  /* ---------- страницы ---------- */
  let host = null; const stack = [];
  function ensureHost() { if (host) return host; host = document.createElement('div'); host.id = 's2'; document.body.appendChild(host); return host; }
  function syncNav() { document.body.classList.toggle('s2-open', stack.length > 0); ensureHost().classList.toggle('open', stack.length > 0); const nv = Q('#m3Nav'); if (nv) { const k = stack.length ? (stack[0].tab || 'set') : 'chats'; QA('.np button', nv).forEach(b => b.classList.toggle('on', b.dataset.k === k)); } }
  function open(id, o) {
    ensureHost();
    const old = stack.find(p => p.id === id); if (old) { old.el.remove(); stack.splice(stack.indexOf(old), 1); }
    const el = document.createElement('div'); el.className = 's2p'; el.dataset.page = id;
    const head = o.hero ? `<div class="s2bar"><button class="s2back" aria-label="Назад">${ic('back', 26)}</button></div>` + o.hero
      : o.big ? `<div class="s2bar"><button class="s2back" aria-label="Назад">${ic('back', 26)}</button></div><h1 class="s2h1">${o.title}</h1>${o.sub ? '<p class="s2sub">' + o.sub + '</p>' : ''}`
        : `<div class="s2bar"><button class="s2back" aria-label="Назад">${ic('back', 26)}</button>${o.chip ? '<span class="s2chip" style="background:' + o.chip[1] + '">' + ic(o.chip[0], 22) + '</span>' : ''}<h2>${o.title}</h2></div>`;
    el.innerHTML = `<div class="s2w">${head}<div class="s2b"></div></div>`;
    host.appendChild(el);
    const rec = { id, el, tab: o.tab || (stack[0] && stack[0].tab) || 'set', close: o.onClose };
    stack.push(rec);
    try { history.pushState({ s2: id }, ''); } catch (e) { }
    Q('.s2back', el).onclick = () => back();
    const body = Q('.s2b', el);
    try { const r = o.render(body, el, rec); if (r && r.catch) r.catch(e => { body.innerHTML = '<div class="s2empty">Ошибка: ' + E(err(e)) + '</div>'; }); } catch (e) { body.innerHTML = '<div class="s2empty">Ошибка: ' + E(e.message) + '</div>'; }
    syncNav(); return rec;
  }
  function pop(silent) {
    const rec = stack.pop(); if (!rec) return; rec.close && G(() => rec.close());
    rec.el.classList.add('out'); setTimeout(() => rec.el.remove(), 230); syncNav();
    const sv = Q('.s2save'); if (sv) sv.classList.remove('on');
  }
  function back() { if (!stack.length) return; try { if (history.state && history.state.s2) { history.back(); return; } } catch (e) { } pop(); }
  window.addEventListener('popstate', () => { if (stack.length) pop(); });
  function closeAll() { while (stack.length) pop(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length && !Q('.s2sh')) back(); });

  /* ---------- вспомогательное: контакты, видимость ---------- */
  const isContact = id => !!G(() => CHATS.some(c => c.type === 'direct' && (c.members || []).some(m => m.id === id)));
  const hiddenFor = (u, k) => { const me = ME_(); if (!u || !u.id || !me || u.id === me.id || me.is_admin) return false; const v = u.privacy && u.privacy[k]; return v === 'nobody' || (v === 'contacts' && !isContact(u.id)); };
  (function wrapPrivacy() {
    const oa = window.avatarHTML; if (typeof oa === 'function' && !oa.__s2) { const n = function (p, c) { return hiddenFor(p, 'photo') ? oa.call(this, Object.assign({}, p, { avatar_url: null }), c) : oa.apply(this, arguments); }; n.__s2 = 1; window.avatarHTML = n; }
    const ou = window.openUserModal; if (typeof ou === 'function' && !ou.__s2) { const n = function (u) { const v = u && hiddenFor(u, 'about') ? Object.assign({}, u, { about: '' }) : u; return ou.call(this, v); }; n.__s2 = 1; window.openUserModal = n; }
  })();
  const PV = () => (ME_() && ME.privacy) || {};
  async function setPriv(k, v) {
    const p = Object.assign({}, PV(), { [k]: v });
    const { error } = await sb.from('profiles').update({ privacy: p }).eq('id', ME.id); if (error) { tst(err(error), 'red'); return false; }
    ME.privacy = p; G(() => { PROFILES[ME.id] = ME; }); return true;
  }
  const seenVal = () => PV().seen || (LS.g('golda_hide_seen', '0') === '1' ? 'nobody' : 'all');
  const VAL = v => v === 'nobody' ? t('nobody') : v === 'contacts' ? t('contacts_v') : t('all');

  /* ---------- Профиль (вкладка) ---------- */
  function profilePage() {
    open('profile', {
      title: t('profile'), tab: 'user', hero: '<div class="s2hero" id="s2ph"></div>', render(body) {
        const draw = () => {
          const m = ME_(); if (!m) return;
          Q('#s2ph').innerHTML = `<div class="s2av">${avatarHTML(m, 'l')}</div><h2>${E(m.display_name || m.username)}</h2><p>@${E(m.username || '')}${m.about ? ' · ' + E(m.about) : ''}</p>`;
        }; draw();
        body.innerHTML = '<div id="s2bal"></div>' + row({ id: 'edit', ic: 'user', t: t('edit_profile'), s: t('name_about') }) +
          row({ id: 'tix', ic: 'wallet', t: 'Кошелёк TIX', s: 'Баланс, обмен gold, переводы' }) + row({ id: 'market', ic: 'chart', t: 'Рынок NFT', s: 'Купить и продать за TIX' }) + row({ id: 'wallet', ic: 'wallet', t: t('wallet'), s: t('wallet_s') }) + row({ id: 'stats', ic: 'chart', t: t('stats') }) +
          row({ id: 'story', ic: 'brush', t: t('stories'), s: t('expires') }) + row({ id: 'saved', ic: 'bookmark', t: t('saved'), s: t('notes') }) + row({ id: 'share', ic: 'share', t: t('share') }) + '<div class="s2lbl">Подарки и NFT</div><div id="s2gifts"></div>';
        body.onclick = e => { const r = e.target.closest('[data-id]'); if (r) act(r.dataset.id); };
        G(() => window.GoldaMint.balances(Q('#s2bal', body)));
        G(() => window.GoldaMint.gifts(Q('#s2gifts', body), ME.id));
      }
    });
  }

  /* ---------- Редактирование профиля ---------- */
  function editProfile() {
    open('edit', {
      title: t('edit_profile'), render(body) {
        const m = ME; let dirty = false, bd = m.birthday || '', gd = m.gender || '';
        const gtxt = g => g === 'm' ? t('male') : g === 'f' ? t('female') : t('not_set');
        const btxt = b => b ? new Date(b + 'T12:00:00').toLocaleDateString(lang() === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : t('not_set');
        body.innerHTML = `<div class="s2av" id="s2ea">${avatarHTML(m, 'l')}<button type="button" data-id="photo" aria-label="${t('pick_photo')}">${ic('image', 22)}</button></div><button class="s2lnk" data-id="photo">${t('pick_photo')}</button>
          <input type="file" id="s2file" accept="image/*" class="hidden" style="display:none">
          <div class="s2lbl">${t('name_about')}</div><div class="s2grp"><input class="s2in" id="s2n" maxlength="30" placeholder="${t('name')}" value="${E(m.display_name || '')}"><input class="s2in" id="s2a" maxlength="200" placeholder="${t('about')}" value="${E(m.about || '')}"></div>
          <div class="s2lbl">${t('username')}</div><div class="s2grp"><input class="s2in" id="s2u" maxlength="20" autocapitalize="off" autocomplete="off" value="${E(m.username || '')}"><div class="hint">${t('uname_hint')}</div></div>
          <div class="s2lbl">${t('other')}</div><div class="s2grp"><div class="s2r" style="cursor:default"><span class="s2rt"><b>${t('email')}</b></span><span class="s2rv">${E(m.email || '')}</span></div>
          <div class="s2r" id="s2bd"><span class="s2rt"><b>${t('birthday')}</b></span><span class="s2rv" id="s2bdv">${E(btxt(bd))}</span><input type="date" class="s2dt" id="s2bdi" value="${E(bd)}" max="${new Date().toISOString().slice(0, 10)}"></div>
          <button class="s2r" data-id="gender"><span class="s2rt"><b>${t('gender')}</b></span><span class="s2rv" id="s2gv">${E(gtxt(gd))}</span></button></div>`;
        let sv = Q('.s2save'); if (!sv) { sv = document.createElement('button'); sv.className = 's2save'; document.body.appendChild(sv); } sv.textContent = t('save'); sv.classList.remove('on');
        const mark = () => { dirty = true; sv.classList.add('on'); };
        body.addEventListener('input', e => { if (e.target.matches('.s2in')) mark(); });
        Q('#s2bdi', body).onchange = e => { bd = e.target.value; Q('#s2bdv', body).textContent = btxt(bd); mark(); };
        body.onclick = async e => {
          const b = e.target.closest('[data-id]'); if (!b) return;
          if (b.dataset.id === 'photo') Q('#s2file', body).click();
          if (b.dataset.id === 'gender') { const v = await choose(t('gender'), [['', t('not_set')], ['m', t('male')], ['f', t('female')]], gd); if (v !== null) { gd = v; Q('#s2gv', body).textContent = gtxt(gd); mark(); } }
        };
        Q('#s2file', body).onchange = async e => {
          const f = e.target.files[0]; e.target.value = ''; if (!f) return; tst('Загружаем фото…');
          try {
            const blob = await downscaleMax(f, 256), path = `${ME.id}/${Date.now()}.png`;
            let { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' }); if (error) throw error;
            const { data } = sb.storage.from('avatars').getPublicUrl(path);
            ({ error } = await sb.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', ME.id)); if (error) throw error;
            ME.avatar_url = data.publicUrl; PROFILES[ME.id] = ME; G(renderMe); G(renderChatList); if (G(() => CURRENT)) G(renderChatHeader);
            Q('#s2ea .ava', body).outerHTML = avatarHTML(ME, 'l'); tst('Фото обновлено ✔');
          } catch (er) { tst('Не удалось загрузить: ' + err(er), 'red'); }
        };
        sv.onclick = async () => {
          const uname = G(() => normUname(Q('#s2u', body).value)) || Q('#s2u', body).value.trim().toLowerCase();
          if (!G(() => validUname(uname))) return tst('Юзернейм: 3–20 символов, латиница/цифры/_', 'red');
          sv.disabled = true;
          const { data, error } = await sb.from('profiles').update({ username: uname, display_name: Q('#s2n', body).value.trim() || uname, about: Q('#s2a', body).value.trim(), birthday: bd || null, gender: gd || null }).eq('id', ME.id).select().single();
          sv.disabled = false;
          if (error) return tst(error.code === '23505' ? 'Юзернейм уже занят' : err(error), 'red');
          Object.assign(ME, data); PROFILES[ME.id] = ME; G(renderMe); G(renderChatList); if (G(() => CURRENT)) G(renderChatHeader);
          dirty = false; sv.classList.remove('on'); tst(t('saved_ok') + ' ✔'); const ph = Q('#s2ph'); if (ph) ph.innerHTML = '';
        };
      }, onClose() { const sv = Q('.s2save'); if (sv) sv.remove(); }
    });
  }

  /* ---------- Конфиденциальность ---------- */
  function privacyPage() {
    open('privacy', {
      title: t('privacy'), chip: ['shield', '#18a874'], render(body) {
        const draw = () => {
          const p = PV(), items = [['seen', t('last_seen'), seenVal(), [['all', t('all')], ['nobody', t('nobody')]]], ['photo', t('photo'), p.photo || 'all', null], ['about', t('about'), p.about || 'all', null], ['write', t('who_writes'), p.write || 'all', null], ['groups', t('add_groups'), p.groups || 'all', null]];
          body.innerHTML = items.map(i => `<div class="s2pv"><div class="l">${i[1]}</div><button class="v" data-k="${i[0]}">${VAL(i[2])}</button></div>`).join('') + '<div style="height:10px"></div>' + row({ id: 'bl', t: t('blacklist') });
        }; draw();
        body.onclick = async e => {
          const b = e.target.closest('[data-k]'), r = e.target.closest('[data-id="bl"]');
          if (r) return blacklist();
          if (!b) return; const k = b.dataset.k;
          const base = [['all', t('all')], ['contacts', t('contacts_v')], ['nobody', t('nobody')]];
          const opts = k === 'seen' ? [['all', t('all')], ['nobody', t('nobody')]] : base;
          const cur = k === 'seen' ? seenVal() : (PV()[k] || 'all');
          const v = await choose(Q('.l', b.closest('.s2pv')).textContent, opts, cur); if (!v || v === cur) return;
          if (!await setPriv(k, v)) return;
          if (k === 'seen') { LS.s('golda_hide_seen', v === 'nobody' ? '1' : '0'); G(() => sb.from('profiles').update({ last_seen: v === 'nobody' ? null : new Date().toISOString() }).eq('id', ME.id).then(() => { })); }
          draw(); G(renderChatList);
        };
      }
    });
  }
  async function blacklist() {
    open('bl', {
      title: t('blacklist'), async render(body) {
        const draw = async () => {
          const ids = G(() => BLOCKED) || []; if (!ids.length) { body.innerHTML = `<div class="s2empty">${t('blacklist_empty')}</div>`; return; }
          const { data } = await sb.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
          body.innerHTML = (data || []).map(u => `<div class="s2r" style="cursor:default"><span class="s2ri" style="background:none;width:52px;height:52px">${avatarHTML(u, 'm')}</span><span class="s2rt"><b>${E(u.display_name || u.username)}</b><small>@${E(u.username || '')}</small></span><button class="s2ri" style="width:auto;padding:0 16px;border-radius:22px;border:0;font:800 15px var(--font);cursor:pointer" data-u="${u.id}">${t('unblock')}</button></div>`).join('');
        };
        body.onclick = async e => { const b = e.target.closest('[data-u]'); if (!b) return; b.disabled = true; try { await toggleBlock(b.dataset.u); } catch (er) { } draw(); };
        await draw();
      }
    });
  }

  /* ---------- Устройства ---------- */
  const sidOf = async () => { try { const s = (await sb.auth.getSession()).data.session; return JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).session_id || null; } catch (e) { return null; } };
  const fmtAct = iso => { if (!iso) return ''; const d = new Date(iso), n = new Date(); const hm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); return d.toDateString() === n.toDateString() ? hm : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' + hm; };
  const devIc = n => /iPhone|Android|Mobile/i.test(n || '') ? 'phone' : 'devices';
  function devicesPage() {
    open('devices', {
      title: t('devices'), hero: `<div class="s2hero"><div class="fl">${ic('devices', 78, 2)}</div><h2>${t('devices')}</h2></div>`, async render(body) {
        const SID = await sidOf();
        const draw = async () => {
          const { data } = await sb.from('user_devices').select('session_id,name,created_at,last_active').order('last_active', { ascending: false });
          const list = data || [], cur = list.find(d => d.session_id === SID), others = list.filter(d => d !== cur);
          body.innerHTML = row({ id: 'link', cls: 'big', ic: 'devices', t: t('connect'), s: t('connect_s'), wrap: 1 }) +
            `<div class="s2lbl">${t('this_device')}</div>` + (cur ? `<div class="s2r s2dv" style="cursor:default"><span class="s2ri">${ic(devIc(cur.name), 24)}</span><span class="s2rt"><b>${E(cur.name)}</b><small>${t('activity')}: ${E(fmtAct(cur.last_active))}</small></span></div>` : `<div class="s2r" style="cursor:default"><span class="s2ri">${ic('phone', 24)}</span><span class="s2rt"><b>${E(G(() => navigator.userAgent.match(/\(([^)]+)\)/)[1]) || 'Браузер')}</b><small>${t('activity')}: ${E(fmtAct(new Date().toISOString()))}</small></span></div>`) +
            (others.length ? `<div class="s2lbl">${t('other_devices')}</div>` + others.map(d => `<div class="s2r s2dv" style="cursor:default"><span class="s2ri">${ic(devIc(d.name), 24)}</span><span class="s2rt"><b>${E(d.name)}</b><small>${t('activity')}: ${E(fmtAct(d.last_active))}</small></span><button class="s2ri" data-rev="${d.session_id}" style="width:auto;padding:0 16px;border-radius:22px;border:0;font:800 15px var(--font);cursor:pointer;color:#ff8f8f">${t('end')}</button></div>`).join('') : '') +
            '<div style="height:10px"></div>' + (others.length ? row({ id: 'endall', cls: 'dng', ic: 'logout', t: t('end_all') }) : '') + row({ id: 'pass', ic: 'key', t: t('change_pass'), s: t('change_pass_s'), wrap: 1 });
        };
        body.onclick = async e => {
          const rv = e.target.closest('[data-rev]'), r = e.target.closest('[data-id]');
          if (rv) { if (!confirm('Завершить сеанс? Это устройство будет выброшено из аккаунта.')) return; const { error } = await sb.rpc('revoke_device', { sid: rv.dataset.rev }); if (error) return tst(err(error), 'red'); tst('Сеанс завершён ✔'); return draw(); }
          if (!r) return;
          if (r.dataset.id === 'link') { const u = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: 'YZITK Chats', url: u }); else { await navigator.clipboard.writeText(u); tst(t('copied')); } } catch (er) { try { await navigator.clipboard.writeText(u); tst(t('copied')); } catch (e2) { prompt('Ссылка', u); } } }
          if (r.dataset.id === 'endall') { if (!confirm('Завершить все остальные сеансы?')) return; const { error } = await sb.rpc('revoke_other_devices', { keep: SID }); if (error) return tst(err(error), 'red'); tst('Остальные сеансы завершены ✔'); draw(); }
          if (r.dataset.id === 'pass') sheet(`<h3>${t('change_pass')}</h3><input class="s2in" id="p1" type="password" placeholder="Новый пароль (от 6 символов)" autocomplete="new-password"><input class="s2in" id="p2" type="password" placeholder="Повторите пароль" autocomplete="new-password"><button class="go">${t('save')}</button>`, (ov, close) => {
            Q('.go', ov).onclick = async () => { const a = Q('#p1', ov).value, b = Q('#p2', ov).value; if (a.length < 6) return tst('Пароль минимум 6 символов', 'red'); if (a !== b) return tst('Пароли не совпадают', 'red'); const { error } = await sb.auth.updateUser({ password: a }); if (error) return tst(err(error), 'red'); close(); tst('Пароль изменён ✔'); };
          });
        };
        await draw();
      }
    });
  }

  /* ---------- Язык ---------- */
  const LOCKEYS = ['chats', 'contacts', 'profile', 'settings', 'privacy', 'devices', 'language', 'stories', 'saved', 'notifications', 'edit_profile', 'save', 'blacklist', 'you', 'all', 'nobody'];
  function languagePage() {
    open('lang', {
      title: t('language'), big: 1, sub: ' ', render(body, el) {
        const cur = lang(), cn = custom();
        Q('.s2sub', el).textContent = t('now') + ': ' + (cur === 'en' ? 'English' : cur === 'custom' && cn ? cn.name : 'Русский');
        const langs = [['ru', 'Русский', t('base'), 'RU'], ['en', 'English', 'Английский · ' + t('partial'), 'EN']];
        const draw = (q) => {
          q = (q || '').toLowerCase();
          body.innerHTML = `<label class="s2find">${ic('search', 24)}<input id="s2lq" placeholder="${t('find_lang')}" value="${E(q)}"></label>` +
            (q ? '' : row({ id: 'create', cls: 'big', ic: 'plus', t: t('create_loc'), s: t('create_loc_s') }) + row({ id: 'mine', cls: 'big', ic: 'palette', t: t('your_locs'), s: cn ? E(cn.name) : t('none_yet') })) +
            `<div class="s2lbl">${t('main_langs')}</div>` + langs.filter(l => !q || (l[1] + l[2]).toLowerCase().includes(q)).map(l => `<button class="s2r big ${lang() === l[0] ? 'sel' : ''}" data-l="${l[0]}"><span class="s2lg">${lang() === l[0] ? ic('check', 26, 2.8) : l[3]}</span><span class="s2rt"><b>${l[1]}</b><small>${l[2]}</small></span></button>`).join('');
          const i = Q('#s2lq', body); if (q) { i.focus(); i.setSelectionRange(q.length, q.length); }
          i.oninput = () => draw(i.value);
        }; draw();
        body.onclick = e => {
          const l = e.target.closest('[data-l]'), r = e.target.closest('[data-id]');
          if (l) { setLang(l.dataset.l); languagePage(); }
          else if (r && r.dataset.id === 'create') localePage();
          else if (r && r.dataset.id === 'mine') { if (!custom()) return localePage(); setLang('custom'); languagePage(); }
        };
      }
    });
  }
  function localePage() {
    open('loc', {
      title: t('create_loc'), render(body) {
        const c = custom() || { name: 'Моя локализация', s: {} };
        body.innerHTML = `<div class="s2grp"><input class="s2in" id="ln" maxlength="30" value="${E(c.name)}" placeholder="Название"></div><div class="s2lbl">Надписи</div><div class="s2grp">` + LOCKEYS.map(k => `<input class="s2in" data-k="${k}" placeholder="${E(RU[k])}" value="${E(c.s[k] || '')}">`).join('') + `</div><div style="height:6px"></div><button class="s2r" data-id="ok" style="justify-content:center;background:var(--ac);color:var(--on-ac)"><b>${t('apply')}</b></button><button class="s2r" data-id="rm" style="justify-content:center"><b>${t('reset')}</b></button>`;
        body.onclick = e => {
          const r = e.target.closest('[data-id]'); if (!r) return;
          if (r.dataset.id === 'ok') { const s = {}; QA('[data-k]', body).forEach(i => { if (i.value.trim()) s[i.dataset.k] = i.value.trim(); }); LS.s('golda_loc', JSON.stringify({ name: Q('#ln', body).value.trim() || 'Моя локализация', s })); setLang('custom'); back(); languagePage(); }
          if (r.dataset.id === 'rm') { LS.s('golda_loc', 'null'); if (lang() === 'custom') setLang('ru'); back(); languagePage(); }
        };
      }
    });
  }
  function setLang(l) { LS.s('golda_lang', l); document.documentElement.lang = l === 'en' ? 'en' : 'ru'; applyLang(); }
  function applyLang() {
    const h = Q('#s2H'); if (h) h.textContent = t('chats');
    const L = { chats: 'chats', users: 'contacts', user: 'profile', set: 'settings' };
    QA('#m3Nav .np button').forEach(b => { const s = Q('span', b); if (s && L[b.dataset.k]) s.textContent = t(L[b.dataset.k]); });
    const si = Q('#searchInput'); if (si) si.placeholder = t('find_chats');
    const x = Q('#s2News'); if (x) x.setAttribute('aria-label', t('news'));
  }

  /* ---------- Истории ---------- */
  function storiesPage() {
    open('stories', {
      title: t('stories'), big: 1, render(body) {
        const draw = () => {
          const m = ME_(); const others = QA('#storiesBar .st-it').filter(b => b.dataset.u !== 'me');
          body.innerHTML = `<div class="s2r big" data-id="add" style="padding:16px"><span style="position:relative;width:64px;height:64px;flex:none">${avatarHTML(m, 'm')}<i style="position:absolute;right:-6px;bottom:-4px;width:26px;height:26px;border-radius:50%;background:var(--ac);color:var(--on-ac);display:grid;place-items:center;box-shadow:0 0 0 3px var(--p2)">${ic('plus', 16, 3)}</i></span><span class="s2rt"><b>${t('add_story')}</b><small>${t('expires')}</small></span><span class="s2ri" data-id="brush" style="border-radius:20px;width:62px;height:52px;background:var(--p3);color:var(--tx)">${ic('brush', 24)}</span></div>` +
            (others.length ? others.map((b, i) => `<button class="s2r" data-o="${E(b.dataset.u)}"><span class="s2ri" style="background:none;width:56px;height:56px">${Q('.ava', b) ? Q('.ava', b).outerHTML : ''}</span><span class="s2rt"><b>${E(Q('span:not(.plus)', b) ? Q('span:not(.plus)', b).textContent : '')}</b></span></button>`).join('') : `<div class="s2empty">${t('no_stories')}</div>`);
        }; draw();
        body.onclick = e => {
          const o = e.target.closest('[data-o]'), br = e.target.closest('[data-id="brush"]'), a = e.target.closest('[data-id="add"]');
          if (o) { const b = QA('#storiesBar .st-it').find(x => x.dataset.u === o.dataset.o); b && b.click(); return; }
          if (br) { e.stopPropagation(); addStory(true); return; } if (a) addStory(false);
        };
      }
    });
  }
  function addStory(text) {
    const pl = Q('#storiesBar [data-add]');
    if (pl) pl.click(); else { const x = Q('#xSec [data-x="story"]'); x && x.click(); }
    if (text) setTimeout(() => { const b = Q('.ms-ov [data-k="t"]'); b && b.click(); }, 60);
  }

  /* ---------- Уведомления ---------- */
  function notifPage() {
    open('notif', {
      title: t('notifications'), chip: ['bell', '#e0902a'], render(body) {
        const pr = () => G(() => PREFS) || {};
        const draw = () => { const p = pr(); body.innerHTML = row({ id: 'n-sound', ic: 'wave', t: t('sound'), sw: !!p.sound }) + row({ id: 'n-vib', ic: 'phone', t: t('vibration'), sw: !!p.vibrate }) + row({ id: 'n-prev', ic: 'eye', t: t('preview'), sw: !!p.preview }) + row({ id: 'n-perm', ic: 'bell', t: t('allow_push'), s: G(() => Notification.permission === 'granted') ? 'Включены' : 'Нажмите, чтобы разрешить', ch: false }); };
        draw();
        body.onclick = e => {
          const r = e.target.closest('[data-id]'); if (!r) return;
          const map = { 'n-sound': '#toggleSound', 'n-vib': '#toggleVibrate', 'n-prev': '#togglePreview' };
          if (map[r.dataset.id]) { const el = Q(map[r.dataset.id]); el && el.click(); setTimeout(draw, 60); }
          if (r.dataset.id === 'n-perm') { G(() => requestNotifPermission()); setTimeout(draw, 1500); }
        };
      }
    });
  }

  /* ---------- Настройки ---------- */
  function settingsPage() {
    open('settings', {
      title: t('settings'), tab: 'set', big: 1, render(body) {
        const m = ME_(), adm = m && m.is_admin;
        body.innerHTML = `<button class="s2r big" data-id="edit" style="margin-bottom:10px"><span class="s2ri" style="background:none;width:64px;height:64px">${avatarHTML(m, 'm')}</span><span class="s2rt"><b>${E(m.display_name || m.username)}</b><small>@${E(m.username || '')}</small></span></button>
          <div class="s2lbl">${t('account')}</div>` +
          row({ id: 'privacy', ic: 'shield', t: t('privacy'), s: t('last_seen') + ', ' + t('who_writes').toLowerCase() }) + row({ id: 'devices', ic: 'devices', t: t('devices') }) + row({ id: 'passcode', ic: 'lock', t: t('passcode'), s: t('passcode_s') }) +
          `<div class="s2lbl">TIX и рынок</div>` + row({ id: 'tix', ic: 'wallet', t: 'Кошелёк TIX', s: 'Баланс, обмен, переводы' }) + row({ id: 'market', ic: 'chart', t: 'Рынок NFT', s: 'Покупка и продажа за TIX' }) + row({ id: 'tools', ic: 'cog', t: 'Инструменты', s: 'Напоминания, поиск, заметки, экспорт, тихие часы' }) + `<div class="s2lbl">${t('app')}</div>` + row({ id: 'notif', ic: 'bell', t: t('notifications') }) + row({ id: 'look', ic: 'palette', t: t('appearance'), s: t('appearance_s'), wrap: 1 }) + row({ id: 'lang', ic: 'globe', t: t('language'), v: lang() === 'en' ? 'English' : 'Русский' }) +
          row({ id: 'story', ic: 'brush', t: t('stories') }) + row({ id: 'saved', ic: 'bookmark', t: t('saved') }) + row({ id: 'calls', ic: 'call', t: t('calls') }) + row({ id: 'wallet', ic: 'wallet', t: t('wallet'), s: t('wallet_s') }) + row({ id: 'stats', ic: 'chart', t: t('stats') }) + row({ id: 'share', ic: 'share', t: t('share') }) +
          `<div class="s2lbl">${t('about_app')}</div>` + row({ id: 'apk', ic: 'phone', t: t('get_apk') }) + row({ id: 'cache', ic: 'trash', t: t('clear_cache') }) + (adm ? row({ id: 'admin', ic: 'shield', t: t('admin') }) : '') + row({ id: 'logout', cls: 'dng', ic: 'logout', t: t('logout'), ch: false });
        body.onclick = e => { const r = e.target.closest('[data-id]'); if (r) act(r.dataset.id); };
      }
    });
  }
  function viaOld(id) { const f = G(() => GoldaSettings); if (!f) return; f.open(); setTimeout(() => { const r = Q('#clSet [data-id="' + id + '"]'); r && r.click(); }, 30); }
  function act(id) {
    switch (id) {
      case 'edit': return editProfile(); case 'privacy': return privacyPage(); case 'devices': return devicesPage(); case 'lang': return languagePage(); case 'notif': return notifPage();
      case 'story': return storiesPage(); case 'saved': { closeAll(); const s = Q('.sv-item'); s ? s.click() : (Q('#xSec [data-x="saved"]') || {}).click && Q('#xSec [data-x="saved"]').click(); return; }
      case 'look': return G(() => GoldaSettings.open());
      case 'calls': { closeAll(); const c = QA('.stab').find(b => /звон|call/i.test(b.textContent)); c && c.click(); return; }
      case 'wallet': return G(() => GAMES_HUB());
      case 'tix': return G(() => window.GoldaMint.wallet()); case 'market': return G(() => window.GoldaMint.market()); case 'tools': return G(() => window.GoldaMint.tools());
      case 'stats': return viaOld('stats'); case 'share': return G(() => LIVE.shareProfile()); case 'passcode': closeAll(); return G(() => window.F2.pass());
      case 'apk': return window.open('https://github.com/levshlapa919-a11y/QWEN-8/releases/download/apk-latest/yzitk.apk', '_blank');
      case 'cache': if (confirm('Очистить кэш и перезагрузить приложение?')) (async () => { try { const rs = await navigator.serviceWorker.getRegistrations(); for (const r of rs) await r.unregister(); const ks = await caches.keys(); for (const k of ks) await caches.delete(k); } catch (er) { } location.reload(); })(); return;
      case 'admin': closeAll(); return (Q('#btnAdmin') || {}).click && Q('#btnAdmin').click();
      case 'logout': closeAll(); return (Q('#btnLogout') || {}).click && Q('#btnLogout').click();
    }
  }

  /* ---------- главный экран: заголовок ---------- */
  const feedChat = () => G(() => CHATS.find(c => c.type === 'group' && /(YZITK|Golda)\s+Лента/i.test(c.name || '')));
  function top() {
    const side = Q('.side'); if (!side || Q('#s2Top')) return;
    const d = document.createElement('div'); d.id = 's2Top';
    d.innerHTML = `<h1 id="s2H">${t('chats')}</h1><div class="tb"><button id="s2News" type="button" aria-label="${t('news')}">${ic('news', 28, 2)}<b class="bd" hidden></b></button><button id="s2Plus" type="button" aria-label="${t('new_chat')}">${ic('plus', 30, 2.6)}</button></div>`;
    side.insertBefore(d, side.firstChild);
    Q('#s2News').onclick = () => { const c = feedChat(); if (c) G(() => openChat(c.id)); else tst(t('no_feed')); };
    Q('#s2Plus').onclick = async () => {
      const v = await choose(t('new_chat'), [['chat', t('new_chat')], ['group', t('new_group')], ['story', t('add_story')]]);
      if (v === 'chat') Q('#btnNewChat') && Q('#btnNewChat').click(); else if (v === 'group') Q('#btnNewGroup') && Q('#btnNewGroup').click(); else if (v === 'story') storiesPage();
    };
  }
  function storyCard() {
    const bar = Q('#storiesBar'); if (!bar || !ME_()) return; let c = Q('#s2St');
    if (!c) { c = document.createElement('div'); c.id = 's2St'; bar.before(c);
      c.onclick = e => {
        const o = e.target.closest('[data-o]'), br = e.target.closest('[data-br]'), me = e.target.closest('[data-me]');
        if (o) { const b = QA('#storiesBar .st-it').find(x => x.dataset.u === o.dataset.o); b && b.click(); }
        else if (br) addStory(true);
        else if (me) addStory(false);
      }; }
    const others = QA('#storiesBar .st-it').filter(b => b.dataset.u !== 'me');
    const mine = QA('#storiesBar .st-it').find(b => b.dataset.u === 'me');
    
    const m = ME_();
    const html = `<div class="s2sr"><div class="s2sa" data-me>${avatarHTML(m, 'm')}<i>${ic('plus', 15, 3.2)}</i></div><div class="s2st" data-me><b>${t('add_story')}</b><small>${t('expires')}</small></div><button class="s2sb" data-br type="button" aria-label="${t('add_story')}">${ic('brush', 24)}</button></div>` +
      (others.length ? '<div class="s2so">' + others.map(b => `<button type="button" data-o="${E(b.dataset.u)}" class="${Q('.st-av.new', b) ? 'new' : ''}">${Q('.ava', b) ? Q('.ava', b).outerHTML : ''}<span>${E((Q('span:not(.plus)', b) || {}).textContent || '')}</span></button>`).join('') + '</div>' : '');
    if (c.__h !== html) { c.__h = html; c.innerHTML = html; }
  }
  function badge() { const b = Q('#s2News .bd'); if (!b) return; const c = feedChat(), n = c ? (G(() => UNREAD[c.id]) || 0) : 0; b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }

  /* ---------- навигация ---------- */
  function hookNav() {
    const n = Q('#m3Nav'); if (!n || n.__s2) return; n.__s2 = 1;
    n.addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === 'user') { e.stopImmediatePropagation(); e.stopPropagation(); closeAll(); G(() => { if (CURRENT) closeChat(); }); profilePage(); }
      else if (k === 'set') { e.stopImmediatePropagation(); e.stopPropagation(); closeAll(); G(() => GoldaSettings.close()); G(() => { if (CURRENT) closeChat(); }); settingsPage(); }
      else if (k === 'chats') { closeAll(); const cb = Q('.stab[data-st="chats"]'); if (cb && !cb.classList.contains('on')) cb.click(); G(() => GoldaSettings.close()); const s = Q('.side'); s && s.classList.remove('s2-search'); }
      else if (k === 'users') { closeAll(); }
      else if (k === 'search') { closeAll(); G(() => GoldaSettings.close()); G(() => { if (CURRENT) closeChat(); }); const s = Q('.side'); s && s.classList.add('s2-search'); const i = Q('#searchInput'); i && setTimeout(() => i.focus(), 80); }
    }, true);
    const si = Q('#searchInput'); si && si.addEventListener('blur', () => { if (!si.value.trim()) { const s = Q('.side'); s && s.classList.remove('s2-search'); } });
    applyLang();
  }

  /* ---------- чат: шапка-таблетки, карточка шифрования ---------- */
  function chatHead() {
    const h = Q('.chat-head'); if (!h || h.dataset.s2) return; h.dataset.s2 = 1;
    const back = Q('#backBtn', h), dots = Q('#dotsBtn', h), info = Q('#headInfo', h); if (!back || !dots) return;
    const L = document.createElement('div'); L.className = 's2pl';
    const bell = document.createElement('button'); bell.type = 'button'; bell.id = 's2Bell'; bell.title = 'Уведомления';
    h.insertBefore(L, h.firstChild); L.appendChild(back); L.appendChild(bell);
    const R = document.createElement('div'); R.className = 's2pl'; const ib = document.createElement('button'); ib.type = 'button'; ib.id = 's2Info'; ib.title = 'Информация'; ib.innerHTML = ic('info', 26, 2);
    h.insertBefore(R, dots); R.appendChild(ib); R.appendChild(dots);
    ib.onclick = () => info && info.click();
    const muted = () => { try { return JSON.parse(LS.g('golda_muted', '[]')) || []; } catch (e) { return []; } };
    const paint = () => { const id = G(() => CURRENT), mu = id && muted().includes(id); bell.innerHTML = mu ? ic('bell', 26, 2) + '<svg width="26" height="26" viewBox="0 0 24 24" style="position:absolute;inset:0;margin:auto" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 4l16 16"/></svg>' : ic('bell', 26, 2); bell.style.position = 'relative'; };
    bell.onclick = () => { const id = G(() => CURRENT); if (!id) return; const m = muted(), i = m.indexOf(id); if (i >= 0) m.splice(i, 1); else m.push(id); LS.s('golda_muted', JSON.stringify(m)); paint(); tst(i >= 0 ? 'Уведомления включены' : 'Уведомления выключены'); };
    paint(); setInterval(paint, 1500);
    dots.innerHTML = ic('dots', 26);
  }
  function encCard() {
    const box = Q('#messages'); if (!box) return;
    const has = Q('.s2enc', box), n = box.children.length - (has ? 1 : 0);
    if (n === 0 && G(() => CURRENT) && !has) { const d = document.createElement('div'); d.className = 's2enc'; d.innerHTML = ic('lock', 26, 2) + t('enc'); box.appendChild(d); }
    else if (n > 0 && has) has.remove();
  }

  /* ---------- обои-иконки ---------- */
  function wall() {
    const dark = (document.body.dataset.theme || 'dark') !== 'light', c = dark ? '%238fd3e8' : '%23246b80', o = dark ? .11 : .16;
    const g = (x, y, r, s, p) => `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>${p}</g>`;
    const I = {
      bub: "<path d='M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z'/><path d='M7 9h10M7 13h6'/>",
      gift: "<rect x='3' y='9' width='18' height='12' rx='2'/><path d='M12 9v12M3 13h18M12 9C10 5 6 5 6 8s4 1 6 1zM12 9c2-4 6-4 6-1s-4 1-6 1z'/>",
      bell: "<path d='M6 9a6 6 0 0 1 12 0c0 6 2.500 7.500 2.500 7.500h-17S6 15 6 9z'/><path d='M10 20a2 2 0 0 0 4 0'/>",
      eye: "<path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>",
      bolt: "<path d='M13 2L4 14h7l-1 8 9-12h-7z'/>",
      bars: "<rect x='3' y='13' width='4' height='8' rx='1'/><rect x='10' y='8' width='4' height='13' rx='1'/><rect x='17' y='3' width='4' height='18' rx='1'/>",
      lap: "<rect x='4' y='5' width='16' height='11' rx='1.500'/><path d='M2 19h20'/><circle cx='12' cy='10.500' r='2'/>",
      star: "<path d='M12 3c1 5 4 8 9 9-5 1-8 4-9 9-1-5-4-8-9-9 5-1 8-4 9-9z'/>",
      ring: "<circle cx='8' cy='8' r='5'/><circle cx='16' cy='9' r='4'/><circle cx='11' cy='16' r='5'/>",
      usr: "<circle cx='12' cy='12' r='9'/><circle cx='12' cy='10' r='3'/><path d='M6.500 18c1-3 3.200-4 5.500-4s4.500 1 5.500 4'/>",
      ph: "<rect x='7' y='2.500' width='10' height='19' rx='2.500'/><path d='M11 18.500h2'/>"
    };
    const items = [[14, 18, -12, 2, 'bub'], [96, 10, 8, 1.8, 'gift'], [176, 22, -6, 1.7, 'bell'], [30, 92, 10, 1.9, 'eye'], [112, 84, -10, 1.8, 'bolt'], [186, 96, 6, 1.6, 'bars'], [16, 168, -4, 2, 'lap'], [100, 160, 12, 1.8, 'star'], [180, 170, -8, 1.8, 'ring'], [60, 124, 0, 1.2, 'usr'], [150, 128, 14, 1.5, 'ph']];
    const shapes = `<polygon points='62,44 82,56 82,78 62,90 42,78 42,56' fill='${c}' fill-opacity='.05'/><circle cx='150' cy='66' r='20' fill='${c}' fill-opacity='.045'/><rect x='146' y='186' width='40' height='40' rx='14' fill='${c}' fill-opacity='.05'/><circle cx='54' cy='210' r='18' fill='${c}' fill-opacity='.045'/>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'>${shapes}<g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1.300' stroke-linecap='round' stroke-linejoin='round'>${items.map(i => g(i[0] * 1.2, i[1] * 1.2, i[2], i[3], I[i[4]])).join('')}<circle cx='80' cy='30' r='2.500'/><circle cx='214' cy='140' r='2.500'/><circle cx='120' cy='236' r='2.500'/><circle cx='28' cy='140' r='2.500'/></g></svg>`;
    document.documentElement.style.setProperty('--s2-pat', 'url("data:image/svg+xml,' + svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E') + '")');
  }
  let wt = ''; const wallSync = () => { const k = document.body.dataset.theme || ''; if (k !== wt) { wt = k; wall(); } };

  /* ---------- запуск ---------- */
  function tick() {
    if (!Q('#app') || Q('#app').classList.contains('hidden') || !ME_()) return;
    top(); hookNav(); chatHead(); badge(); wallSync(); storyCard(); const th = Q('#s2H'); if (th) { const cl = !!Q('.stab.on[data-st="calls"]'); const w = t(cl ? 'calls' : 'chats'); if (th.textContent !== w) th.textContent = w; }
    if (!Q('#s2') ) ensureHost();
  }
  setInterval(tick, 700); tick();
  const mo = new MutationObserver(() => { encCard(); mo.takeRecords(); });
  const bindEnc = () => { const b = Q('#messages'); if (b && !b.__s2) { b.__s2 = 1; mo.observe(b, { childList: true }); encCard(); } };
  setInterval(bindEnc, 900);
  window.GoldaPages = { open, row, sheet, choose, ic, E, t, settings: settingsPage, profile: profilePage, privacy: privacyPage, devices: devicesPage, language: languagePage, stories: storiesPage, close: closeAll };
})();
