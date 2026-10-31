/* golda-mesenger: галочки прочтения, музыка в профилях, переключатель интерфейса.
   Подключается ПОСЛЕ основного скрипта. */
(function () {
  'use strict';

  const me = () => (typeof ME !== 'undefined' ? ME : null);
  const sbc = () => (typeof sb !== 'undefined' ? sb : null);
  const $q = s => document.querySelector(s);
  const say = (m, k) => { try { toast(m, k); } catch (_) {} };
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));

  // =====================================================================
  // 1) ПЕРЕКЛЮЧАТЕЛЬ ИНТЕРФЕЙСА (новый / классический)
  // =====================================================================
  const UI_KEY = 'golda_ui';
  function applyUi(v) {
    document.documentElement.setAttribute('data-ui', v);
    try { localStorage.setItem(UI_KEY, v); } catch (_) {}
    document.querySelectorAll('.ui-opt').forEach(b => b.classList.toggle('active', b.dataset.ui === v));
    const sub = $q('#uiModeSub'); if (sub) sub.textContent = v === 'new' ? 'Новый (Aurora)' : 'Классический';
  }
  function injectUiRow() {
    const sec = [...document.querySelectorAll('#settingsOverlay .settings-section')].find(x => x.textContent.includes('Внешний вид'));
    if (!sec || $q('#uiModeRow')) return;
    const wrap = document.createElement('div');
    wrap.id = 'uiModeRow';
    wrap.innerHTML = `
      <div class="settings-row" style="cursor:default"><div class="settings-row-left"><div class="settings-row-icon">✨</div>
        <div><div class="settings-row-title">Интерфейс</div><div class="settings-row-sub" id="uiModeSub"></div></div></div></div>
      <div class="font-size-options" style="grid-template-columns:repeat(2,1fr);margin-bottom:12px">
        <button class="font-size-opt ui-opt" data-ui="new" type="button">✨ Новый</button>
        <button class="font-size-opt ui-opt" data-ui="classic" type="button">Классический</button>
      </div>`;
    const label = sec.querySelector('.settings-label');
    sec.insertBefore(wrap, label.nextSibling);
    wrap.querySelectorAll('.ui-opt').forEach(b => b.onclick = () => applyUi(b.dataset.ui));
    applyUi(document.documentElement.getAttribute('data-ui') || 'new');
  }
  injectUiRow();

  // =====================================================================
  // 2) ГАЛОЧКИ: отправлено ✓ / доставлено ✓✓ / прочитано ✓✓ (цветные)
  // =====================================================================
  const RR = {};            // RR[chatId][userId] = { d: ms, r: ms }
  let featFor = null, featChan = null, lastChatIds = '', lastCurrent = null;

  const SVG1 = '<svg viewBox="0 0 16 11" width="15" height="11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.8 5 9.2 14 1.4"/></svg>';
  const SVG2 = '<svg viewBox="0 0 20 11" width="19" height="11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 5.8 5 9.2 14 1.4M7.5 9.2l.9.1L17.5 1.4"/></svg>';

  function tickState(chatId, ts) {
    const chat = CHATS.find(c => c.id === chatId); if (!chat) return 'sent';
    const others = chat.members.filter(m => m.id !== me().id);
    if (!others.length) return 'sent';
    const rows = others.map(o => (RR[chatId] || {})[o.id] || { d: 0, r: 0 });
    if (rows.every(x => x.r >= ts)) return 'read';
    if (rows.some(x => x.d >= ts)) return 'delivered';
    return 'sent';
  }
  function refreshTicks() {
    if (!me() || typeof CURRENT === 'undefined' || !CURRENT) return;
    document.querySelectorAll('#messages .tick').forEach(el => {
      const ts = Date.parse(el.getAttribute('data-ts'));
      const st = tickState(CURRENT, ts);
      if (el.dataset.st === st) return;
      el.dataset.st = st;
      el.className = 'tick ' + st;
      el.innerHTML = st === 'sent' ? SVG1 : SVG2;
      el.title = st === 'read' ? 'Прочитано' : st === 'delivered' ? 'Доставлено' : 'Отправлено';
    });
  }
  const msgBox = $q('#messages');
  if (msgBox) new MutationObserver(() => refreshTicks()).observe(msgBox, { childList: true, subtree: true });

  async function loadReads() {
    if (!me() || !CHATS.length) return;
    const { data } = await sbc().from('chat_reads').select('*').in('chat_id', CHATS.map(c => c.id));
    (data || []).forEach(setRR);
    refreshTicks();
  }
  function setRR(r) {
    if (!r) return;
    (RR[r.chat_id] = RR[r.chat_id] || {})[r.user_id] = { d: Date.parse(r.last_delivered_at) || 0, r: Date.parse(r.last_read_at) || 0 };
  }
  let markBusy = false;
  async function mark(chatIds, read) {
    if (!me() || !chatIds.length || markBusy) return;
    markBusy = true;
    try { await sbc().rpc('mark_chats', { p_chats: chatIds, p_read: !!read }); } catch (_) {}
    setTimeout(() => { markBusy = false; }, 700);
  }
  const markAllDelivered = () => mark(CHATS.map(c => c.id), false);
  const markCurrentRead = () => {
    if (typeof CURRENT !== 'undefined' && CURRENT && document.visibilityState === 'visible') mark([CURRENT], true);
  };

  function ensureFeatures() {
    const m = me();
    if (!m || !sbc()) {
      if (featChan) { try { sbc().removeChannel(featChan); } catch (_) {} featChan = null; featFor = null; }
      return;
    }
    // подписка на события
    if (featFor !== m.id) {
      if (featChan) { try { sbc().removeChannel(featChan); } catch (_) {} }
      featFor = m.id; lastChatIds = ''; lastCurrent = null;
      featChan = sbc().channel('golda-feat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, e => {
          const msg = e.new; if (!msg || msg.sender_id === m.id) return;
          if (!CHATS.some(c => c.id === msg.chat_id)) return;
          if (CURRENT === msg.chat_id && document.visibilityState === 'visible') setTimeout(() => mark([msg.chat_id], true), 250);
          else setTimeout(() => mark([msg.chat_id], false), 250);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reads' }, e => {
          if (e.new && e.new.chat_id) { setRR(e.new); refreshTicks(); }
        })
        .subscribe();
    }
    // изменился набор чатов — подгружаем отметки и «доставлено»
    const ids = CHATS.map(c => c.id).sort().join(',');
    if (ids !== lastChatIds && ids) { lastChatIds = ids; loadReads(); markAllDelivered(); }
    // открыт другой чат — отмечаем прочитанным
    if (CURRENT !== lastCurrent) { lastCurrent = CURRENT; if (CURRENT) { setTimeout(markCurrentRead, 300); setTimeout(refreshTicks, 400); } }
  }
  setInterval(ensureFeatures, 800);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { markAllDelivered(); setTimeout(markCurrentRead, 400); loadReads(); } });

  // =====================================================================
  // 3) МУЗЫКА В ПРОФИЛЯХ
  // =====================================================================
  const audio = new Audio();
  audio.preload = 'none';
  let queue = [], qi = -1;
  const MAX_MB = 12;

  const PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const NOTE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';

  // мини-плеер «сейчас играет»
  const mini = document.createElement('div');
  mini.id = 'miniPlayer';
  mini.className = 'hide';
  mini.innerHTML = `<div class="mp-ico">${NOTE}</div><div class="mp-title" id="mpTitle"></div>
    <button type="button" id="mpPlay" aria-label="Пауза">${PAUSE}</button>
    <button type="button" id="mpNext" aria-label="Дальше"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z"/></svg></button>
    <button type="button" id="mpClose" aria-label="Закрыть">✕</button><div class="mp-bar"><i id="mpFill"></i></div>`;
  document.body.appendChild(mini);

  const css = document.createElement('style');
  css.textContent = `
  .hide{display:none!important}
  #miniPlayer{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 84px);z-index:250;display:flex;align-items:center;gap:8px;
    max-width:min(440px,calc(100vw - 24px));width:max-content;padding:8px 10px 10px 12px;border-radius:99px;background:var(--p1);border:1px solid var(--line2);
    box-shadow:0 12px 36px rgba(0,0,0,.5),0 0 22px rgba(61,255,133,.25);overflow:hidden}
  #miniPlayer button{border:0;background:transparent;color:var(--tx);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex:none;font-size:13px}
  #miniPlayer button:active{background:rgba(61,255,133,.2)}
  .mp-ico{color:var(--neon);display:grid;place-items:center;flex:none}
  .mp-title{font:700 13px var(--font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
  .mp-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.08)}
  .mp-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--neon),var(--gold))}
  .music-list{display:flex;flex-direction:column;gap:8px;margin-top:4px}
  .trk{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.02);position:relative;overflow:hidden}
  .trk.playing{border-color:var(--line2);background:rgba(61,255,133,.08)}
  .trk-btn{width:38px;height:38px;border-radius:50%;border:0;background:linear-gradient(135deg,var(--neon),var(--accent));color:#03140a;display:grid;place-items:center;cursor:pointer;flex:none;box-shadow:0 0 14px rgba(61,255,133,.35)}
  body[data-theme="light"] .trk-btn{color:#fff}
  .trk-t{flex:1;min-width:0;font:700 14px var(--font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .trk-del{border:0;background:transparent;color:var(--mut);width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:14px;flex:none}
  .trk-del:hover{color:var(--red)}
  .trk-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:linear-gradient(90deg,var(--neon),var(--gold))}
  .music-empty{color:var(--mut2);font-size:13px;padding:4px 2px}
  /* галочки */
  .m-time{display:flex;align-items:center;justify-content:flex-end;gap:5px}
  .tick{display:inline-flex;align-items:center;color:var(--mut2);line-height:0}
  .tick.read{color:#4fc3ff}
  `;
  document.head.appendChild(css);

  const fmtTitle = n => String(n || 'Трек').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim().slice(0, 60) || 'Трек';

  function renderPlaying() {
    document.querySelectorAll('.trk').forEach(el => {
      const on = queue[qi] && queue[qi].id === el.dataset.id;
      const playing = on && !audio.paused;
      el.classList.toggle('playing', !!on);
      const b = el.querySelector('.trk-btn'); if (b) b.innerHTML = playing ? PAUSE : PLAY;
      const bar = el.querySelector('.trk-bar'); if (bar && !on) bar.style.width = '0';
    });
    const cur = queue[qi];
    mini.classList.toggle('hide', !cur);
    if (cur) { $q('#mpTitle').textContent = cur.title; $q('#mpPlay').innerHTML = audio.paused ? PLAY : PAUSE; }
  }
  function playTrack(list, i) {
    const same = queue[qi] && list[i] && queue[qi].id === list[i].id;
    if (same) { audio.paused ? audio.play().catch(() => {}) : audio.pause(); renderPlaying(); return; }
    queue = list.slice(); qi = i;
    audio.src = queue[qi].url;
    audio.play().catch(() => say('Не удалось воспроизвести трек', 'red'));
    renderPlaying();
  }
  function nextTrack() {
    if (!queue.length) return;
    qi = (qi + 1) % queue.length;
    audio.src = queue[qi].url; audio.play().catch(() => {}); renderPlaying();
  }
  function stopMusic() { audio.pause(); audio.removeAttribute('src'); queue = []; qi = -1; renderPlaying(); }
  audio.addEventListener('play', renderPlaying);
  audio.addEventListener('pause', renderPlaying);
  audio.addEventListener('ended', () => { if (queue.length > 1) nextTrack(); else renderPlaying(); });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration * 100) + '%';
    const f = $q('#mpFill'); if (f) f.style.width = pct;
    const cur = queue[qi]; if (!cur) return;
    const row = document.querySelector('.trk[data-id="' + cur.id + '"] .trk-bar'); if (row) row.style.width = pct;
  });
  audio.addEventListener('error', () => { if (queue.length) say('Файл трека недоступен', 'red'); });
  $q('#mpPlay').onclick = () => { audio.paused ? audio.play().catch(() => {}) : audio.pause(); };
  $q('#mpNext').onclick = nextTrack;
  $q('#mpClose').onclick = stopMusic;
  // во время звонка музыку ставим на паузу
  setInterval(() => { const cu = $q('#callUi'); if (cu && cu.classList.contains('show') && !audio.paused) audio.pause(); }, 1000);

  async function fetchTracks(uid) {
    const { data, error } = await sbc().from('profile_tracks').select('*').eq('user_id', uid).order('created_at', { ascending: true });
    if (error) return [];
    return data || [];
  }
  function rowHTML(t, mine) {
    return `<div class="trk" data-id="${E(t.id)}"><button class="trk-btn" type="button">${PLAY}</button><div class="trk-t">${E(t.title)}</div>${mine ? '<button class="trk-del" type="button" title="Удалить">✕</button>' : ''}<div class="trk-bar"></div></div>`;
  }
  function mountList(box, tracks, mine) {
    box.innerHTML = tracks.length ? tracks.map(t => rowHTML(t, mine)).join('') : `<div class="music-empty">${mine ? 'Пока пусто — добавь свой трек' : 'Пользователь пока не добавил музыку'}</div>`;
    box.querySelectorAll('.trk').forEach((row, i) => {
      row.querySelector('.trk-btn').onclick = () => playTrack(tracks, i);
      const del = row.querySelector('.trk-del');
      if (del) del.onclick = async () => {
        if (!confirm('Удалить трек «' + tracks[i].title + '»?')) return;
        const { error } = await sbc().from('profile_tracks').delete().eq('id', tracks[i].id);
        if (error) return say('Не удалось удалить', 'red');
        if (queue[qi] && queue[qi].id === tracks[i].id) stopMusic();
        refreshMyTracks();
      };
    });
    renderPlaying();
  }

  // --- чужой профиль
  function ensureUserMusicBox() {
    let box = $q('#uMusic');
    if (box) return box;
    const about = $q('#uAbout'); if (!about) return null;
    const lbl = document.createElement('label'); lbl.className = 'lbl'; lbl.id = 'uMusicLbl'; lbl.innerHTML = '🎵 Музыка';
    box = document.createElement('div'); box.id = 'uMusic'; box.className = 'music-list';
    about.parentNode.insertBefore(lbl, about.nextSibling);
    lbl.parentNode.insertBefore(box, lbl.nextSibling);
    return box;
  }
  async function showUserMusic(uid) {
    const box = ensureUserMusicBox(); if (!box) return;
    box.innerHTML = '<div class="music-empty">Загрузка…</div>';
    const tracks = await fetchTracks(uid);
    if (typeof U_UID !== 'undefined' && U_UID !== uid) return; // успели открыть другого
    mountList(box, tracks, false);
  }
  if (typeof openUserModal === 'function') {
    const orig = openUserModal;
    window.openUserModal = function (u) { orig(u); if (u && u.id) showUserMusic(u.id); };
  }

  // --- мой профиль
  let myTracks = [];
  function ensureMyMusicBox() {
    let box = $q('#pfMusic');
    if (box) return box;
    const save = $q('#pfSave'); if (!save) return null;
    const lbl = document.createElement('label'); lbl.className = 'lbl'; lbl.textContent = '🎵 Моя музыка (до 10 треков)';
    box = document.createElement('div'); box.id = 'pfMusic';
    box.innerHTML = '<div class="music-list" id="pfMusicList"></div>' +
      '<button class="btn ghost" id="pfMusicAdd" type="button" style="width:100%;margin-top:10px">＋ Добавить трек (mp3, m4a…)</button>' +
      '<input type="file" id="pfMusicFile" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac" class="hidden">';
    save.parentNode.insertBefore(lbl, save);
    save.parentNode.insertBefore(box, save);
    $q('#pfMusicAdd').onclick = () => $q('#pfMusicFile').click();
    $q('#pfMusicFile').onchange = onPickTrack;
    return box;
  }
  async function refreshMyTracks() {
    if (!me()) return;
    ensureMyMusicBox();
    myTracks = await fetchTracks(me().id);
    const list = $q('#pfMusicList'); if (list) mountList(list, myTracks, true);
    const add = $q('#pfMusicAdd'); if (add) add.classList.toggle('hide', myTracks.length >= 10);
  }
  async function onPickTrack(e) {
    const f = e.target.files[0]; e.target.value = '';
    if (!f || !me()) return;
    if (myTracks.length >= 10) return say('Максимум 10 треков', 'red');
    if (f.size > MAX_MB * 1024 * 1024) return say('Файл больше ' + MAX_MB + ' МБ', 'red');
    const okType = (f.type || '').startsWith('audio/') || /\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i.test(f.name);
    if (!okType) return say('Выбери аудиофайл', 'red');
    const ext = (f.name.match(/\.([a-z0-9]{2,5})$/i) || [, 'mp3'])[1].toLowerCase();
    const ctype = f.type && f.type.startsWith('audio/') ? f.type : ({ mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac', opus: 'audio/ogg' }[ext] || 'audio/mpeg');
    say('Загружаем трек…');
    const path = `music/${me().id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const up = await sbc().storage.from('avatars').upload(path, f, { contentType: ctype });
    if (up.error) return say('Ошибка загрузки: ' + up.error.message, 'red');
    const url = sbc().storage.from('avatars').getPublicUrl(path).data.publicUrl;
    const { error } = await sbc().from('profile_tracks').insert({ user_id: me().id, title: fmtTitle(f.name), url });
    if (error) return say('Не удалось сохранить: ' + error.message, 'red');
    say('Трек добавлен 🎵');
    refreshMyTracks();
  }
  if (typeof openMyProfile === 'function') {
    const origMy = openMyProfile;
    window.openMyProfile = function () { origMy(); refreshMyTracks(); };
    const card = $q('#meCard'); if (card) card.onclick = () => window.openMyProfile();
  }

  // =====================================================================
  // 4) ОТПРАВКА ЛЮБЫХ ФАЙЛОВ (фото, видео, документы) — до 50 МБ
  // =====================================================================
  const MAX_FILE_MB = 300; // файлы > 45 МБ режутся на части по 40 МБ
  const CHUNK = 40 * 1048576;
  const fcss = document.createElement('style');
  fcss.textContent = `
  .m-file{display:flex;align-items:center;gap:12px;padding:9px 12px;border:1px solid var(--line2);border-radius:16px;background:rgba(255,255,255,.05);
    text-decoration:none;color:inherit;min-width:210px;max-width:100%;margin-bottom:4px}
  .m-file-ico{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none;font:800 11px var(--font);letter-spacing:.03em;
    background:linear-gradient(135deg,var(--neon),var(--gold));color:#03140a}
  .m-file-info{min-width:0;display:flex;flex-direction:column;gap:2px}
  .m-file-info b{font:700 14px var(--font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
  .m-file-info small{font:500 11.5px var(--mono);opacity:.7}`;
  document.head.appendChild(fcss);

  async function sendAnyFile(f) {
    if (!f || !me() || typeof CURRENT === 'undefined' || !CURRENT) return;
    if (typeof restricted === 'function' && restricted()) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) return say('Файл больше ' + MAX_FILE_MB + ' МБ', 'red');
    const chat = CHATS.find(c => c.id === CURRENT); if (!chat) return;
    if (chat.type === 'direct' && BLOCKED.includes(otherOf(chat).id)) return say('Сначала разблокируй пользователя');

    const t = f.type || '';
    let kind = t.startsWith('image/') ? 'image' : t.startsWith('video/') ? 'video' : 'file';
    let blob = f;
    if (kind === 'image' && f.size > 4 * 1024 * 1024 && !/gif|svg/.test(t) && typeof downscaleMax === 'function') {
      try { blob = await downscaleMax(f, 2400); } catch (_) { blob = f; }
    }
    if (blob.size > 45 * 1048576) {
      // большой файл: режем на части по 40 МБ (бесплатное хранилище принимает до 50 МБ на файл)
      const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8), base = `media/${CURRENT}/${id}`, n = Math.ceil(blob.size / CHUNK);
      for (let i = 0; i < n; i++) {
        say(`📦 Загружаем часть ${i + 1} из ${n}… не закрывай приложение`);
        const part = blob.slice(i * CHUNK, Math.min(blob.size, (i + 1) * CHUNK));
        let err = null;
        for (let k = 0; k < 3 && (k === 0 || err); k++) { const r = await sbc().storage.from('avatars').upload(`${base}/p${String(i).padStart(3, '0')}`, part, { contentType: 'application/octet-stream', upsert: true }); err = r.error; }
        if (err) return say('Ошибка загрузки части ' + (i + 1) + ': ' + err.message, 'red');
      }
      const baseUrl = sbc().storage.from('avatars').getPublicUrl(base).data.publicUrl;
      const content = `[[big|${baseUrl}|${n}|${encodeURIComponent(f.name)}|${f.size}|${f.type || 'application/octet-stream'}]]`;
      const sid = (typeof IMPERSONATE_USER !== 'undefined' && IMPERSONATE_USER) ? IMPERSONATE_USER.id : me().id;
      const { data: m, error } = await sbc().from('messages').insert({ chat_id: CURRENT, sender_id: sid, content }).select().single();
      if (error) return say(error.message, 'red');
      if (!MSG_IDS.has(m.id)) { MSG_IDS.add(m.id); appendMsg(m, chat); scrollBottom(); }
      return say('✔ Большой файл отправлен');
    }
    const mb = (blob.size / 1048576).toFixed(1);
    say('📎 Отправляем ' + mb + ' МБ… не закрывай приложение');
    const ext = ((f.name.match(/\.([A-Za-z0-9]{1,8})$/) || [, ''])[1] || (kind === 'image' ? 'jpg' : kind === 'video' ? 'mp4' : 'bin')).toLowerCase();
    const path = `media/${CURRENT}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const up = await sbc().storage.from('avatars').upload(path, blob, { contentType: (kind === 'image' && blob !== f) ? 'image/jpeg' : (t || 'application/octet-stream') });
    if (up.error) {
      const msg = /exceed|too large|size/i.test(up.error.message) ? 'Файл слишком большой для хранилища' : up.error.message;
      return say('Ошибка загрузки: ' + msg, 'red');
    }
    const url = sbc().storage.from('avatars').getPublicUrl(path).data.publicUrl;
    const content = kind === 'file'
      ? `[[file|${url}|${encodeURIComponent(f.name)}|${f.size}]]`
      : `[[${kind}|${url}]]`;
    const senderId = (typeof IMPERSONATE_USER !== 'undefined' && IMPERSONATE_USER) ? IMPERSONATE_USER.id : me().id;
    const { data: m, error } = await sbc().from('messages').insert({ chat_id: CURRENT, sender_id: senderId, content }).select().single();
    if (error) return say(error.message, 'red');
    if (!MSG_IDS.has(m.id)) { MSG_IDS.add(m.id); appendMsg(m, chat); scrollBottom(); }
  }
  const attach = $q('#attachInput');
  if (attach) {
    attach.setAttribute('accept', '*/*');
    attach.multiple = true;
    attach.onchange = async e => {
      const files = [...e.target.files]; e.target.value = '';
      for (const f of files) await sendAnyFile(f);
    };
  }
})();
