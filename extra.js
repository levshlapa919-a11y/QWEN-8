/* golda-mesenger: Избранное, Истории, Устройства и вход (выгнать чужие сеансы), смена пароля */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => Array.from((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const rnd = () => Math.random().toString(36).slice(2, 8);
  const hm = iso => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const when = iso => { const d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString() ? 'сегодня ' + hm(iso) : d.toDateString() === new Date(Date.now() - 864e5).toDateString() ? 'вчера ' + hm(iso) : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + hm(iso); };
  const BUCKET = 'avatars';

  /* ---------- страницы ---------- */
  function page(id, title, sub) {
    let p = Q('#' + id); if (p) p.remove();
    p = document.createElement('div'); p.id = id; p.className = 'xo';
    p.innerHTML = `<div class="xo-head"><button class="xb" data-x="close" aria-label="Назад">‹</button><div><h2>${E(title)}</h2>${sub ? `<small>${E(sub)}</small>` : ''}</div></div><div class="xo-body"></div>`;
    document.body.appendChild(p);
    p.addEventListener('click', e => { if (e.target.closest('[data-x="close"]')) p.remove(); });
    return p;
  }
  async function upload(file, folder) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
    const path = `${folder}/${ME.id}/${Date.now()}_${rnd()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  function downscale(file, max) {
    return new Promise(res => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return res(file);
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(u); const k = Math.min(1, max / Math.max(img.width, img.height)); if (k === 1 && file.size < 3e6) return res(file);
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => res(b ? new File([b], (file.name || 'p').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', .88);
      };
      img.onerror = () => res(file); img.src = u;
    });
  }

  /* ================= ИЗБРАННОЕ ================= */
  let NOTES = [];
  function noteHTML(n) {
    const c = String(n.content || ''), md = typeof parseMedia === 'function' ? parseMedia(c) : null; let body;
    if (md) body = (typeof mediaHTML === 'function' ? mediaHTML(md) : '') + (md.cap ? `<div class="t">${E(md.cap)}</div>` : '');
    else if (/^\[\[sticker\|/.test(c)) body = '<div class="t">🎭 Стикер</div>';
    else body = `<div class="t">${E(c)}</div>`;
    return `<div class="sv-note" data-id="${n.id}">${body}<div class="tm"><span>${E(when(n.created_at))}</span><button data-del="${n.id}" aria-label="Удалить">🗑</button></div></div>`;
  }
  async function loadNotes() { const { data } = await sb.from('saved_notes').select('id,content,created_at').order('created_at', { ascending: true }).limit(300); NOTES = data || []; }
  async function openSaved() {
    const p = page('savedPage', 'Избранное', 'заметки и файлы для себя'), body = Q('.xo-body', p);
    const draw = () => { body.innerHTML = NOTES.length ? NOTES.map(noteHTML).join('') : '<div class="xo-empty"><b>⭐</b>Здесь можно хранить заметки, фото и файлы.<br>В любом чате зажми сообщение → «В избранное».</div>'; body.scrollTop = body.scrollHeight; };
    body.innerHTML = '<div class="xo-empty">Загрузка…</div>'; await loadNotes(); draw();
    const bar = document.createElement('div'); bar.className = 'sv-in';
    bar.innerHTML = '<button data-a="att" aria-label="Файл">＋</button><div class="box"><textarea rows="1" placeholder="Заметка…"></textarea></div><button class="go" data-a="send" aria-label="Сохранить">➤</button><input type="file" class="hidden" style="display:none">';
    p.appendChild(bar);
    const ta = Q('textarea', bar), fi = Q('input[type=file]', bar);
    ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; };
    async function add(content) { const { data, error } = await sb.from('saved_notes').insert({ user_id: ME.id, content }).select().single(); if (error) return tst('Ошибка: ' + ru(error.message), 'red'); NOTES.push(data); draw(); refreshSavedItem(); }
    bar.onclick = async e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'send') { const t = ta.value.trim(); if (!t) return; ta.value = ''; ta.style.height = 'auto'; add(t); }
      else fi.click();
    };
    ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 900) { e.preventDefault(); Q('[data-a=send]', bar).click(); } };
    fi.onchange = async () => {
      const f0 = fi.files[0]; fi.value = ''; if (!f0) return; if (f0.size > 50 * 1048576) return tst('Файл больше 50 МБ', 'red');
      tst('Загрузка…'); try {
        const f = await downscale(f0, 2400), url = await upload(f, 'saved');
        const kind = /^image\//.test(f.type) ? 'image' : /^video\//.test(f.type) ? 'video' : 'file';
        await add(kind === 'file' ? `[[file|${url}|${encodeURIComponent(f0.name)}|${f0.size}]]` : `[[${kind}|${url}]]`);
      } catch (er) { tst('Не загрузилось: ' + (er.message || ''), 'red'); }
    };
    body.addEventListener('click', async e => {
      const d = e.target.closest('[data-del]'); if (!d) return;
      if (!await confirmBox('Удалить из избранного?', 'Заметка пропадёт только у тебя.')) return;
      const { error } = await sb.from('saved_notes').delete().eq('id', d.dataset.del); if (error) return tst(ru(error.message), 'red');
      NOTES = NOTES.filter(n => n.id !== d.dataset.del); draw(); refreshSavedItem();
    });
  }
  /* строка «Избранное» вверху списка чатов */
  function savedItemHTML() {
    const last = NOTES[NOTES.length - 1], pv = last ? (typeof previewOf === 'function' ? previewOf(last.content) : String(last.content).slice(0, 40)) : 'Заметки и файлы';
    return `<div class="chat-item sv-item" data-saved><div class="ava-sv">⭐</div><div style="min-width:0;flex:1"><div class="ci-name">Избранное</div><div class="ci-prev">${E(pv)}</div></div></div>`;
  }
  function refreshSavedItem() { const el = Q('.sv-item'); if (el) el.outerHTML = savedItemHTML(); }
  function ensureSavedItem() {
    const list = Q('#chatList'); if (!list || Q('.sv-item', list)) return;
    if (Q('#searchInput') && Q('#searchInput').value.trim()) return;
    list.insertAdjacentHTML('afterbegin', savedItemHTML());
  }

  /* ================= ИСТОРИИ ================= */
  let STORIES = [], SEEN = [];
  try { SEEN = JSON.parse(LS.get('golda_seen_st', '[]')); } catch (e) { }
  const saveSeen = () => LS.set('golda_seen_st', JSON.stringify(SEEN.slice(-400)));
  async function loadStories() {
    const { data, error } = await sb.from('stories').select('id,user_id,url,kind,caption,created_at,expires_at').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true }).limit(200);
    if (error) return; const by = {};
    (data || []).forEach(s => (by[s.user_id] = by[s.user_id] || []).push(s));
    const miss = Object.keys(by).filter(u => !(PROFILES && PROFILES[u]));
    if (miss.length) { const { data: ps } = await sb.from('profiles').select('id,username,display_name,avatar_url').in('id', miss); (ps || []).forEach(p => PROFILES[p.id] = p); }
    STORIES = Object.keys(by).map(u => ({ uid: u, list: by[u] })).sort((a, b) => (a.uid === ME.id ? -1 : b.uid === ME.id ? 1 : b.list[b.list.length - 1].created_at.localeCompare(a.list[a.list.length - 1].created_at)));
    renderStories();
  }
  function renderStories() {
    let bar = Q('#storiesBar'); const list = Q('#chatList'); if (!list) return;
    if (!bar) { bar = document.createElement('div'); bar.id = 'storiesBar'; list.parentNode.insertBefore(bar, list); bar.addEventListener('click', onBar); }
    const mine = STORIES.find(s => s.uid === ME.id), others = STORIES.filter(s => s.uid !== ME.id);
    const item = (g, own) => {
      const u = PROFILES[g ? g.uid : ME.id] || ME, unseen = g && g.list.some(s => !SEEN.includes(s.id));
      return `<button class="st-it" data-u="${own ? 'me' : g.uid}"><div class="st-av ${unseen && !own ? 'new' : ''}">${avatarHTML(u, 'm')}${own ? '<span class="plus" data-add>+</span>' : ''}</div><span>${own ? 'Вы' : E(u.display_name || u.username || '')}</span></button>`;
    };
    bar.innerHTML = item(mine, true) + others.map(g => item(g, false)).join('');
  }
  function onBar(e) {
    const it = e.target.closest('.st-it'); if (!it) return;
    if (e.target.closest('[data-add]') || (it.dataset.u === 'me' && !STORIES.some(s => s.uid === ME.id))) return pickStory();
    const uid = it.dataset.u === 'me' ? ME.id : it.dataset.u; viewStories(uid);
  }
  function pickStory() {
    let fi = Q('#stFile'); if (!fi) { fi = document.createElement('input'); fi.type = 'file'; fi.id = 'stFile'; fi.accept = 'image/*,video/*'; fi.style.display = 'none'; document.body.appendChild(fi); }
    fi.onchange = async () => {
      const f0 = fi.files[0]; fi.value = ''; if (!f0) return; if (f0.size > 40 * 1048576) return tst('Файл больше 40 МБ', 'red');
      tst('Публикуем историю…');
      try {
        const f = await downscale(f0, 1600), url = await upload(f, 'stories'), kind = /^video\//.test(f.type) ? 'video' : 'image';
        const { error } = await sb.from('stories').insert({ user_id: ME.id, url, kind }); if (error) throw error;
        tst('История опубликована ✔ (24 часа)'); await loadStories();
      } catch (er) { tst('Не вышло: ' + (er.message || ''), 'red'); }
    }; fi.click();
  }
  function viewStories(uid) {
    const g = STORIES.find(s => s.uid === uid); if (!g) return;
    const u = PROFILES[uid] || {}, own = uid === ME.id; let i = Math.max(0, g.list.findIndex(s => !SEEN.includes(s.id))), timer = 0, raf = 0, t0 = 0, dur = 5000, vid = null;
    const ov = document.createElement('div'); ov.id = 'storyView';
    ov.innerHTML = `<div class="prog">${g.list.map(() => '<i><b></b></i>').join('')}</div><div class="top">${avatarHTML(u, 'm')}<div><b>${E(u.display_name || u.username || '')}</b><small></small></div>${own ? '<button data-d aria-label="Удалить">🗑</button>' : ''}<button data-c aria-label="Закрыть">✕</button></div><div class="media" style="width:100%;height:100%"></div><div class="tap l"></div><div class="tap r"></div>`;
    document.body.appendChild(ov);
    const close = () => { cancelAnimationFrame(raf); clearTimeout(timer); try { vid && vid.pause(); } catch (e) { } ov.remove(); renderStories(); };
    function show() {
      cancelAnimationFrame(raf); clearTimeout(timer);
      if (i >= g.list.length) return close(); if (i < 0) i = 0;
      const s = g.list[i]; if (!SEEN.includes(s.id)) { SEEN.push(s.id); saveSeen(); }
      QA('.prog i b', ov).forEach((b, k) => b.style.width = k < i ? '100%' : '0');
      Q('.top small', ov).textContent = when(s.created_at);
      const m = Q('.media', ov); m.innerHTML = ''; vid = null;
      const start = d => { dur = d; t0 = performance.now(); const b = QA('.prog i b', ov)[i]; const tick = () => { const k = Math.min(1, (performance.now() - t0) / dur); b.style.width = k * 100 + '%'; if (k >= 1) { i++; show(); } else raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); };
      if (s.kind === 'video') { vid = document.createElement('video'); vid.className = 'sm'; vid.src = s.url; vid.autoplay = true; vid.playsInline = true; vid.onloadedmetadata = () => start(Math.min(30000, (vid.duration || 8) * 1000)); vid.onerror = () => { i++; show(); }; m.appendChild(vid); vid.play().catch(() => { vid.muted = true; vid.play().catch(() => { }); }); }
      else { const im = document.createElement('img'); im.className = 'sm'; im.onload = () => start(5000); im.onerror = () => { i++; show(); }; im.src = s.url; m.appendChild(im); }
    }
    ov.onclick = async e => {
      if (e.target.closest('[data-c]')) return close();
      if (e.target.closest('[data-d]')) {
        cancelAnimationFrame(raf); if (vid) vid.pause();
        if (!await confirmBox('Удалить историю?', 'Она пропадёт у всех.')) { show(); return; }
        const s = g.list[i]; const { error } = await sb.from('stories').delete().eq('id', s.id); if (error) { tst(ru(error.message), 'red'); return show(); }
        g.list.splice(i, 1); if (!g.list.length) { STORIES = STORIES.filter(x => x.uid !== uid); return close(); } QA('.prog i:last-child', ov).forEach(x => x.remove()); show(); return;
      }
      if (e.target.closest('.tap.l')) { i--; show(); } else if (e.target.closest('.tap.r')) { i++; show(); }
    };
    let y0 = null; ov.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
    ov.addEventListener('touchend', e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 110) close(); y0 = null; }, { passive: true });
    show();
  }

  /* ================= УСТРОЙСТВА ================= */
  let SID = null, registered = false;
  function devName() {
    const u = navigator.userAgent;
    const os = /iPhone|iPad/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac OS/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : 'Устройство';
    const br = /Edg\//.test(u) ? 'Edge' : /YaBrowser/.test(u) ? 'Яндекс Браузер' : /OPR\//.test(u) ? 'Opera' : /Firefox/.test(u) ? 'Firefox' : /CriOS|Chrome/.test(u) ? 'Chrome' : /Safari/.test(u) ? 'Safari' : 'Браузер';
    return os + ' · ' + br + (matchMedia('(display-mode: standalone)').matches ? ' (приложение)' : '');
  }
  async function getSid() {
    try { const { data: { session } } = await sb.auth.getSession(); if (!session) return null; const p = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return p.session_id || null; } catch (e) { return null; }
  }
  async function registerDevice() {
    SID = await getSid(); if (!SID) return;
    const { error } = await sb.from('user_devices').upsert({ session_id: SID, user_id: ME.id, name: devName(), last_active: new Date().toISOString() }, { onConflict: 'session_id' });
    registered = !error;
  }
  async function heartbeat() {
    if (!SID || !registered || !ME) return;
    const { data, error } = await sb.from('user_devices').select('session_id').eq('session_id', SID).maybeSingle();
    if (error) return;
    if (!data) { registered = false; tst('Этот сеанс завершён на другом устройстве', 'red'); try { await sb.auth.signOut(); } catch (e) { } setTimeout(() => location.reload(), 900); return; }
    sb.from('user_devices').update({ last_active: new Date().toISOString() }).eq('session_id', SID).then(() => { });
  }
  const icon = n => /iPhone|Android/.test(n) ? '📱' : '💻';
  async function openDevices() {
    const p = page('devPage', 'Устройства и вход', 'где открыт твой аккаунт'), body = Q('.xo-body', p);
    async function draw() {
      const { data } = await sb.from('user_devices').select('session_id,name,created_at,last_active').order('last_active', { ascending: false });
      const list = data || [], cur = list.find(d => d.session_id === SID), others = list.filter(d => d.session_id !== SID);
      body.innerHTML =
        `<div class="xo-card"><h3>Это устройство</h3>${cur ? `<div class="dv"><div class="ic">${icon(cur.name)}</div><div class="tx"><b>${E(cur.name)}</b><small class="cur">● сейчас онлайн · вход ${E(when(cur.created_at))}</small></div></div>` : '<p>Не удалось определить сеанс. Обнови страницу.</p>'}</div>` +
        `<div class="xo-card"><h3>Другие устройства</h3>${others.length ? others.map(d => `<div class="dv"><div class="ic">${icon(d.name)}</div><div class="tx"><b>${E(d.name)}</b><small>был(а) ${E(when(d.last_active))}</small></div><button class="xo-btn sm dng" data-rev="${d.session_id}">Завершить</button></div>`).join('') : '<p>Других устройств не видно.</p>'}` +
        `<button class="xo-btn dng" data-all style="margin-top:6px">Завершить ВСЕ остальные сеансы</button></div>` +
        `<div class="xo-card"><h3>Если тебя взломали</h3><p>1) Смени пароль ниже. 2) Нажми «Завершить все остальные сеансы» — чужие входы будут выброшены, даже если они не видны в списке. Выброшенное устройство потеряет доступ в течение минуты (в худшем случае — до часа).</p>` +
        `<input class="xi" id="pw1" type="password" placeholder="Новый пароль (от 6 символов)" autocomplete="new-password"><input class="xi" id="pw2" type="password" placeholder="Повтори пароль" autocomplete="new-password"><button class="xo-btn" data-pw>Сменить пароль</button></div>`;
    }
    body.onclick = async e => {
      const r = e.target.closest('[data-rev]'), all = e.target.closest('[data-all]'), pw = e.target.closest('[data-pw]');
      if (r) { if (!await confirmBox('Завершить сеанс?', 'Это устройство будет выброшено из аккаунта.')) return; const { error } = await sb.rpc('revoke_device', { sid: r.dataset.rev }); if (error) return tst(ru(error.message), 'red'); tst('Сеанс завершён ✔'); draw(); }
      else if (all) { if (!await confirmBox('Завершить все остальные сеансы?', 'Все устройства, кроме этого, будут выброшены из аккаунта.')) return; const { data, error } = await sb.rpc('revoke_other_devices', { keep: SID }); if (error) return tst(ru(error.message), 'red'); tst('Остальные сеансы завершены ✔'); draw(); }
      else if (pw) {
        const a = Q('#pw1', body).value, b = Q('#pw2', body).value;
        if (a.length < 6) return tst('Пароль минимум 6 символов', 'red'); if (a !== b) return tst('Пароли не совпадают', 'red');
        const { error } = await sb.auth.updateUser({ password: a }); if (error) return tst(ru(error.message), 'red');
        Q('#pw1', body).value = Q('#pw2', body).value = ''; tst('Пароль изменён ✔');
      }
    };
    draw();
  }

  /* ================= ВХОДЫ В НАСТРОЙКАХ ================= */
  function injectSettings() {
    const ov = Q('#settingsOverlay'); if (!ov || Q('#xSec')) return;
    const first = Q('.settings-section', ov); if (!first) return;
    const row = (k, ic, t, s) => `<div class="settings-row" data-x="${k}" style="cursor:pointer"><div class="settings-row-left"><div class="settings-row-icon">${ic}</div><div><div class="settings-row-title">${t}</div><div class="settings-row-sub">${s}</div></div></div><span style="color:var(--mut);font-size:20px">›</span></div>`;
    const sec = document.createElement('div'); sec.className = 'settings-section'; sec.id = 'xSec';
    sec.innerHTML = '<div class="settings-label">Аккаунт и безопасность</div>' + row('saved', '⭐', 'Избранное', 'Заметки и файлы для себя') + row('story', '🌅', 'Добавить историю', 'Исчезает через 24 часа') + row('dev', '🛡', 'Устройства и вход', 'Выгнать чужие сеансы, сменить пароль');
    first.before(sec);
    sec.addEventListener('click', e => {
      const r = e.target.closest('[data-x]'); if (!r) return; ov.classList.remove('open');
      ({ saved: openSaved, story: pickStory, dev: openDevices })[r.dataset.x]();
    });
  }

  /* ================= ЗАПУСК ================= */
  let booted = false;
  async function boot() {
    if (booted || typeof ME === 'undefined' || !ME || !Q('#app') || Q('#app').classList.contains('hidden')) return; booted = true;
    await registerDevice(); setInterval(heartbeat, 45000); setTimeout(heartbeat, 6000);
    loadNotes().then(() => { refreshSavedItem(); }); loadStories(); setInterval(loadStories, 90000);
    const list = Q('#chatList'); if (list) {
      new MutationObserver(ensureSavedItem).observe(list, { childList: true });
      list.addEventListener('click', e => { if (e.target.closest('.sv-item')) { e.stopPropagation(); openSaved(); } }, true);
      ensureSavedItem();
    }
  }
  setInterval(() => { boot(); injectSettings(); }, 800);
})();
