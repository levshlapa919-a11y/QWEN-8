/* Material-слой: тональные цвета от акцента, нижняя навигация, формы */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s);
  const LS = { g(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } } };
  const G = f => { try { return f(); } catch (e) { return undefined; } };

  function hue(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 190;
    const n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 200;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return Math.round((h * 60 + 360) % 360);
  }
  function apply() {
    const body = document.body; if (!body) return;
    const h = hue(LS.g('golda_ac', '#1aa6a0')), dark = body.getAttribute('data-theme') !== 'light', st = body.style;
    const set = (k, v) => st.setProperty(k, v);
    set('--h', h);
    if (dark) {
      set('--bg', `hsl(${h} 52% 15%)`); set('--p1', `hsl(${h} 48% 19%)`); set('--p2', `hsl(${h} 46% 25%)`); set('--p3', `hsl(${h} 42% 31%)`);
      set('--oth', `hsl(${h} 42% 24%)`); set('--oth-tx', `hsl(${h} 30% 96%)`); set('--own', `hsl(${h} 55% 72%)`); set('--own-tx', `hsl(${h} 70% 10%)`);
      set('--tx', `hsl(${h} 25% 96%)`); set('--mut', `hsl(${h} 25% 74%)`); set('--mut2', `hsl(${h} 18% 58%)`);
      set('--ac', `hsl(${h} 62% 74%)`); set('--on-ac', `hsl(${h} 70% 10%)`);
      set('--pc', `hsl(${h} 45% 34%)`); set('--on-pc', `hsl(${h} 60% 90%)`); set('--nav', `hsl(${h} 55% 8%)`);
      set('--wg1', `hsl(${h} 45% 9%)`); set('--wg2', `hsl(${h} 42% 7%)`); set('--wg3', `hsl(${h} 45% 9%)`);
    } else {
      set('--bg', `hsl(${h} 40% 94%)`); set('--p1', `hsl(${h} 38% 98%)`); set('--p2', `hsl(${h} 40% 89%)`); set('--p3', `hsl(${h} 38% 83%)`);
      set('--oth', `hsl(${h} 40% 99%)`); set('--oth-tx', `hsl(${h} 30% 10%)`); set('--own', `hsl(${h} 55% 78%)`); set('--own-tx', `hsl(${h} 70% 10%)`);
      set('--tx', `hsl(${h} 30% 10%)`); set('--mut', `hsl(${h} 15% 36%)`); set('--mut2', `hsl(${h} 10% 52%)`);
      set('--ac', `hsl(${h} 70% 34%)`); set('--on-ac', '#fff');
      set('--pc', `hsl(${h} 55% 78%)`); set('--on-pc', `hsl(${h} 70% 12%)`); set('--nav', `hsl(${h} 40% 86%)`);
      set('--wg1', `hsl(${h} 45% 86%)`); set('--wg2', `hsl(${h} 38% 90%)`); set('--wg3', `hsl(${h} 42% 87%)`);
    }
    body.classList.toggle('m3-compact', LS.g('golda_compact', '0') === '1');
    body.dataset.av = LS.g('golda_av', 'flower');
  }
  window.GoldaM3 = { apply };
  document.addEventListener('click', e => {
    const b = e.target.closest('#clSet .avb'); if (!b) return;
    try { localStorage.setItem('golda_av', b.dataset.av); } catch (er) { }
    document.querySelectorAll('#clSet .avb').forEach(x => x.classList.toggle('on', x === b)); apply();
  });

  // лепесток для аватаров-цветков
  (function () { const p = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, r = 46 + 4 * Math.cos(a * 8); p.push((50 + r * Math.cos(a)).toFixed(1) + '% ' + (50 + r * Math.sin(a)).toFixed(1) + '%'); } document.documentElement.style.setProperty('--flower', 'polygon(' + p.join(',') + ')'); })();

  const ICONS = {
    chats: '<path d="M12 3C6.500 3 2.500 6.700 2.500 11.300c0 2.300 1 4.300 2.700 5.800-.2 1.300-.8 2.400-1.700 3.300 1.800 0 3.300-.6 4.500-1.500 1.200.4 2.500.6 4 .6 5.500 0 9.500-3.700 9.500-8.200S17.500 3 12 3z"/>',
    users: '<circle cx="9" cy="8" r="3.600"/><path d="M2 20c0-3.600 3-6 7-6s7 2.400 7 6z"/><circle cx="17" cy="9" r="2.800"/><path d="M17 13.500c3 0 5 1.800 5 4.500v2h-4.500"/>',
    user: '<circle cx="12" cy="8" r="4.400"/><path d="M3.500 21c0-4.400 3.800-7 8.500-7s8.500 2.600 8.500 7z"/>',
    set: '<path d="M12 1.800l8.600 5v10.400l-8.600 5-8.600-5V6.800z"/><circle cx="12" cy="12" r="3" fill="var(--nav)"/>',
    search: '<circle cx="10.500" cy="10.500" r="6.500" fill="none" stroke="currentColor" stroke-width="2.800"/><path d="M15.500 15.500L21 21" stroke="currentColor" stroke-width="2.800" stroke-linecap="round"/>'
  };
  function nav() {
    if (Q('#m3Nav')) return;
    const n = document.createElement('nav'); n.id = 'm3Nav';
    const items = [['chats', 'Чаты'], ['users', 'Контакты'], ['user', 'Профиль'], ['set', 'Настройки']];
    n.innerHTML = '<div class="np">' + items.map((x, i) => '<button data-k="' + x[0] + '" class="' + (i ? '' : 'on') + '"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">' + ICONS[x[0]] + '</svg><span>' + x[1] + '</span></button>').join('') + '</div><button class="ns" data-k="search" aria-label="Поиск"><svg width="28" height="28" viewBox="0 0 24 24">' + ICONS.search + '</svg></button>';
    document.body.appendChild(n);
    const setOn = k => n.querySelectorAll('.np button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    n.onclick = e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === 'chats') { setOn('chats'); G(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'))); G(() => GoldaSettings.close()); if (G(() => CURRENT)) G(() => closeChat()); const l = Q('#chatList'); l && l.scrollTo && l.scrollTo({ top: 0, behavior: 'smooth' }); }
      else if (k === 'users') { setOn('users'); G(() => openNewChatModal()); }
      else if (k === 'user') { setOn('user'); G(() => openMyProfile()); }
      else if (k === 'set') { setOn('set'); G(() => GoldaSettings.open()); }
      else if (k === 'search') { setOn('chats'); G(() => GoldaSettings.close()); const si = Q('#searchInput'); si && (si.scrollIntoView({ block: 'center' }), si.focus()); }
    };
    setInterval(() => { if (!G(() => document.querySelector('.overlay.open')) && !Q('#clSet.open')) setOn('chats'); }, 800);
  }
  function vis() { const n = Q('#m3Nav'); if (!n) return; const open = Q('.app.chat-open'); n.classList.toggle('off', !!open); document.body.classList.toggle('m3-nav', !open); }

  new MutationObserver(() => { nav(); vis(); }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  const t = setInterval(() => { if (document.body && Q('.app')) { apply(); nav(); vis(); } }, 600); setTimeout(() => clearInterval(t), 8000);
  apply();
})();
