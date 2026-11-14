/* live.js — «оживляющие» функции: закрепы, команды, конфетти, большие эмодзи, кнопка «вниз», ссылка на профиль */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const LS = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const ready = () => typeof ME !== 'undefined' && ME && typeof sb !== 'undefined';
  const svg = d => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  /* ---------- конфетти ---------- */
  function confetti(n) {
    if (LS.g('golda_motion', 'on') === 'off') return;
    const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:900';
    c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c); const x = c.getContext('2d');
    const cols = ['#3390ec', '#2eb67d', '#f08c2b', '#e8478b', '#8e5cf0', '#ffd34d'];
    const ps = Array.from({ length: n || 110 }, () => ({ x: c.width / 2 + (Math.random() - .5) * 120, y: c.height * .62, vx: (Math.random() - .5) * 15, vy: -Math.random() * 17 - 6, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
    let t = 0;
    (function f() {
      x.clearRect(0, 0, c.width, c.height); t++;
      ps.forEach(p => { p.vy += .42; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - t / 130); x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
      if (t < 130) requestAnimationFrame(f); else c.remove();
    })();
  }
  /* ---------- звук отправки ---------- */
  let AC = null;
  function pop() {
    try {
      if (typeof PREFS !== 'undefined' && !PREFS.sound) return;
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(520, AC.currentTime); o.frequency.exponentialRampToValueAtTime(880, AC.currentTime + .08);
      g.gain.setValueAtTime(.0001, AC.currentTime); g.gain.exponentialRampToValueAtTime(.08, AC.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .14);
      o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + .15);
    } catch (e) { }
  }

  /* ---------- команды в чате ---------- */
  const r = n => 1 + Math.floor(Math.random() * n);
  const BALL = ['Бесспорно', 'Скорее да', 'Пока не ясно, спроси позже', 'Лучше не рассчитывай', 'Определённо нет', 'Знаки говорят «да»', 'Сомнительно', 'Можешь быть уверен'];
  function cmd(v) {
    const m = v.trim().match(/^\/(\S+)\s*(.*)$/); if (!m) return null; const a = m[2];
    switch (m[1].toLowerCase()) {
      case 'dice': case 'кубик': return '🎲 Выпало ' + r(6);
      case 'coin': case 'монетка': return Math.random() < .5 ? '🪙 Орёл' : '🪙 Решка';
      case 'roll': { const n = Math.min(1e9, Math.max(2, parseInt(a) || 100)); return `🎯 Число от 1 до ${n}: ${r(n)}`; }
      case 'shrug': return '¯\\_(ツ)_/¯';
      case '8ball': case 'шар': return '🔮 ' + (a ? a + ' — ' : '') + BALL[r(BALL.length) - 1];
      case 'choose': case 'выбери': { const o = a.split(/[,|]| или /).map(s => s.trim()).filter(Boolean); return o.length > 1 ? '🤔 Выбираю: ' + o[r(o.length) - 1] : null; }
      case 'party': confetti(); return '🎉 ' + (a || 'Праздник!');
    }
    return null;
  }
  function transform() { const i = Q('#msgInput'); if (!i || i.value[0] !== '/') return; const t = cmd(i.value); if (t) { i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); } }
  document.addEventListener('keydown', e => { if (e.target.id === 'msgInput' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) transform(); }, true);
  document.addEventListener('click', e => { if (e.target.closest('#sendBtn')) { transform(); pop(); } }, true);
  document.addEventListener('keydown', e => { if (e.target.id === 'msgInput' && e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.value.trim()) pop(); }, true);

  /* ---------- большие эмодзи ---------- */
  const EMO_ONLY = /^(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*\s*){1,3}$/u;
  function bigEmoji(root) {
    QA('.msg .m-text:not([data-lv])', root).forEach(el => {
      el.dataset.lv = '1'; const t = el.textContent.trim();
      if (t && t.length <= 24 && EMO_ONLY.test(t) && !el.querySelector('*')) { const row = el.closest('.msg'); row.classList.add('emo-only'); }
      if (/[🎉🎊🥳]/u.test(t) && el.closest('.msg') && Date.now() - (+el.closest('.msg').dataset.lvT || Date.now()) < 5000 && !window.__lvBoot) confetti(70);
    });
  }
  /* ---------- закреплённые чаты ---------- */
  const pins = () => { try { return JSON.parse(LS.g('golda_pins', '[]')); } catch (e) { return []; } };
  let reordering = false;
  function applyPins() {
    const list = Q('#chatList'); if (!list) return; const p = pins();
    const items = QA('.chat-item', list);
    items.forEach(it => it.classList.toggle('lv-pin', p.includes(it.dataset.id)));
    const pinned = items.filter(it => p.includes(it.dataset.id)).sort((x, y) => p.indexOf(x.dataset.id) - p.indexOf(y.dataset.id));
    if (!pinned.length) return;
    const cur = QA('.chat-item', list).slice(0, pinned.length);
    if (cur.every((it, i) => it === pinned[i])) return;
    for (let i = pinned.length - 1; i >= 0; i--) list.insertBefore(pinned[i], list.firstChild);
  }
  function decorateMenu() {
    const m = Q('#chatMenu'); if (!m || !m.children.length || Q('[data-lv="pin"]', m) || typeof CURRENT === 'undefined' || !CURRENT) return;
    const b = document.createElement('button'); b.className = 'menu-i'; b.dataset.lv = 'pin';
    const on = pins().includes(CURRENT);
    b.innerHTML = `<span class="cl-i">${svg('<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>')}</span>${on ? 'Открепить чат' : 'Закрепить чат'}`;
    m.insertBefore(b, m.firstChild);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lv="pin"]'); if (!b) return; e.stopPropagation();
    let p = pins(); const id = CURRENT; if (p.includes(id)) p = p.filter(x => x !== id); else { if (p.length >= 5) { try { toast('Можно закрепить до 5 чатов', 'red'); } catch (er) { } return; } p.unshift(id); }
    LS.s('golda_pins', JSON.stringify(p)); const m = Q('#chatMenu'); m && m.classList.remove('open'); m && (m.innerHTML = ''); applyPins();
    try { renderChatHeader(); } catch (er) { }
  }, true);

  /* ---------- кнопка «вниз» ---------- */
  let unread = 0, btn = null;
  function mountDown() {
    const sc = Q('#msgScroll'); if (!sc || btn) return;
    btn = document.createElement('button'); btn.id = 'lvDown'; btn.type = 'button'; btn.innerHTML = svg('<path d="M6 9l6 6 6-6"/>') + '<b></b>'; document.body.appendChild(btn);
    const far = () => sc.scrollHeight - sc.scrollTop - sc.clientHeight > 320;
    const upd = () => {
      const ib = Q('.input-bar'); if (ib) document.documentElement.style.setProperty('--lv-ib', (ib.offsetHeight + 14) + 'px');
      const show = far() && !!Q('#chatView') && !Q('#chatView').classList.contains('hidden'); btn.classList.toggle('on', show); if (!show) unread = 0; btn.querySelector('b').textContent = unread || ''; btn.classList.toggle('has', unread > 0);
    };
    sc.addEventListener('scroll', upd, { passive: true });
    btn.onclick = () => { sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); unread = 0; };
    new MutationObserver(m => { m.forEach(x => x.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains('msg') && !n.classList.contains('own') && far()) unread++; })); upd(); }).observe(Q('#messages'), { childList: true });
    setInterval(upd, 800);
  }
  /* ---------- иконки в меню сообщения ---------- */
  const MI = { reply: '<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v3"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', fwd: '<path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0-6 6v3"/>', fav: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', savestk: '<path d="M20 12a8 8 0 1 1-8-8h1a7 7 0 0 0 7 7z"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>' };
  function dressMenu() {
    QA('.ms-list [data-a]:not([data-lvi])').forEach(b => {
      b.dataset.lvi = '1'; const k = b.dataset.a; if (!MI[k]) return; const f = b.firstElementChild || b.firstChild;
      const s = document.createElement('span'); s.className = 'cl-i'; s.innerHTML = svg(MI[k]);
      if (f && f.nodeType === 1 && f.textContent.trim().length <= 2) f.replaceWith(s); else if (f && f.nodeType === 3) { f.nodeValue = f.nodeValue.replace(/^\s*\S\s*/, ''); b.insertBefore(s, f); }
    });
  }
  /* ---------- ссылка на профиль ---------- */
  async function deepLink() {
    if (!ready()) return setTimeout(deepLink, 1000);
    const u = new URLSearchParams(location.search).get('u'); if (!u) return;
    history.replaceState(null, '', location.pathname);
    const r = await sb.from('profiles').select('*').eq('username', u.toLowerCase()).maybeSingle();
    if (r.data && typeof openUserModal === 'function') openUserModal(r.data);
  }
  window.LIVE = { confetti, pop, shareProfile() {
    const url = location.origin + location.pathname.replace(/index\.html$/, '') + '?u=' + encodeURIComponent((ME.username || '').toLowerCase());
    if (navigator.share) { navigator.share({ title: 'YZITK Chats', text: 'Напиши мне в YZITK Chats', url }).catch(() => { }); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { try { toast('Ссылка скопирована'); } catch (e) { } }).catch(() => prompt('Ссылка на профиль', url));
  } };

  new MutationObserver(() => { clearTimeout(window.__lvT); window.__lvT = setTimeout(() => { bigEmoji(); applyPins(); decorateMenu(); dressMenu(); mountDown(); }, 80); }).observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { window.__lvBoot = false; }, 4000); window.__lvBoot = true;
  deepLink();
})();
