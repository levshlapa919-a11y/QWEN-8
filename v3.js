/* golda-mesenger v3 — ответы (свайп влево), меню по зажатию, реакции, стикеры, пересылка, правка,
   вкладка «Звонки», кастомизация, удаление аккаунта. Подключается после index.html-скрипта. */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s);
  const QA = (s, r) => Array.from((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } } };

  const V3 = window.V3 = { reply: null, edit: null };
  const CACHE = {};          // id -> message row
  const REACT = {};          // message_id -> [{user_id,emoji}]

  /* ================= КАСТОМИЗАЦИЯ ================= */
  const FONTS = [
    ['Manrope', "'Manrope',system-ui,sans-serif", 'Manrope:wght@400;500;600;700;800'],
    ['Системный', "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", ''],
    ['Inter', "'Inter',sans-serif", 'Inter:wght@400;500;600;700;800'],
    ['Nunito', "'Nunito',sans-serif", 'Nunito:wght@400;600;700;800'],
    ['Montserrat', "'Montserrat',sans-serif", 'Montserrat:wght@400;500;600;700;800'],
    ['Rubik', "'Rubik',sans-serif", 'Rubik:wght@400;500;600;700'],
    ['Comfortaa', "'Comfortaa',sans-serif", 'Comfortaa:wght@400;600;700'],
    ['Exo 2', "'Exo 2',sans-serif", 'Exo+2:wght@400;500;600;700;800'],
    ['Oswald', "'Oswald',sans-serif", 'Oswald:wght@400;500;600;700'],
    ['Russo One', "'Russo One',sans-serif", 'Russo+One'],
    ['Playfair', "'Playfair Display',serif", 'Playfair+Display:wght@400;600;700;800'],
    ['Lora', "'Lora',serif", 'Lora:wght@400;500;600;700'],
    ['JetBrains Mono', "'JetBrains Mono',monospace", 'JetBrains+Mono:wght@400;600;700']
  ];
  const ACCENTS = ['#3dff85', '#00e5ff', '#3c8cff', '#a56bff', '#ff5ec8', '#ff4d6d', '#ff8c32', '#ffd34d', '#c6ff3d', '#ffffff'];
  const WALLS = [
    ['none', 'Без', ''],
    ['aurora', 'Аврора', 'radial-gradient(600px 400px at 85% 0%,color-mix(in srgb,var(--neon) 22%,transparent),transparent 70%),radial-gradient(500px 400px at 0% 100%,color-mix(in srgb,var(--gold) 14%,transparent),transparent 70%),var(--bg)'],
    ['sunset', 'Закат', 'linear-gradient(160deg,#2b1055,#7597de 55%,#ff9a8b)'],
    ['ocean', 'Океан', 'linear-gradient(160deg,#021b3a,#0a4d68 55%,#05dfd7)'],
    ['night', 'Ночь', 'linear-gradient(180deg,#05060f,#141a3a)'],
    ['forest', 'Лес', 'linear-gradient(160deg,#04180c,#0f5132 60%,#9be15d)'],
    ['dots', 'Точки', 'radial-gradient(circle at 1px 1px,color-mix(in srgb,var(--neon) 35%,transparent) 1.4px,transparent 1.6px) 0 0/22px 22px,var(--bg)'],
    ['grid', 'Сетка', 'linear-gradient(color-mix(in srgb,var(--neon) 12%,transparent) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,color-mix(in srgb,var(--neon) 12%,transparent) 1px,transparent 1px) 0 0/28px 28px,var(--bg)']
  ];
  const DEF = { font: 'Manrope', size: null, accent: '', bub: 'round', wall: 'none', wallImg: '', rx: ['❤️', '👍', '😂', '🔥', '😮', '😢'] };
  let CUST = Object.assign({}, DEF);
  try { CUST = Object.assign({}, DEF, JSON.parse(LS.get('golda_cust', '{}') || '{}')); } catch (e) { }
  if (CUST.size && CUST.size > 18) CUST.size = 18;
  const saveCust = () => LS.set('golda_cust', JSON.stringify(CUST));
  let fontsLoaded = false;
  function loadFonts(all) {
    const list = all ? FONTS : FONTS.filter(f => f[0] === CUST.font);
    const fam = list.map(f => f[2]).filter(Boolean);
    if (!fam.length) return;
    const id = all ? 'gfont-all' : 'gfont-cur';
    if (all && fontsLoaded) return; if (all) fontsLoaded = true;
    if (document.getElementById(id)) document.getElementById(id).remove();
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?' + fam.map(f => 'family=' + f).join('&') + '&display=swap';
    document.head.appendChild(l);
  }
  function lum(hex) { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
  function applyCust() {
    const root = document.documentElement, b = document.body, st = b.style;
    const f = FONTS.find(x => x[0] === CUST.font) || FONTS[0];
    root.style.setProperty('--font', f[1]); loadFonts(false);
    if (CUST.size) root.style.setProperty('--font-size', CUST.size + 'px');
    if (CUST.accent && /^#[0-9a-f]{6}$/i.test(CUST.accent)) {
      const c = CUST.accent, dark = lum(c) > .5;
      st.setProperty('--neon', c); st.setProperty('--accent', c);
      st.setProperty('--line2', `color-mix(in srgb,${c} 34%,transparent)`); st.setProperty('--line', `color-mix(in srgb,${c} 16%,transparent)`);
      st.setProperty('--own-tx', dark ? '#06100a' : '#fff'); st.setProperty('--own-time', dark ? 'rgba(6,16,10,.62)' : 'rgba(255,255,255,.8)');
      st.setProperty('--own-tick', dark ? 'rgba(6,16,10,.45)' : 'rgba(255,255,255,.6)'); st.setProperty('--own-read', dark ? '#0a46c2' : '#fff');
    } else ['--neon', '--accent', '--line2', '--line', '--own-tx', '--own-time', '--own-tick', '--own-read'].forEach(k => st.removeProperty(k));
    b.dataset.bub = CUST.bub || 'round';
    const w = WALLS.find(x => x[0] === CUST.wall);
    if (CUST.wall === 'img' && CUST.wallImg) { b.dataset.wall = 'img'; st.setProperty('--wall', `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url("${CUST.wallImg}")`); }
    else if (w && w[2]) { b.dataset.wall = w[0]; st.setProperty('--wall', w[2]); }
    else { delete b.dataset.wall; st.removeProperty('--wall'); }
  }

  const EMOJI = '😀😃😄😁😆😅😂🤣🥲😊😇🙂😉😍🥰😘😋😛😜🤪😎🤩🥳😏😒😞😔😢😭😤😡🤬🤯😳🥵🥶😱😨🤗🤔🤫🙄😴🤤😷🤒🤡👻💀👽🤖💩🙈🙉🙊❤️🧡💛💚💙💜🖤🤍💔❣️💕💯💥🔥✨⭐🌈☀️🌙⚡❄️👍👎👌✌️🤞🤟🤘👏🙌🙏💪👀🧠🎉🎁🏆🥇🎮🎧🎵🍕🍔🍟🍺🍷☕🍀🌹'.match(/\p{Extended_Pictographic}️?(‍\p{Extended_Pictographic}️?)*/gu) || [];

  function czSection() {
    const fonts = FONTS.map(f => `<button data-f="${E(f[0])}" class="${CUST.font === f[0] ? 'on' : ''}" style="font-family:${f[1]}">${E(f[0])}</button>`).join('');
    const sw = ACCENTS.map(c => `<button data-c="${c}" style="background:${c}" class="${CUST.accent === c ? 'on' : ''}"></button>`).join('');
    const bub = [['round', 'Круглые'], ['soft', 'Мягкие'], ['sharp', 'Острые'], ['flat', 'Плоские']].map(b => `<button data-b="${b[0]}" class="${CUST.bub === b[0] ? 'on' : ''}">${b[1]}</button>`).join('');
    const walls = WALLS.map(w => `<button data-w="${w[0]}" class="${CUST.wall === w[0] ? 'on' : ''}" style="background:${w[2] || 'var(--p3)'}">${w[0] === 'none' ? 'Без' : ''}</button>`).join('') +
      `<button data-w="img" class="${CUST.wall === 'img' ? 'on' : ''}" style="background:var(--p3)">📷 Своё</button>`;
    const el = document.createElement('div'); el.className = 'settings-section'; el.id = 'czSection';
    el.innerHTML = `<div class="settings-label">✨ Кастомизация</div>
      <div class="cz-lbl">Шрифт</div><div class="cz-fonts" id="czFonts">${fonts}</div>
      <div class="cz-lbl">Размер текста: <b id="czSizeV">${CUST.size || 'авто'}</b></div>
      <input type="range" class="cz-range" id="czSize" min="12" max="18" step="1" value="${CUST.size || 14}">
      <div class="cz-lbl">Цвет акцента</div>
      <div class="cz-sw" id="czAcc">${sw}<input type="color" id="czAccPick" value="${CUST.accent || '#3dff85'}"><button data-c="" style="background:var(--p3);font-size:13px" title="По умолчанию">↺</button></div>
      <div class="cz-lbl">Форма сообщений</div><div class="cz-opts" id="czBub">${bub}</div>
      <div class="cz-lbl">Фон чата</div><div class="cz-wall" id="czWall">${walls}</div>
      <input type="file" id="czWallFile" accept="image/*" class="hidden">
      <div class="cz-lbl">Быстрые реакции (нажми — убрать)</div>
      <div class="cz-rx" id="czRx"></div>
      <div class="cz-row"><input class="inp" id="czRxIn" placeholder="Добавить эмодзи 😎" maxlength="12"><button class="btn primary" id="czRxAdd" style="padding:0 18px">＋</button></div>
      <div class="cz-lbl">Стикеры</div>
      <button class="btn ghost" id="czStk" style="width:100%">🎭 Мои стикеры — добавить / удалить</button>
      <button class="btn ghost" id="czReset" style="width:100%;margin-top:14px">↺ Сбросить всю кастомизацию</button>
      <div class="cz-danger"><b>🗑 Удаление аккаунта</b><p>Профиль, личные чаты и все твои сообщения удалятся безвозвратно. Отменить нельзя.</p><button class="btn dng" id="czDel">Удалить аккаунт</button></div>`;
    return el;
  }
  function renderCzRx() {
    const b = Q('#czRx'); if (!b) return;
    b.innerHTML = CUST.rx.map((e, i) => `<button data-i="${i}">${E(e)}</button>`).join('') || '<span style="color:var(--mut)">пусто</span>';
  }
  function injectSettings() {
    const ov = Q('#settingsOverlay'); if (!ov || Q('#czSection')) return;
    const first = Q('.settings-section', ov); const sec = czSection();
    if (first) first.after(sec); else Q('.modal', ov).appendChild(sec);
    // старый выбор размера заменён ползунком
    const old = Q('.font-size-options', ov); if (old) { old.style.display = 'none'; const row = old.previousElementSibling; if (row) row.style.display = 'none'; }
    renderCzRx();
    sec.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.f) { CUST.font = t.dataset.f; saveCust(); applyCust(); QA('#czFonts button', sec).forEach(x => x.classList.toggle('on', x === t)); }
      else if (t.dataset.c !== undefined && t.closest('#czAcc')) { CUST.accent = t.dataset.c; saveCust(); applyCust(); QA('#czAcc button', sec).forEach(x => x.classList.toggle('on', x === t)); }
      else if (t.dataset.b) { CUST.bub = t.dataset.b; saveCust(); applyCust(); QA('#czBub button', sec).forEach(x => x.classList.toggle('on', x === t)); }
      else if (t.dataset.w) {
        if (t.dataset.w === 'img') { Q('#czWallFile').click(); return; }
        CUST.wall = t.dataset.w; saveCust(); applyCust(); QA('#czWall button', sec).forEach(x => x.classList.toggle('on', x === t));
      }
      else if (t.closest('#czRx') && t.dataset.i != null) { CUST.rx.splice(+t.dataset.i, 1); saveCust(); renderCzRx(); }
      else if (t.id === 'czRxAdd') addRx();
      else if (t.id === 'czStk') { Q('#settingsOverlay').classList.remove('open'); openStickers(true); }
      else if (t.id === 'czReset') { if (await confirmBox('Сбросить кастомизацию?', 'Шрифт, цвета, фон и реакции вернутся к стандартным.')) { CUST = Object.assign({}, DEF); saveCust(); document.documentElement.style.removeProperty('--font'); document.documentElement.style.removeProperty('--font-size'); applyCust(); sec.replaceWith(czSection()); injectSettings(); tst('Сброшено ✔'); } }
      else if (t.id === 'czDel') deleteAccount();
    });
    Q('#czSize').addEventListener('input', function () { CUST.size = +this.value; Q('#czSizeV').textContent = this.value; saveCust(); applyCust(); });
    Q('#czAccPick').addEventListener('input', function () { CUST.accent = this.value; saveCust(); applyCust(); QA('#czAcc button', sec).forEach(x => x.classList.remove('on')); });
    Q('#czRxIn').addEventListener('keydown', e => { if (e.key === 'Enter') addRx(); });
    Q('#czWallFile').addEventListener('change', async function () {
      const f = this.files[0]; this.value = ''; if (!f) return;
      try {
        const url = await downscale(f, 1100, 'image/jpeg', .72);
        CUST.wall = 'img'; CUST.wallImg = url;
        if (!saveCust()) { tst('Картинка слишком большая для памяти браузера', 'red'); CUST.wall = 'none'; CUST.wallImg = ''; return; }
        applyCust(); QA('#czWall button', sec).forEach(x => x.classList.toggle('on', x.dataset.w === 'img')); tst('Фон установлен ✔');
      } catch (e) { tst('Не удалось загрузить картинку', 'red'); }
    });
    // шрифты для превью подгружаем один раз при открытии настроек
    new MutationObserver(() => { if (ov.classList.contains('open')) loadFonts(true); }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    // тест экрана бана — только админам
    const adm = document.createElement('div'); adm.id = 'czAdminTest';
    sec.appendChild(adm);
    const upd = () => { adm.innerHTML = (typeof ME !== 'undefined' && ME && ME.is_admin) ? '<button class="btn ghost" id="czScare" style="width:100%;margin-top:12px">👻 Проверить экран бана (только админам)</button>' : ''; const b = Q('#czScare'); if (b) b.onclick = () => { Q('#settingsOverlay').classList.remove('open'); if (window.GScare) GScare.show(true); }; };
    new MutationObserver(upd).observe(ov, { attributes: true, attributeFilter: ['class'] }); upd();
  }
  function addRx() {
    const inp = Q('#czRxIn'); const m = (inp.value.match(/\p{Extended_Pictographic}️?(‍\p{Extended_Pictographic}️?)*/gu) || []);
    if (!m.length) return tst('Введи эмодзи', 'red');
    m.forEach(x => { if (!CUST.rx.includes(x) && CUST.rx.length < 8) CUST.rx.push(x); });
    inp.value = ''; saveCust(); renderCzRx();
  }
  function downscale(file, max, type, q) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        let { width: w, height: h } = img; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u); res(c.toDataURL(type, q));
      }; img.onerror = rej; img.src = u;
    });
  }
  function canvasBlob(file, max) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        let { width: w, height: h } = img; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u); c.toBlob(b => b ? res(b) : rej(), 'image/png');
      }; img.onerror = rej; img.src = u;
    });
  }

  /* ================= УДАЛЕНИЕ АККАУНТА ================= */
  async function deleteAccount() {
    if (ME.email === OWNER_EMAIL) return tst('👑 Аккаунт создателя удалить нельзя', 'red');
    if (!await confirmBox('Удалить аккаунт?', 'Всё будет удалено безвозвратно: профиль, личные чаты, сообщения.')) return;
    const word = (prompt('Для подтверждения напиши слово: УДАЛИТЬ') || '').trim().toUpperCase();
    if (word !== 'УДАЛИТЬ') return tst('Отменено', '');
    const { error } = await sb.rpc('delete_my_account');
    if (error) return tst('Ошибка: ' + (error.message || ''), 'red');
    try { await sb.auth.signOut(); } catch (e) { }
    try { localStorage.clear(); } catch (e) { }
    tst('Аккаунт удалён');
    setTimeout(() => location.reload(), 700);
  }

  /* ================= СТИКЕРЫ ================= */
  const STK = [['👋', 'Привет'], ['🫶', 'Пока'], ['😎', 'Круто'], ['😂', 'ЛОЛ'], ['😍', 'Люблю'], ['🔥', 'Огонь'], ['👌', 'ОК'], ['🙏', 'Спасибо'], ['🥲', 'Грущу'], ['😡', 'Злюсь'], ['😴', 'Сплю'], ['🤔', 'Думаю'],
  ['🎉', 'Ура!'], ['🫡', 'Респект'], ['🤯', 'Вау'], ['🤑', 'Деньги'], ['🙄', 'Ну-ну'], ['😱', 'Ужас'], ['🤗', 'Обнял'], ['☕', 'Кофе'], ['🏆', 'Победа'], ['🤫', 'Тсс'], ['🤷', 'Хз'], ['⏳', 'Жду']];
  function stkSVG(i) {
    const [em, cap] = STK[i], h = (i * 47 + 130) % 360, id = 'g' + i;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},85%,52%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},80%,30%)"/></linearGradient><linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3dff85"/><stop offset="1" stop-color="#ffd34d"/></linearGradient></defs>` +
      `<rect x="6" y="6" width="148" height="148" rx="40" fill="url(#${id})" stroke="rgba(255,255,255,.55)" stroke-width="3"/>` +
      `<circle cx="132" cy="28" r="9" fill="none" stroke="url(#${id}r)" stroke-width="4.5"/><circle cx="132" cy="28" r="2.2" fill="#ffd34d"/>` +
      `<text x="80" y="92" font-size="68" text-anchor="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${em}</text>` +
      `<text x="80" y="134" font-size="19" font-weight="800" text-anchor="middle" fill="#fff" font-family="Manrope,Arial,sans-serif" letter-spacing=".5">${cap.toUpperCase()}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const stkSrc = ref => { if (ref.startsWith('b:')) { const i = +ref.slice(2); return STK[i] ? stkSVG(i) : ''; } return ref; };
  let MYSTK = [];
  async function loadMyStickers() { const { data } = await sb.from('user_stickers').select('id,url').order('created_at', { ascending: false }); MYSTK = data || []; }
  let stkTab = 'b', stkManage = false;
  function stickersHTML() {
    let g = '';
    if (stkTab === 'b') g = STK.map((_, i) => `<button class="st" data-s="b:${i}"><img src="${stkSVG(i)}" alt=""></button>`).join('');
    else g = `<button class="st add" data-add>＋</button>` + MYSTK.map(s => `<button class="st" data-s="${E(s.url)}" data-id="${s.id}"><img src="${E(s.url)}" alt="" loading="lazy">${stkManage ? `<span class="del" data-del="${s.id}">✕</span>` : ''}</button>`).join('');
    return `<div class="stk-tabs"><button data-t="b" class="${stkTab === 'b' ? 'on' : ''}">Golda</button><button data-t="m" class="${stkTab === 'm' ? 'on' : ''}">Мои</button></div>` +
      (stkTab === 'm' ? `<div class="stk-hint">Загрузи любую картинку — она станет твоим стикером. ${MYSTK.length ? '<a href="#" data-manage style="color:var(--neon)">' + (stkManage ? 'Готово' : 'Удалить…') + '</a>' : ''}</div>` : '') +
      `<div class="stk-grid">${g}</div>`;
  }
  async function openStickers(manage) {
    let p = Q('#stkPanel');
    if (p && !manage) { p.remove(); return; }
    if (p) p.remove();
    if (!CURRENT) { if (manage) tst('Открой любой чат — там кнопка 🎭 стикеров'); return; }
    p = document.createElement('div'); p.id = 'stkPanel';
    Q('.input-bar').insertBefore(p, Q('.ib-inner'));
    if (manage) { stkTab = 'm'; stkManage = true; }
    await loadMyStickers(); p.innerHTML = stickersHTML();
    p.onclick = async e => {
      const t = e.target;
      if (t.closest('[data-manage]')) { e.preventDefault(); stkManage = !stkManage; p.innerHTML = stickersHTML(); return; }
      const tb = t.closest('.stk-tabs button'); if (tb) { stkTab = tb.dataset.t; p.innerHTML = stickersHTML(); return; }
      const del = t.closest('[data-del]');
      if (del) { await sb.from('user_stickers').delete().eq('id', del.dataset.del); await loadMyStickers(); p.innerHTML = stickersHTML(); return; }
      if (t.closest('[data-add]')) { Q('#stkFile').click(); return; }
      const st = t.closest('.st[data-s]'); if (st) { p.remove(); sendContent('[[sticker|' + st.dataset.s + ']]'); }
    };
  }
  function addStickerInput() {
    if (Q('#stkFile')) return;
    const f = document.createElement('input'); f.type = 'file'; f.id = 'stkFile'; f.accept = 'image/*'; f.className = 'hidden'; document.body.appendChild(f);
    f.onchange = async () => {
      const file = f.files[0]; f.value = ''; if (!file) return;
      try {
        tst('Загружаем стикер…');
        const blob = await canvasBlob(file, 512);
        const path = `stickers/${ME.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
        const up = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/png' });
        if (up.error) throw up.error;
        const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        const { error } = await sb.from('user_stickers').insert({ user_id: ME.id, url });
        if (error) throw error;
        await loadMyStickers(); const p = Q('#stkPanel'); if (p) p.innerHTML = stickersHTML(); tst('Стикер добавлен ✔');
      } catch (e) { tst('Не получилось: ' + (e.message || 'ошибка'), 'red'); }
    };
    const btn = document.createElement('button'); btn.className = 'icon-btn'; btn.id = 'stkBtn'; btn.title = 'Стикеры'; btn.textContent = '🎭';
    btn.onclick = () => openStickers(false);
    const att = Q('#attachBtn'); if (att) att.before(btn);
  }

  /* ================= ОТПРАВКА ================= */
  async function sendContent(content, extra) {
    if (!CURRENT || restricted()) return false;
    const chat = CHATS.find(c => c.id === CURRENT);
    if (chat.type === 'direct' && BLOCKED.includes(otherOf(chat).id)) { tst('Сначала разблокируй пользователя'); return false; }
    const row = Object.assign({ chat_id: CURRENT, sender_id: IMPERSONATE_USER ? IMPERSONATE_USER.id : ME.id, content }, V3.sendExtra(), extra || {});
    const { data, error } = await sb.from('messages').insert(row).select().single();
    if (error) { tst('Ошибка: ' + ru(error.message), 'red'); return false; }
    V3.afterSend();
    if (!MSG_IDS.has(data.id)) { MSG_IDS.add(data.id); chat.lastMsg = data; appendMsg(data, chat); scrollBottom(); renderChatList(); }
    return true;
  }
  V3.sendExtra = () => (V3.reply ? { reply_to: V3.reply.id } : {});
  V3.afterSend = () => { V3.reply = null; renderBar(); };
  V3.trySendEdit = async text => {
    if (!V3.edit) return false;
    const id = V3.edit.id; V3.edit = null; renderBar();
    Q('#msgInput').value = ''; Q('#msgInput').style.height = 'auto';
    const { data, error } = await sb.from('messages').update({ content: text, edited_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) { tst('Не удалось изменить: ' + ru(error.message), 'red'); return true; }
    replaceMsg(data); tst('Изменено ✔'); return true;
  };

  /* ================= ПЛАШКА ОТВЕТА / ПРАВКИ ================= */
  function plain(m) {
    const c = String(m.content || '');
    if (/^\[\[sticker\|/.test(c)) return '🎭 Стикер';
    const md = parseMedia(c);
    if (md) return md.kind === 'image' ? '📷 Фото' : md.kind === 'video' ? '🎥 Видео' : md.kind === 'audio' ? '🎤 Голосовое' : '📄 ' + md.name + (md.cap ? ' — ' + md.cap : '');
    return c;
  }
  const nameOf = id => { const p = PROFILES[id] || {}; return p.display_name || p.username || '—'; };
  function renderBar() {
    let bar = Q('#v3Bar'); const ib = Q('.input-bar'); if (!ib) return;
    if (!V3.reply && !V3.edit) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'v3Bar'; ib.insertBefore(bar, Q('.ib-inner')); }
    const edit = !!V3.edit, m = edit ? V3.edit : V3.reply;
    bar.innerHTML = `<span class="vb-ico">${edit ? '✎' : '↩'}</span><div class="vb-t"><b>${edit ? 'Редактирование' : 'Ответ: ' + E(nameOf(m.sender_id))}</b><span>${E(plain(m)).slice(0, 120)}</span></div><button title="Отмена">✕</button>`;
    bar.querySelector('button').onclick = () => { if (V3.edit) { Q('#msgInput').value = ''; } V3.reply = null; V3.edit = null; renderBar(); };
  }
  function startReply(m) { V3.edit = null; V3.reply = m; renderBar(); Q('#msgInput').focus(); }
  function startEdit(m) { V3.reply = null; V3.edit = m; renderBar(); const i = Q('#msgInput'); i.value = m.content; i.focus(); i.style.height = 'auto'; i.style.height = Math.min(i.scrollHeight, 140) + 'px'; }

  /* ================= РЕНДЕР СООБЩЕНИЯ ================= */
  function quoteHTML(rid) {
    const o = CACHE[rid];
    return `<div class="rq" data-rq="${E(rid)}"><b>${o ? E(nameOf(o.sender_id)) : 'Сообщение'}</b><span>${o ? E(plain(o)).slice(0, 90) : 'удалено или старое'}</span></div>`;
  }
  function rxHTML(mid) {
    const list = REACT[mid] || []; if (!list.length) return '';
    const g = {}; list.forEach(r => { (g[r.emoji] = g[r.emoji] || []).push(r.user_id); });
    return Object.keys(g).map(e => `<button class="rxc ${g[e].includes(ME.id) ? 'mine' : ''}" data-rx="${E(e)}">${E(e)}${g[e].length > 1 ? '<em>' + g[e].length + '</em>' : ''}</button>`).join('');
  }
  const origMsgHTML = window.msgHTML;
  window.msgHTML = function (m, chat) {
    CACHE[m.id] = m;
    let h = origMsgHTML(m, chat);
    const c = String(m.content || '');
    const isStk = /^\[\[sticker\|([^\]]+)\]\]/.exec(c);
    let extra = '';
    if (m.fwd_from) extra += `<div class="fwd">↪ Переслано от <b>${E(m.fwd_from)}</b></div>`;
    if (m.reply_to) extra += quoteHTML(m.reply_to);
    const ni = h.indexOf('class="m-name"');
    if (extra && ni > -1) { const i = h.indexOf('</div>', ni) + 6; h = h.slice(0, i) + extra + h.slice(i); }
    if (isStk) {
      h = h.replace('class="msg ', 'class="msg stk ').replace(/<div class="m-text">[\s\S]*?<\/div>/, `<img class="stk-img" src="${E(stkSrc(isStk[1]))}" alt="стикер" draggable="false">`);
    }
    h = h.replace('<div class="m-time">', `<div class="rx" data-rxbox="${E(m.id)}">${rxHTML(m.id)}</div><div class="m-time">${m.edited_at ? '<span class="edt">изм.</span>' : ''}`);
    h = h.replace(/(<div class="msg[^"]*"[^>]*>)/, '$1<span class="sw-ico">↩</span>');
    return h;
  };
  const origPrev = window.previewOf;
  window.previewOf = function (lm, chat) {
    if (lm && /^\[\[sticker\|/.test(lm.content || '')) return origPrev(Object.assign({}, lm, { content: '🎭 Стикер' }), chat);
    return origPrev(lm, chat);
  };
  function replaceMsg(m) {
    const el = Q(`.msg[data-id="${m.id}"]`); const chat = CHATS.find(c => c.id === m.chat_id); if (!el || !chat) return;
    const w = document.createElement('div'); w.innerHTML = window.msgHTML(m, chat); el.replaceWith(w.firstElementChild);
  }
  function refreshRx(mid) { const box = Q(`[data-rxbox="${mid}"]`); if (box) box.innerHTML = rxHTML(mid); }

  /* ================= РЕАКЦИИ ================= */
  async function loadReactions(chatId) {
    const { data } = await sb.from('message_reactions').select('message_id,user_id,emoji').eq('chat_id', chatId).limit(2000);
    Object.keys(REACT).forEach(k => delete REACT[k]);
    (data || []).forEach(r => (REACT[r.message_id] = REACT[r.message_id] || []).push(r));
    QA('[data-rxbox]').forEach(b => { b.innerHTML = rxHTML(b.dataset.rxbox); });
  }
  async function toggleReact(mid, emoji) {
    const list = REACT[mid] = REACT[mid] || [];
    const mine = list.findIndex(r => r.user_id === ME.id && r.emoji === emoji);
    if (mine > -1) { list.splice(mine, 1); refreshRx(mid); await sb.from('message_reactions').delete().eq('message_id', mid).eq('user_id', ME.id).eq('emoji', emoji); }
    else {
      // одна реакция на сообщение от человека — как в мессенджерах
      const prev = list.filter(r => r.user_id === ME.id).map(r => r.emoji);
      REACT[mid] = list.filter(r => r.user_id !== ME.id); REACT[mid].push({ message_id: mid, user_id: ME.id, emoji }); refreshRx(mid);
      if (prev.length) await sb.from('message_reactions').delete().eq('message_id', mid).eq('user_id', ME.id);
      const { error } = await sb.from('message_reactions').insert({ message_id: mid, chat_id: CURRENT, user_id: ME.id, emoji });
      if (error) tst('Реакция не отправилась', 'red');
      vib(10);
    }
  }

  /* ================= МЕНЮ СООБЩЕНИЯ ================= */
  function closeMenu() { const o = Q('.ms-ov'); if (o) o.remove(); }
  function openMenu(mid) {
    const m = CACHE[mid]; if (!m) return; closeMenu(); vib(15);
    const own = m.sender_id === ME.id, c = String(m.content || '');
    const isStk = /^\[\[sticker\|([^\]]+)\]\]/.exec(c), md = parseMedia(c);
    const mineE = (REACT[mid] || []).filter(r => r.user_id === ME.id).map(r => r.emoji);
    const ov = document.createElement('div'); ov.className = 'ms-ov';
    const acts = [['reply', '↩', 'Ответить']];
    if (!isStk && !md) acts.push(['copy', '⧉', 'Копировать']);
    acts.push(['fwd', '➦', 'Переслать']);
    if (isStk && !isStk[1].startsWith('b:') && !MYSTK.some(s => s.url === isStk[1])) acts.push(['savestk', '🎭', 'Добавить в мои стикеры']);
    if (own && !isStk && !md) acts.push(['edit', '✎', 'Изменить']);
    if (own || ME.is_admin) acts.push(['del', '🗑', 'Удалить', 1]);
    ov.innerHTML = `<div class="ms-card"><div class="ms-rx">${CUST.rx.slice(0, 6).map(e => `<button data-e="${E(e)}" class="${mineE.includes(e) ? 'on' : ''}">${E(e)}</button>`).join('')}<button data-more style="font-size:20px;color:var(--mut)">＋</button></div><div class="ms-list">${acts.map(a => `<button class="ms-act ${a[3] ? 'danger' : ''}" data-a="${a[0]}"><i>${a[1]}</i>${a[2]}</button>`).join('')}</div></div>`;
    document.body.appendChild(ov);
    ov.onclick = async e => {
      if (e.target === ov) return closeMenu();
      const r = e.target.closest('[data-e]');
      if (r) { closeMenu(); toggleReact(mid, r.dataset.e); return; }
      if (e.target.closest('[data-more]')) {
        Q('.ms-card', ov).innerHTML = `<div class="ms-emo">${EMOJI.map(x => `<button data-e="${E(x)}">${E(x)}</button>`).join('')}</div>`; return;
      }
      const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; closeMenu();
      if (k === 'reply') startReply(m);
      else if (k === 'copy') { try { await navigator.clipboard.writeText(c); tst('Скопировано ✔'); } catch (er) { tst('Не удалось скопировать', 'red'); } }
      else if (k === 'edit') startEdit(m);
      else if (k === 'fwd') openForward(m);
      else if (k === 'savestk') { const { error } = await sb.from('user_stickers').insert({ user_id: ME.id, url: isStk[1] }); if (!error) { await loadMyStickers(); tst('Стикер сохранён ✔'); } else tst('Не вышло', 'red'); }
      else if (k === 'del') {
        if (!await confirmBox('Удалить сообщение?', 'Оно пропадёт у всех участников чата.')) return;
        const { error } = await sb.from('messages').delete().eq('id', mid);
        if (error) return tst('Ошибка: ' + ru(error.message), 'red');
        Q(`.msg[data-id="${mid}"]`)?.remove(); tst('Удалено');
      }
    };
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); const f = Q('.fw-ov'); if (f) f.remove(); const s = Q('#stkPanel'); if (s) s.remove(); } });

  /* ================= ПЕРЕСЫЛКА ================= */
  function openForward(m) {
    const ov = document.createElement('div'); ov.className = 'overlay open fw-ov'; ov.style.zIndex = 650;
    const sel = new Set();
    ov.innerHTML = `<div class="modal"><div class="m-head"><div class="m-title">➦ Переслать в…</div><button class="icon-btn x" data-x>✕</button></div><div class="pick-list">${CHATS.map(c => `<div class="pick-row" data-c="${c.id}">${c.type === 'group' ? `<div class="ava s ini" style="background:var(--p3)">👥</div>` : avatarHTML(otherOf(c), 's')}<div style="flex:1;min-width:0"><div class="pick-name">${E(titleOf(c))}</div></div><span class="pk" style="font-size:20px"></span></div>`).join('')}</div><button class="btn primary" id="fwGo" style="width:100%;margin-top:14px" disabled>Отправить</button></div>`;
    document.body.appendChild(ov);
    ov.onclick = async e => {
      if (e.target === ov || e.target.closest('[data-x]')) return ov.remove();
      const r = e.target.closest('.pick-row');
      if (r) { const id = r.dataset.c; if (sel.has(id)) { sel.delete(id); r.querySelector('.pk').textContent = ''; } else { sel.add(id); r.querySelector('.pk').textContent = '✅'; } Q('#fwGo', ov).disabled = !sel.size; return; }
      if (e.target.closest('#fwGo')) {
        if (restricted()) return;
        const from = m.fwd_from || nameOf(m.sender_id); let n = 0;
        for (const cid of sel) {
          const { data, error } = await sb.from('messages').insert({ chat_id: cid, sender_id: ME.id, content: m.content, fwd_from: from }).select().single();
          if (!error) { n++; const chat = CHATS.find(c => c.id === cid); if (chat && !MSG_IDS.has(data.id)) { MSG_IDS.add(data.id); chat.lastMsg = data; if (CURRENT === cid) { appendMsg(data, chat); scrollBottom(); } } }
        }
        ov.remove(); renderChatList(); tst(n ? 'Переслано ✔' : 'Не удалось переслать', n ? '' : 'red');
      }
    };
  }

  /* ================= ЖЕСТЫ: свайп-ответ и долгое нажатие ================= */
  function initGestures() {
    const box = Q('#messages'); if (!box || box.dataset.v3) return; box.dataset.v3 = 1;
    let g = null;
    const skip = t => t.closest('a,button,audio,video,input,textarea,.rxc,.rq');
    box.addEventListener('pointerdown', e => {
      const row = e.target.closest('.msg'); if (!row || e.button > 0) return;
      if (e.target.closest('.rxc,.rq')) return;
      g = { row, id: row.dataset.id, x: e.clientX, y: e.clientY, mode: null, long: false, touch: e.pointerType !== 'mouse' };
      g.timer = setTimeout(() => { if (g && !g.mode) { g.long = true; openMenu(g.id); } }, 480);
    });
    box.addEventListener('pointermove', e => {
      if (!g) return; const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.mode) {
        if (Math.abs(dx) > 9 || Math.abs(dy) > 9) {
          clearTimeout(g.timer);
          g.mode = (g.touch && dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.3) ? 'swipe' : 'none';
          if (g.mode === 'swipe') g.row.classList.add('dragging');
        } else return;
      }
      if (g.mode === 'swipe') {
        const d = Math.max(dx, -110); const pull = Math.max(0, -d);
        g.row.style.transform = `translateX(${-Math.min(pull, 110) * 0.85}px)`;
        const on = pull > 62; if (on !== g.on) { g.on = on; g.row.classList.toggle('sw-on', on); if (on) vib(12); }
      }
    });
    const end = () => {
      if (!g) return; clearTimeout(g.timer);
      if (g.mode === 'swipe') { g.row.classList.remove('dragging'); g.row.style.transform = ''; g.row.classList.remove('sw-on'); if (g.on && CACHE[g.id]) startReply(CACHE[g.id]); }
      g = null;
    };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    box.addEventListener('contextmenu', e => { const row = e.target.closest('.msg'); if (!row) return; e.preventDefault(); openMenu(row.dataset.id); });
    box.addEventListener('dblclick', e => { const row = e.target.closest('.msg'); if (row && !skip(e.target) && CACHE[row.dataset.id]) startReply(CACHE[row.dataset.id]); });
    box.addEventListener('click', e => {
      const rc = e.target.closest('.rxc');
      if (rc) { const row = rc.closest('.msg'); toggleReact(row.dataset.id, rc.dataset.rx); return; }
      const rq = e.target.closest('.rq');
      if (rq) { const t = Q(`.msg[data-id="${rq.dataset.rq}"]`); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1300); } else tst('Это сообщение ушло далеко вверх'); }
    });
  }

  /* ================= ВКЛАДКА «ЗВОНКИ» ================= */
  let callsFilter = 'all', callsData = [], tabNow = 'chats';
  const seenKey = () => 'golda_calls_seen_' + (ME ? ME.id : '');
  const fmtDur = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function callInfo(c) {
    const out = c.caller_id === ME.id; let st = c.status;
    if (st === 'ringing' && Date.now() - Date.parse(c.created_at) > 70000) st = 'missed';
    const dur = (c.answered_at && c.ended_at) ? fmtDur((Date.parse(c.ended_at) - Date.parse(c.answered_at)) / 1000) : '';
    let txt, miss = false;
    if (out) txt = st === 'missed' || st === 'ringing' ? 'Нет ответа' : st === 'declined' ? 'Отклонён' : 'Исходящий' + (dur ? ' · ' + dur : '');
    else { if (st === 'missed' || st === 'ringing') { txt = 'Пропущенный'; miss = true; } else if (st === 'declined') txt = 'Отклонён'; else txt = 'Входящий' + (dur ? ' · ' + dur : ''); }
    return { out, txt, miss };
  }
  function fmtCallTime(iso) { const d = new Date(iso); const n = new Date(); return d.toDateString() === n.toDateString() ? fmtHM(iso) : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + fmtHM(iso); }
  async function loadCalls() {
    if (!ME || !CHATS.length) { callsData = []; renderCalls(); return; }
    const { data } = await sb.from('calls').select('id,chat_id,caller_id,kind,status,created_at,answered_at,ended_at').in('chat_id', CHATS.map(c => c.id)).order('created_at', { ascending: false }).limit(150);
    callsData = data || []; renderCalls(); updateCallBadge();
  }
  function updateCallBadge() {
    const seen = +LS.get(seenKey(), 0); const b = Q('.stab-badge');
    const n = callsData.filter(c => c.caller_id !== ME.id && callInfo(c).miss && Date.parse(c.created_at) > seen).length;
    if (b) { b.textContent = n; b.classList.toggle('hidden', !n || tabNow === 'calls'); }
  }
  function renderCalls() {
    const box = Q('#callsList'); if (!box) return;
    let rows = callsData; if (callsFilter === 'miss') rows = rows.filter(c => callInfo(c).miss);
    const f = `<div class="cl-filter"><button data-f="all" class="${callsFilter === 'all' ? 'on' : ''}">Все</button><button data-f="miss" class="${callsFilter === 'miss' ? 'on' : ''}">Пропущенные</button></div>`;
    if (!rows.length) { box.innerHTML = f + `<div class="cl-empty">📞<br>${callsFilter === 'miss' ? 'Пропущенных нет' : 'Звонков пока не было'}<br><small>Позвони из любого личного чата кнопкой в шапке</small></div>`; return; }
    box.innerHTML = f + rows.map(c => {
      const chat = CHATS.find(x => x.id === c.chat_id); if (!chat) return ''; const o = chat.type === 'direct' ? otherOf(chat) : null; const i = callInfo(c);
      return `<div class="cl-item" data-chat="${c.chat_id}">${o ? avatarHTML(o, 'm') : '<div class="ava m ini" style="background:var(--p3)">👥</div>'}<div class="cl-main"><div class="cl-name ${i.miss ? 'miss' : ''}">${E(titleOf(chat))}</div><div class="cl-sub"><span class="${i.miss ? 'miss' : ''}">${i.miss ? '↙' : i.out ? '↗' : '↙'}</span><span class="${i.miss ? 'miss' : ''}">${i.txt}</span><span>· ${c.kind === 'video' ? '🎥' : '📞'} ${fmtCallTime(c.created_at)}</span></div></div><div class="cl-btns"><button data-k="audio" title="Позвонить">📞</button><button data-k="video" title="Видеозвонок">🎥</button></div></div>`;
    }).join('');
  }
  function setTab(t) {
    tabNow = t;
    QA('.stab').forEach(b => b.classList.toggle('on', b.dataset.st === t));
    const calls = t === 'calls';
    Q('#chatList').classList.toggle('hidden', calls); Q('.search').classList.toggle('hidden', calls); Q('#callsList').classList.toggle('hidden', !calls);
    if (calls) { loadCalls(); LS.set(seenKey(), Date.now()); const b = Q('.stab-badge'); if (b) b.classList.add('hidden'); }
  }
  function initTabs() {
    if (Q('.side-tabs')) return;
    const s = Q('.search'); if (!s) return;
    const tabs = document.createElement('div'); tabs.className = 'side-tabs';
    tabs.innerHTML = '<button class="stab on" data-st="chats">💬 Чаты</button><button class="stab" data-st="calls">📞 Звонки<span class="stab-badge hidden"></span></button>';
    s.before(tabs);
    const list = document.createElement('div'); list.className = 'chat-list hidden'; list.id = 'callsList'; Q('#chatList').after(list);
    tabs.onclick = e => { const b = e.target.closest('.stab'); if (b) setTab(b.dataset.st); };
    list.onclick = e => {
      const fb = e.target.closest('.cl-filter button'); if (fb) { callsFilter = fb.dataset.f; renderCalls(); return; }
      const it = e.target.closest('.cl-item'); if (!it) return;
      const kind = e.target.closest('[data-k]')?.dataset.k;
      setTab('chats');
      openChat(it.dataset.chat);
      if (kind) { let n = 0; const t = setInterval(() => { const b = Q(kind === 'video' ? '#callVideoBtn' : '#callAudioBtn'); if (b && CURRENT === it.dataset.chat) { clearInterval(t); b.click(); } else if (++n > 20) clearInterval(t); }, 150); }
    };
    sb.channel('golda-v3-calls').on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => { clearTimeout(loadCalls._t); loadCalls._t = setTimeout(loadCalls, 500); }).subscribe();
    loadCalls();
  }

  /* ================= РЕАЛТАЙМ: правки и реакции ================= */
  function initRealtime() {
    sb.channel('golda-v3').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, e => {
      const m = e.new; if (!m || !MSG_IDS.has(m.id)) return; CACHE[m.id] = Object.assign(CACHE[m.id] || {}, m); replaceMsg(CACHE[m.id]);
    }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, e => {
      const r = e.new; if (r.user_id === ME.id) return; const l = REACT[r.message_id] = (REACT[r.message_id] || []).filter(x => x.user_id !== r.user_id || x.emoji === r.emoji);
      if (!l.some(x => x.user_id === r.user_id && x.emoji === r.emoji)) l.push(r); refreshRx(r.message_id);
    }).on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, e => {
      const r = e.old; if (!r || r.user_id === ME.id) return; const l = REACT[r.message_id]; if (!l) return;
      REACT[r.message_id] = l.filter(x => !(x.user_id === r.user_id && (!r.emoji || x.emoji === r.emoji))); refreshRx(r.message_id);
    }).subscribe();
  }

  /* ================= ЗАПУСК ================= */
  const origOpen = window.openChat;
  window.openChat = async function (id) {
    V3.reply = null; V3.edit = null; renderBar(); const p = Q('#stkPanel'); if (p) p.remove();
    await origOpen(id);
    initGestures();
    loadReactions(id);
  };

  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.theme-opt') && CUST.accent) { CUST.accent = ''; saveCust(); applyCust(); QA('#czAcc button').forEach(x => x.classList.remove('on')); } }, true);
  applyCust();
  injectSettings();
  addStickerInput();
  let booted = false;
  function boot() {
    if (booted || typeof ME === 'undefined' || !ME || !Q('#app') || Q('#app').classList.contains('hidden')) return;
    booted = true; initTabs(); initRealtime(); loadMyStickers(); initGestures();
  }
  setInterval(boot, 800);
})();
