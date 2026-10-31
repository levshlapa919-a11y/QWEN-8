/* golda-mesenger: нижняя панель, форма аватаров, плавающие фигуры, тема «Бирюза» */
(function () {
  'use strict';
  const Q = s => document.querySelector(s), QA = s => Array.from(document.querySelectorAll(s));
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  let ST = { ava: '', fl: true, n: 14 }; try { ST = Object.assign(ST, JSON.parse(LS.get('golda_slim', '{}'))); } catch (e) { }
  const save = () => LS.set('golda_slim', JSON.stringify(ST));

  /* лепесток-«цветок» для clip-path */
  (function () { let p = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, r = 46 + 4 * Math.cos(a * 8); p.push((50 + r * Math.cos(a)).toFixed(1) + '% ' + (50 + r * Math.sin(a)).toFixed(1) + '%'); } document.documentElement.style.setProperty('--flower', 'polygon(' + p.join(',') + ')'); })();

  /* тема «Бирюза» */
  try {
    const row = Q('.theme-options');
    if (row && !row.querySelector('[data-t="teal"]')) { const b = document.createElement('button'); b.className = 'theme-opt'; b.dataset.t = 'teal'; b.textContent = '🌊 Бирюза'; b.onclick = () => applyTheme('teal'); row.insertBefore(b, row.firstChild.nextSibling); }
    if (typeof themeNames !== 'undefined') themeNames.teal = 'Бирюза';
    new MutationObserver(() => { const m = Q('#themeMeta'); if (m && document.body.dataset.theme === 'teal') m.setAttribute('content', '#123540'); }).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    if (document.body.dataset.theme === 'teal') applyTheme('teal');
  } catch (e) { }

  /* аватары и фигуры */
  function applyAva() { if (ST.ava) document.body.dataset.ava = ST.ava; else delete document.body.dataset.ava; }
  function rebuildShapes() {
    const box = Q('#appParticles'); if (!box) return;
    box.innerHTML = '';
    box.style.visibility = ST.fl ? 'visible' : 'hidden';
    for (let i = 0; i < ST.n; i++) {
      const e = document.createElement('i'), s = 8 + Math.random() * 26;
      e.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${(Math.random() * 60 - 30).toFixed(0)}px;animation-duration:${14 + Math.random() * 22}s;animation-delay:-${Math.random() * 30}s;opacity:${(.1 + Math.random() * .22).toFixed(2)}`;
      box.appendChild(e);
    }
  }
  const SHAPES = [['circle', 'border-radius:50%'], ['squircle', 'border-radius:34%'], ['flower', 'clip-path:var(--flower)'], ['hex', 'clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)'], ['arch', 'border-radius:50% 50% 14% 14%']];
  function injectSettings() {
    const ov = Q('#settingsOverlay'), cz = Q('#czSection'); if (!ov || !cz || Q('#slSec')) return false;
    const sec = document.createElement('div'); sec.className = 'settings-section sl-sec'; sec.id = 'slSec';
    sec.innerHTML = '<div class="settings-label">🔷 Форма и фигуры</div><div class="cz-lbl">Форма аватара</div><div class="sl-shapes" id="slShapes">' +
      SHAPES.map(s => `<button data-a="${s[0]}" class="${ST.ava === s[0] ? 'on' : ''}"><i style="${s[1]}"></i></button>`).join('') + '</div>' +
      '<div class="sl-tog"><div><b>Плавающие фигуры</b><small>Плывут по фону приложения</small></div><button class="sl-sw ' + (ST.fl ? 'on' : '') + '" id="slFl" type="button"></button></div>' +
      '<div class="cz-lbl">Сколько фигур</div><div class="sl-cnt" id="slCnt">' + [10, 14, 20, 30, 50].map(n => `<button data-n="${n}" class="${ST.n === n ? 'on' : ''}">${n}</button>`).join('') + '</div>';
    cz.before(sec);
    sec.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'), n = e.target.closest('[data-n]'), f = e.target.closest('#slFl');
      if (a) { ST.ava = ST.ava === a.dataset.a ? '' : a.dataset.a; QA('#slShapes button').forEach(b => b.classList.toggle('on', b.dataset.a === ST.ava)); applyAva(); }
      else if (n) { ST.n = +n.dataset.n; QA('#slCnt button').forEach(b => b.classList.toggle('on', +b.dataset.n === ST.n)); rebuildShapes(); }
      else if (f) { ST.fl = !ST.fl; f.classList.toggle('on', ST.fl); rebuildShapes(); }
      save();
    });
    // «Выйти» — в настройки (кнопка из нижней карточки)
    const lo = Q('#btnLogout'); if (lo && !lo.dataset.moved) { lo.dataset.moved = 1; lo.className = 'btn-out'; lo.innerHTML = '🚪 Выйти из аккаунта'; Q('.modal', ov).appendChild(lo); }
    return true;
  }

  /* нижняя панель */
  const ICO = {
    chats: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2.5 6.7 2.5 11.3c0 2.3 1 4.3 2.7 5.8-.2 1.3-.8 2.4-1.7 3.3 1.8 0 3.3-.6 4.5-1.5 1.2.4 2.5.6 4 .6 5.5 0 9.5-3.7 9.5-8.2S17.5 3 12 3z"/></svg>',
    users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.6"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6z"/><circle cx="17" cy="9" r="2.8"/><path d="M17 13.5c3 0 5 1.8 5 4.5v2h-4.5c.3-3-1-5.2-2.6-6.2.6-.2 1.3-.3 2.1-.3z"/></svg>',
    user: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.4"/><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7z"/></svg>',
    set: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.8l8.6 5v10.4l-8.6 5-8.6-5V6.8z"/><circle cx="12" cy="12" r="3" fill="var(--bg)"/></svg>',
    search: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>'
  };
  const nav = document.createElement('div'); nav.id = 'slimNav';
  nav.innerHTML = '<div class="pill"><button data-k="chats" class="on">' + ICO.chats + '<span>Чаты</span></button><button data-k="users">' + ICO.users + '<span>Контакты</span></button><button data-k="user">' + ICO.user + '<span>Профиль</span></button><button data-k="set">' + ICO.set + '<span>Настройки</span></button></div><button class="srch" data-k="search" aria-label="Поиск">' + ICO.search + '</button>';
  document.body.appendChild(nav);
  const setOn = k => QA('#slimNav .pill button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  nav.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'chats') { QA('.overlay.open').forEach(o => o.classList.remove('open')); const si = Q('#searchInput'); if (si) { si.value = ''; si.dispatchEvent(new Event('input')); } const l = Q('#chatList'); if (l) l.scrollTo({ top: 0, behavior: 'smooth' }); setOn('chats'); }
    else if (k === 'users') { setOn('users'); try { openNewChatModal(); } catch (er) { } }
    else if (k === 'user') { setOn('user'); try { openMyProfile(); } catch (er) { } }
    else if (k === 'set') { setOn('set'); const s = Q('#btnSettings'); s && s.click(); }
    else if (k === 'search') { setOn('chats'); QA('.overlay.open').forEach(o => o.classList.remove('open')); const si = Q('#searchInput'); si && (si.scrollIntoView({ block: 'center' }), si.focus()); }
  });
  function syncNav() {
    const app = Q('#app'); const on = app && !app.classList.contains('hidden') && !app.classList.contains('chat-open');
    document.body.classList.toggle('nav-on', !!on);
    if (!QA('.overlay.open').length) setOn('chats');
  }
  const mo = new MutationObserver(syncNav);
  mo.observe(Q('#app'), { attributes: true, attributeFilter: ['class'] });
  QA('.overlay').forEach(o => mo.observe(o, { attributes: true, attributeFilter: ['class'] }));
  syncNav();

  // кнопка админа — в верхние действия
  function moveAdmin() { const a = Q('#btnAdmin'), act = Q('.side-actions'); if (a && act && !a.dataset.moved) { a.dataset.moved = 1; act.insertBefore(a, act.firstChild); } }

  applyAva();
  const t = setInterval(() => { moveAdmin(); rebuildNeeded(); injectSettings(); }, 700);
  let built = false; function rebuildNeeded() { if (!built && Q('#appParticles')) { built = true; rebuildShapes(); } }
})();
