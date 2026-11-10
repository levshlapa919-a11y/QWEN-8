/* features2: закрепы, печатает…, отложенные, автоудаление, опросы, фото на один просмотр, код-пароль, скрытые чаты */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const ready = () => typeof ME !== 'undefined' && ME && ME.id;

  /* ---------- модалка ---------- */
  function modal(title, body, onMount) {
    const ov = document.createElement('div'); ov.className = 'f2-ov';
    ov.innerHTML = `<div class="f2-card"><div class="f2-h"><b>${E(title)}</b><button class="f2-x">✕</button></div><div class="f2-b">${body}</div></div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.onclick = e => { if (e.target === ov || e.target.closest('.f2-x')) close(); };
    onMount && onMount(ov, close);
    return { ov, close };
  }

  /* ---------- теги в сообщениях: poll / once ---------- */
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf;
  window.parseMedia = function (c) {
    c = String(c == null ? '' : c);
    let m = c.match(/^\[\[poll\|([0-9a-f-]{36})\]\]/); if (m) return { kind: 'poll', id: m[1], cap: '' };
    m = c.match(/^\[\[once\|([^\]]+)\]\]/); if (m) return { kind: 'once', cap: '' };
    if (/^\[\[onceseen\|\]\]/.test(c)) return { kind: 'onceseen', cap: '' };
    return _pm(c);
  };
  window.mediaHTML = function (md) {
    if (md && md.kind === 'poll') return `<div class="poll-msg" data-poll="${E(md.id)}"><div class="poll-q">📊 Загрузка опроса…</div></div>`;
    if (md && md.kind === 'once') return `<button class="once-btn" type="button">📸 Фото · один просмотр<small>нажми, чтобы открыть</small></button>`;
    if (md && md.kind === 'onceseen') return `<div class="once-seen">📸 Фото просмотрено</div>`;
    return _mh(md);
  };
  window.previewOf = function (lm, chat) {
    const md = window.parseMedia(lm.content);
    if (md && (md.kind === 'poll' || md.kind === 'once' || md.kind === 'onceseen')) return (lm.sender_id === ME.id ? 'Вы: ' : '') + (md.kind === 'poll' ? '📊 Опрос' : '📸 Фото');
    return _pv(lm, chat);
  };

  /* ---------- опросы ---------- */
  const POLLS = {};
  function pollHTML(s) {
    if (!s) return `<div class="poll-q">📊 Опрос недоступен</div>`;
    const tot = s.total || 0, mx = Math.max.apply(null, s.counts.concat([1]));
    return `<div class="poll-q">📊 ${E(s.q)}</div><div class="poll-meta">${s.anon ? 'Анонимный' : 'Открытый'} · ${s.multiple ? 'несколько ответов' : 'один ответ'}${s.closed ? ' · завершён' : ''}</div>` +
      s.options.map((o, i) => {
        const c = s.counts[i] || 0, pc = tot ? Math.round(c * 100 / tot) : 0, on = (s.mine || []).indexOf(i) >= 0;
        const names = (s.voters || []).filter(v => v.opt === i).map(v => v.name).slice(0, 6).join(', ');
        return `<button class="poll-opt ${on ? 'on' : ''}" data-i="${i}" ${s.closed ? 'disabled' : ''}><span class="poll-bar" style="width:${pc}%"></span><span class="poll-t">${on ? '✔ ' : ''}${E(o)}</span><span class="poll-c">${pc}% · ${c}</span></button>${names ? `<div class="poll-names">${E(names)}</div>` : ''}`;
      }).join('') + `<div class="poll-foot">${tot} ${tot === 1 ? 'голос' : 'голосов'}${!s.closed && s.by === ME.id ? ' · <a data-close>Завершить</a>' : ''}</div>`;
  }
  function paintPoll(el, s) { POLLS[el.dataset.poll] = s; el.innerHTML = pollHTML(s); }
  async function hydratePolls() {
    if (!ready()) return;
    for (const el of QA('.poll-msg:not([data-h])')) {
      el.dataset.h = '1';
      const r = await rpc('poll_state', { p_poll: el.dataset.poll }); paintPoll(el, r.data || null);
    }
  }
  document.addEventListener('click', async e => {
    const el = e.target.closest('.poll-msg'); if (!el) return;
    const pid = el.dataset.poll;
    if (e.target.closest('[data-close]')) { const r = await rpc('close_poll', { p_poll: pid }); if (r.data) paintPoll(el, r.data); return; }
    const o = e.target.closest('.poll-opt'); if (!o || o.disabled) return;
    const r = await rpc('vote_poll', { p_poll: pid, p_opt: +o.dataset.i });
    if (r.data) { paintPoll(el, r.data); if (r.data.reward) tst('+5 000 gold за голос', ''); } else tst('Не удалось проголосовать', 'red');
  });
  setInterval(async () => {
    if (document.hidden || !ready()) return;
    for (const el of QA('.poll-msg[data-h]').slice(-6)) { const r = await rpc('poll_state', { p_poll: el.dataset.poll }); if (r.data) paintPoll(el, r.data); }
  }, 6000);

  function createPollUI() {
    if (!CURRENT) return;
    modal('📊 Новый опрос', `<input class="f2-in" id="pq" maxlength="300" placeholder="Вопрос"><div id="po"></div><button class="f2-btn ghost" id="pa">＋ Вариант</button>
      <label class="f2-chk"><input type="checkbox" id="pm"> Несколько ответов</label><label class="f2-chk"><input type="checkbox" id="pn"> Анонимный</label><button class="f2-btn" id="pgo">Создать</button>`, (ov, close) => {
      const box = Q('#po', ov); const add = () => { if (QA('input', box).length >= 10) return; const i = document.createElement('input'); i.className = 'f2-in'; i.maxLength = 100; i.placeholder = 'Вариант ' + (QA('input', box).length + 1); box.appendChild(i); };
      add(); add();
      Q('#pa', ov).onclick = add;
      Q('#pgo', ov).onclick = async () => {
        const q = Q('#pq', ov).value.trim(), opts = QA('input', box).map(i => i.value.trim()).filter(Boolean);
        if (!q || opts.length < 2) return tst('Нужен вопрос и минимум 2 варианта', 'red');
        const r = await rpc('create_poll', { p_chat: CURRENT, p_q: q, p_opts: opts, p_multiple: Q('#pm', ov).checked, p_anon: Q('#pn', ov).checked });
        if (r.error || !r.data || !r.data.ok) return tst('Не удалось создать опрос', 'red');
        close(); tst('Опрос создан ✔'); if (window.GOLDA_REFRESH_MSGS) window.GOLDA_REFRESH_MSGS();
      };
    });
  }

  /* ---------- фото на один просмотр ---------- */
  function sendOnceUI() {
    if (!CURRENT) return;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > 8 * 1024 * 1024) return tst('Фото больше 8 МБ', 'red');
      tst('Отправляю…');
      const ext = (f.name.match(/\.([a-z0-9]{2,5})$/i) || [, 'jpg'])[1].toLowerCase();
      let path = `once/${ME.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      let up = await sb.storage.from('avatars').upload(path, f, { contentType: f.type || 'image/jpeg' });
      if (up.error) { path = `music/${ME.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`; up = await sb.storage.from('avatars').upload(path, f, { contentType: f.type || 'image/jpeg' }); }
      if (up.error) return tst('Не загрузилось: ' + up.error.message, 'red');
      const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      const ok = window.V3 && V3.sendContent ? await V3.sendContent('[[once|' + url + ']]') : await sendRaw('[[once|' + url + ']]');
      if (ok !== false) tst('Отправлено ✔');
    };
    inp.click();
  }
  async function sendRaw(content) {
    const { data, error } = await sb.from('messages').insert({ chat_id: CURRENT, sender_id: ME.id, content }).select().single();
    if (error) { tst('Ошибка: ' + error.message, 'red'); return false; }
    if (typeof onMsgInsert === 'function') onMsgInsert(data); return true;
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.once-btn'); if (!b) return;
    const msg = b.closest('.msg'); if (!msg) return;
    if (msg.classList.contains('own')) return tst('Получатель увидит фото один раз');
    const r = await rpc('open_once', { p_msg: msg.dataset.id });
    if (!r.data || !r.data.ok) return tst('Фото уже просмотрено', 'red');
    const ov = document.createElement('div'); ov.className = 'once-view';
    ov.innerHTML = `<div class="once-top">📸 Только один просмотр · не делай скриншот</div><img src="${E(r.data.url)}" alt="">`;
    ov.onclick = () => ov.remove(); document.body.appendChild(ov);
    b.replaceWith(Object.assign(document.createElement('div'), { className: 'once-seen', textContent: '📸 Фото просмотрено' }));
  });

  /* ---------- закреп ---------- */
  let pinBar = null, pinFor = null;
  async function refreshPin() {
    if (!ready() || !CURRENT) { if (pinBar) pinBar.remove(), pinBar = null; pinFor = null; return; }
    const chat = CURRENT;
    const { data } = await sb.from('pinned_messages').select('message_id').eq('chat_id', chat).maybeSingle();
    if (chat !== CURRENT) return;
    if (!data) { if (pinBar) pinBar.remove(), pinBar = null; return; }
    const { data: m } = await sb.from('messages').select('id,content,sender_id').eq('id', data.message_id).maybeSingle();
    if (!m) { if (pinBar) pinBar.remove(), pinBar = null; return; }
    const md = window.parseMedia(m.content); let t = md ? ({ poll: '📊 Опрос', once: '📸 Фото', gift: '🎁 Подарок', image: '🖼 Фото' }[md.kind] || '📎 Вложение') : m.content;
    const sc = Q('#msgScroll'); if (!sc) return;
    if (!pinBar) { pinBar = document.createElement('div'); pinBar.className = 'pin-bar'; sc.parentNode.insertBefore(pinBar, sc); }
    pinBar.innerHTML = `<span>📌</span><div><b>Закреплённое</b><div class="pin-t">${E(String(t).slice(0, 120))}</div></div><button class="pin-x" title="Открепить">✕</button>`;
    pinBar.onclick = async ev => {
      if (ev.target.closest('.pin-x')) { await rpc('pin_message', { p_msg: m.id, p_pin: false }); refreshPin(); return; }
      const el = Q('.msg[data-id="' + m.id + '"]'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('f2-flash'); setTimeout(() => el.classList.remove('f2-flash'), 1500); } else tst('Сообщение выше в истории');
    };
  }

  /* ---------- автоудаление ---------- */
  const TTLS = [[0, 'Выключено'], [3600, '1 час'], [86400, '1 день'], [604800, '1 неделя'], [2592000, '1 месяц']];
  async function ttlUI() {
    if (!CURRENT) return;
    const { data } = await sb.from('chat_settings').select('ttl_seconds').eq('chat_id', CURRENT).maybeSingle();
    const cur = (data && data.ttl_seconds) || 0;
    modal('⏱ Автоудаление', `<div class="f2-note">Новые сообщения в этом чате будут удаляться у всех через выбранное время.</div>` + TTLS.map(t => `<button class="f2-opt ${t[0] === cur ? 'on' : ''}" data-s="${t[0]}">${t[1]}</button>`).join(''), (ov, close) => {
      ov.onclick = async e => { const b = e.target.closest('[data-s]'); if (!b) { if (e.target === ov) close(); return; } const r = await rpc('set_chat_ttl', { p_chat: CURRENT, p_seconds: +b.dataset.s }); close(); tst(r.error ? 'Не вышло' : (+b.dataset.s ? 'Автоудаление включено ✔' : 'Автоудаление выключено'), r.error ? 'red' : ''); updateTtlBadge(); };
    });
  }
  async function updateTtlBadge() {
    if (!ready() || !CURRENT) return;
    const chat = CURRENT; const { data } = await sb.from('chat_settings').select('ttl_seconds').eq('chat_id', chat).maybeSingle();
    if (chat !== CURRENT) return;
    const s = Q('#headSub'); if (!s) return; const old = Q('.ttl-badge'); if (old) old.remove();
    if (data && data.ttl_seconds) { const t = TTLS.find(x => x[0] === data.ttl_seconds); const b = document.createElement('span'); b.className = 'ttl-badge'; b.textContent = ' · ⏱ ' + (t ? t[1] : ''); s.appendChild(b); }
  }

  /* ---------- отложенные сообщения ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function localISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function scheduleUI() {
    const inp = Q('#msgInput'); if (!CURRENT || !inp) return;
    const text = inp.value.trim(); if (!text) return tst('Сначала напиши текст сообщения');
    const d = new Date(Date.now() + 3600000);
    modal('⏰ Отправить позже', `<div class="f2-note">«${E(text.slice(0, 80))}»</div><input class="f2-in" type="datetime-local" id="sat" value="${localISO(d)}" min="${localISO(new Date())}"><div class="f2-row"><button class="f2-chip" data-m="10">10 мин</button><button class="f2-chip" data-m="60">1 час</button><button class="f2-chip" data-m="480">8 часов</button><button class="f2-chip" data-m="1440">Завтра</button></div><button class="f2-btn" id="sgo">Запланировать</button>`, (ov, close) => {
      ov.addEventListener('click', e => { const c = e.target.closest('[data-m]'); if (c) Q('#sat', ov).value = localISO(new Date(Date.now() + c.dataset.m * 60000)); });
      Q('#sgo', ov).onclick = async () => {
        const at = new Date(Q('#sat', ov).value); if (isNaN(at)) return tst('Выбери время', 'red');
        const r = await rpc('schedule_message', { p_chat: CURRENT, p_content: text, p_at: at.toISOString() });
        if (r.error || !r.data || !r.data.ok) return tst({ bad_time: 'Время должно быть в будущем', too_many: 'Слишком много отложенных', bad_text: 'Плохой текст' }[r.data && r.data.error] || 'Не вышло', 'red');
        inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); close(); tst('Запланировано на ' + at.toLocaleString('ru-RU') + ' ⏰');
      };
    });
  }
  async function listScheduledUI() {
    if (!ready()) return;
    const { data } = await sb.from('scheduled_messages').select('id,chat_id,content,send_at').eq('status', 'pending').order('send_at');
    const rows = data || [];
    modal('⏰ Отложенные', rows.length ? rows.map(r => `<div class="sch-row"><div><div class="sch-t">${E(r.content.slice(0, 100))}</div><div class="sch-d">${new Date(r.send_at).toLocaleString('ru-RU')}</div></div><button class="f2-chip" data-c="${r.id}">Отмена</button></div>`).join('') : '<div class="f2-note">Нет запланированных сообщений</div>', (ov) => {
      ov.addEventListener('click', async e => { const b = e.target.closest('[data-c]'); if (!b) return; await rpc('cancel_scheduled', { p_id: b.dataset.c }); b.closest('.sch-row').remove(); });
    });
  }
  /* долгое нажатие на «Отправить» → отложить */
  (function () {
    const btn = Q('#sendBtn'); if (!btn) return; let t = null, fired = false;
    const start = () => { fired = false; t = setTimeout(() => { fired = true; try { navigator.vibrate && navigator.vibrate(20); } catch (e) { } scheduleUI(); }, 650); };
    const stop = () => clearTimeout(t);
    btn.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => btn.addEventListener(n, stop));
    btn.addEventListener('click', e => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  })();

  /* ---------- печатает… ---------- */
  let typCh = null, typFor = null, lastTyp = 0, hideT = null;
  function setupTyping() {
    if (!ready()) return;
    if (typFor === CURRENT) return;
    if (typCh) { try { sb.removeChannel(typCh); } catch (e) { } typCh = null; }
    typFor = CURRENT; if (!CURRENT) return;
    try {
      typCh = sb.channel('typ-' + CURRENT, { config: { broadcast: { self: false } } }).on('broadcast', { event: 'typing' }, p => {
        if (!p || !p.payload || p.payload.u === ME.id) return;
        const s = Q('#headSub'); if (!s) return;
        s.dataset.orig = s.dataset.orig || s.innerHTML; s.innerHTML = '<span class="st-on">✎ ' + E(p.payload.n || 'печатает') + ' печатает…</span>';
        clearTimeout(hideT); hideT = setTimeout(() => { if (typeof renderChatHeader === 'function') { try { renderChatHeader(); updateTtlBadge(); } catch (e) { } } delete s.dataset.orig; }, 3500);
      }).subscribe();
    } catch (e) { }
  }
  const mi = Q('#msgInput');
  if (mi) mi.addEventListener('input', () => {
    if (!typCh || !mi.value || Date.now() - lastTyp < 2500) return; lastTyp = Date.now();
    try { typCh.send({ type: 'broadcast', event: 'typing', payload: { u: ME.id, n: ME.display_name || ME.username } }); } catch (e) { }
  });

  /* ---------- код-пароль и скрытые чаты ---------- */
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('golda|' + s)); return [].map.call(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join(''); }
  const hasPass = () => !!LS.get('golda_pass', '');
  let locked = false;
  function lockScreen() {
    if (!hasPass() || locked || Q('.lock-ov')) return; locked = true;
    const ov = document.createElement('div'); ov.className = 'lock-ov';
    ov.innerHTML = `<div class="lock-c"><div class="lock-i">🔒</div><div class="lock-t">Введи код-пароль</div><div class="lock-dots"></div><div class="lock-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => `<button data-k="${k}" ${k === '' ? 'disabled' : ''}>${k}</button>`).join('')}</div></div>`;
    document.body.appendChild(ov); let cur = '';
    const dots = Q('.lock-dots', ov), paint = () => { dots.textContent = '●'.repeat(cur.length) + '○'.repeat(Math.max(0, 4 - cur.length)); }; paint();
    ov.onclick = async e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === '⌫') cur = cur.slice(0, -1); else if (cur.length < 8) cur += k; paint();
      if (cur.length >= 4 && (await sha(cur)) === LS.get('golda_pass', '')) { ov.remove(); locked = false; LS.set('golda_unlock', String(Date.now())); }
      else if (cur.length >= 8) { cur = ''; paint(); ov.classList.add('shake'); setTimeout(() => ov.classList.remove('shake'), 400); }
    };
  }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hasPass() && hiddenAt && Date.now() - hiddenAt > 30000) lockScreen(); });
  if (hasPass()) lockScreen();
  function passUI() {
    modal('🔒 Код-пароль', `<div class="f2-note">Приложение будет просить код при открытии и после сворачивания. Код хранится только на этом устройстве.</div><input class="f2-in" id="pw" type="password" inputmode="numeric" maxlength="8" placeholder="4–8 цифр">${hasPass() ? '<button class="f2-btn ghost" id="poff">Отключить код</button>' : ''}<button class="f2-btn" id="pset">Установить</button>`, (ov, close) => {
      Q('#pset', ov).onclick = async () => { const v = Q('#pw', ov).value; if (!/^\d{4,8}$/.test(v)) return tst('Нужно 4–8 цифр', 'red'); LS.set('golda_pass', await sha(v)); close(); tst('Код-пароль включён ✔'); };
      const off = Q('#poff', ov); if (off) off.onclick = () => { LS.set('golda_pass', ''); close(); tst('Код-пароль отключён'); };
    });
  }
  const hid = () => { try { return JSON.parse(LS.get('golda_hidden', '[]')); } catch (e) { return []; } };
  let showHidden = false;
  function applyHidden() { const h = hid(); QA('#chatList .chat-item').forEach(el => { el.style.display = (!showHidden && h.indexOf(el.dataset.id) >= 0) ? 'none' : ''; }); }
  const _rcl = window.renderChatList;
  if (typeof _rcl === 'function') window.renderChatList = function () { const r = _rcl.apply(this, arguments); applyHidden(); return r; };
  async function toggleHideChat() {
    if (!CURRENT) return; const h = hid(), i = h.indexOf(CURRENT);
    if (i >= 0) h.splice(i, 1); else { if (!hasPass()) { tst('Сначала включи код-пароль', 'red'); return passUI(); } h.push(CURRENT); }
    LS.set('golda_hidden', JSON.stringify(h)); tst(i >= 0 ? 'Чат больше не скрыт' : 'Чат скрыт. Показать: введи «код» в поиске чатов'); applyHidden();
    if (i < 0 && typeof closeChat === 'function') closeChat();
  }
  const si = Q('#searchInput');
  if (si) si.addEventListener('input', async () => {
    const v = si.value.trim();
    if (/^\d{4,8}$/.test(v) && hasPass() && (await sha(v)) === LS.get('golda_pass', '')) { showHidden = true; si.value = ''; applyHidden(); tst('Скрытые чаты показаны'); setTimeout(() => { showHidden = false; applyHidden(); }, 60000); }
  });

  /* ---------- меню: сообщение и чат ---------- */
  let lastMid = null;
  const track = e => { const m = e.target.closest && e.target.closest('.msg[data-id]'); if (m) lastMid = m.dataset.id; };
  ['pointerdown', 'contextmenu', 'touchstart'].forEach(n => document.addEventListener(n, track, { passive: true, capture: true }));
  new MutationObserver(ms => {
    for (const mu of ms) for (const n of mu.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.classList && n.classList.contains('ms-ov')) {
        const list = Q('.ms-list', n); if (!list || !lastMid || Q('[data-f2]', list)) continue; const mid = lastMid;
        const b = document.createElement('button'); b.className = 'ms-act'; b.dataset.f2 = 'pin'; b.innerHTML = '<i>📌</i>Закрепить';
        b.addEventListener('click', async ev => { ev.stopPropagation(); n.remove(); const r = await rpc('pin_message', { p_msg: mid, p_pin: true }); tst(r.data && r.data.ok ? 'Закреплено 📌' : 'Не вышло', r.data && r.data.ok ? '' : 'red'); refreshPin(); });
        const first = Q('[data-a="fwd"]', list); list.insertBefore(b, first ? first.nextSibling : null);
      }
    }
    hydratePolls(); decorateMenu();
  }).observe(document.body, { childList: true, subtree: true });

  function decorateMenu() {
    const menu = Q('#chatMenu'); if (!menu || Q('[data-f2m]', menu) || !menu.children.length) return;
    const it = [['poll', '📊 Создать опрос'], ['once', '📸 Фото на один просмотр'], ['ttl', '⏱ Автоудаление'], ['sch', '⏰ Отложенные сообщения'], ['hide', '🙈 Скрыть / показать чат'], ['pass', '🔒 Код-пароль приложения']];
    it.forEach(x => { const b = document.createElement('button'); b.className = 'menu-i'; b.dataset.f2m = x[0]; b.textContent = x[1]; menu.insertBefore(b, menu.firstChild.nextSibling ? menu.children[1] : null); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-f2m]'); if (!b) return; e.stopPropagation(); const m = Q('#chatMenu'); if (m) m.classList.remove('open');
    ({ poll: createPollUI, once: sendOnceUI, ttl: ttlUI, sch: listScheduledUI, hide: toggleHideChat, pass: passUI })[b.dataset.f2m]();
  }, true);

  /* ---------- смена чата ---------- */
  let seen = null;
  setInterval(() => {
    if (!ready()) return;
    if (CURRENT !== seen) { seen = CURRENT; refreshPin(); setupTyping(); setTimeout(updateTtlBadge, 400); hydratePolls(); }
    decorateMenu();
  }, 700);
  setInterval(() => { if (!document.hidden && CURRENT) refreshPin(); }, 20000);
  window.F2 = { modal: modal, poll: createPollUI, once: sendOnceUI, ttl: ttlUI, schedule: scheduleUI, pass: passUI };
})();
