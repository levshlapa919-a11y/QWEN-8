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
      set('--bg', `hsl(${h} 26% 8%)`); set('--p1', `hsl(${h} 22% 12%)`); set('--p2', `hsl(${h} 20% 16%)`); set('--p3', `hsl(${h} 18% 21%)`);
      set('--oth', `hsl(${h} 18% 19%)`); set('--oth-tx', `hsl(${h} 15% 95%)`); set('--own', `hsl(${h} 46% 29%)`); set('--own-tx', `hsl(${h} 40% 96%)`);
      set('--tx', `hsl(${h} 15% 94%)`); set('--mut', `hsl(${h} 10% 68%)`); set('--mut2', `hsl(${h} 8% 50%)`);
      set('--pc', `hsl(${h} 44% 28%)`); set('--on-pc', `hsl(${h} 70% 90%)`);
      set('--wg1', `hsl(${h} 42% 17%)`); set('--wg2', `hsl(${h} 38% 10%)`); set('--wg3', `hsl(${(h + 40) % 360} 34% 14%)`);
    } else {
      set('--bg', `hsl(${h} 30% 96%)`); set('--p1', `hsl(${h} 30% 99%)`); set('--p2', `hsl(${h} 26% 94%)`); set('--p3', `hsl(${h} 22% 89%)`);
      set('--oth', `hsl(${h} 30% 100%)`); set('--oth-tx', `hsl(${h} 25% 10%)`); set('--own', `hsl(${h} 60% 88%)`); set('--own-tx', `hsl(${h} 70% 12%)`);
      set('--tx', `hsl(${h} 25% 10%)`); set('--mut', `hsl(${h} 10% 38%)`); set('--mut2', `hsl(${h} 8% 55%)`);
      set('--pc', `hsl(${h} 62% 86%)`); set('--on-pc', `hsl(${h} 70% 14%)`);
      set('--wg1', `hsl(${h} 45% 88%)`); set('--wg2', `hsl(${h} 38% 92%)`); set('--wg3', `hsl(${(h + 40) % 360} 36% 90%)`);
    }
    body.classList.toggle('m3-compact', LS.g('golda_compact', '0') === '1');
    body.classList.toggle('m3-flower', LS.g('golda_flower', '0') === '1');
  }
  window.GoldaM3 = { apply };

  // лепесток для аватаров-цветков
  (function () { const p = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, r = 46 + 4 * Math.cos(a * 8); p.push((50 + r * Math.cos(a)).toFixed(1) + '% ' + (50 + r * Math.sin(a)).toFixed(1) + '%'); } document.documentElement.style.setProperty('--flower', 'polygon(' + p.join(',') + ')'); })();

  const ICONS = {
    chats: '<path d="M4 5.5A2.5 2.5 0 016.500 3h11A2.500 2.500 0 0120 5.500v8a2.500 2.500 0 01-2.500 2.500H10l-4.500 4v-4A2.500 2.500 0 014 13.500z"/>',
    games: '<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 10.500v4M6 12.500h4"/><circle cx="15.500" cy="11.500" r=".8"/><circle cx="17.500" cy="13.500" r=".8"/>',
    feed: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.200l2-1.500-2-3.400-2.300.9a7 7 0 00-2-1.200L14.300 3h-4l-.4 2.600a7 7 0 00-2 1.200l-2.300-.9-2 3.400 2 1.500a7 7 0 000 2.400l-2 1.500 2 3.400 2.300-.9a7 7 0 002 1.200l.4 2.600h4l.4-2.600a7 7 0 002-1.200l2.300.9 2-3.400-2-1.500c.1-.4.1-.8.1-1.200z"/>'
  };
  function nav() {
    if (Q('#m3Nav')) return;
    const n = document.createElement('nav'); n.id = 'm3Nav';
    const items = [['chats', 'Чаты'], ['feed', 'Лента'], ['games', 'Игры'], ['set', 'Настройки']];
    n.innerHTML = items.map((x, i) => '<button data-k="' + x[0] + '" class="' + (i ? '' : 'on') + '"><span class="pill"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[x[0]] + '</svg></span><small>' + x[1] + '</small></button>').join('');
    document.body.appendChild(n);
    n.onclick = e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === 'chats') { if (G(() => CURRENT)) G(() => closeChat()); const l = Q('#chatList'); l && l.scrollTo && l.scrollTo({ top: 0, behavior: 'smooth' }); }
      else if (k === 'feed') { const c = G(() => CHATS.find(x => x.type === 'group' && x.name === 'Golda Лента')); if (c) openChat(c.id); }
      else if (k === 'games') { G(() => GAMES_HUB()); }
      else if (k === 'set') { G(() => GoldaSettings.open()); }
    };
  }
  function vis() { const n = Q('#m3Nav'); if (!n) return; const open = Q('.app.chat-open'); n.classList.toggle('off', !!open); document.body.classList.toggle('m3-nav', !open); }

  new MutationObserver(() => { nav(); vis(); }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  const t = setInterval(() => { if (document.body && Q('.app')) { apply(); nav(); vis(); } }, 600); setTimeout(() => clearInterval(t), 8000);
  apply();
})();
