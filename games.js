/* Аркада: монетка, кости, колесо, камень-ножницы-бумага, слоты. Результат считает сервер (game_play). */
(function () {
  'use strict';
  const Q = s => document.querySelector(s);
  const ready = () => typeof ME !== 'undefined' && ME && typeof sb !== 'undefined';
  const fmt = v => { const s = String(v == null ? '0' : v).split('.')[0]; if (/^-?inf/i.test(s)) return '∞'; return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let M = null, bal = '0', bet = 100, busy = false;
  const GAMES = [
    { id: 'coin', ico: '🪙', name: 'Монетка', d: 'Орёл или решка · ×1.95' },
    { id: 'dice', ico: '🎲', name: 'Кости', d: 'Сам выбираешь шанс · до ×19' },
    { id: 'wheel', ico: '🎡', name: 'Колесо', d: 'Множители до ×4' },
    { id: 'rps', ico: '✊', name: 'Камень-ножницы-бумага', d: 'Победа ×1.9, ничья — возврат' },
    { id: 'slots', ico: '🎰', name: 'Слоты', d: 'Три одинаковых — ×18' },
  ];
  async function refBal() {
    try { const r = await sb.from('gold_wallets').select('balance_t').eq('user_id', ME.id).maybeSingle(); bal = (r.data && r.data.balance_t) || '0'; } catch (e) { }
    const e = Q('#gmBal'); if (e) e.textContent = fmt(bal);
  }
  function betBox() {
    return `<div class="gm-bet"><div class="gm-bal">🪙 <b id="gmBal">${fmt(bal)}</b></div>
      <div class="gm-betrow"><button class="gm-b" data-k="h">½</button><input id="gmBet" class="f2-in" inputmode="numeric" value="${bet}"><button class="gm-b" data-k="x">×2</button><button class="gm-b" data-k="m">MAX</button></div></div>`;
  }
  function betWire(root) {
    const inp = root.querySelector('#gmBet'); if (!inp) return;
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 13); bet = +inp.value || 0; };
    root.querySelectorAll('.gm-b').forEach(b => b.onclick = () => {
      let v = +inp.value || 1;
      if (b.dataset.k === 'h') v = Math.max(1, Math.floor(v / 2)); else if (b.dataset.k === 'x') v = v * 2;
      else { const n = Number(String(bal).split('.')[0]); v = isFinite(n) ? Math.min(Math.max(1, n), 1e12) : 1e6; }
      inp.value = bet = Math.floor(v);
    });
  }
  async function play(game, arg) {
    if (busy) return null; bet = +(Q('#gmBet') || {}).value || 0;
    if (bet < 1) { toastM('Введи ставку'); return null; }
    busy = true;
    const r = await sb.rpc('game_play', { p_game: game, p_bet: bet, p_arg: arg || null });
    if (r.error || !r.data) { busy = false; toastM('Ошибка, попробуй ещё раз'); return null; }
    if (!r.data.ok) { busy = false; toastM({ no_money: 'Не хватает gold', bet: 'Неверная ставка', arg: 'Неверный выбор' }[r.data.error] || 'Ошибка'); return null; }
    bal = r.data.balance; return r.data;
  }
  function toastM(t) { const e = Q('#gmMsg'); if (e) { e.textContent = t; e.className = 'gm-res bad'; } }
  function done(d) {
    busy = false; const e = Q('#gmBal'); if (e) e.textContent = fmt(bal);
    const m = Q('#gmMsg'); if (!m) return;
    if (d.win) { if (window.LIVE && Number(d.mult) >= 2) window.LIVE.confetti(90); m.className = 'gm-res win'; m.textContent = '🎉 Выигрыш +' + fmt(BigInt(d.payout) - BigInt(bet)) + ' (×' + d.mult + ')'; }
    else if (d.draw) { m.className = 'gm-res'; m.textContent = '🤝 Ничья, ставка возвращена'; }
    else { m.className = 'gm-res bad'; m.textContent = '💥 Проигрыш −' + fmt(bet); }
  }
  /* ---- экраны игр ---- */
  const V = {
    coin(root) {
      root.innerHTML = betBox() + `<div class="gm-stage"><div class="gm-coin" id="gmCoin"><i>🦅</i><i>👑</i></div></div>
        <div class="gm-two"><button class="f2-btn" data-s="heads">🦅 Орёл</button><button class="f2-btn" data-s="tails">👑 Решка</button></div><div id="gmMsg" class="gm-res"></div>`;
      betWire(root);
      root.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => {
        const c = Q('#gmCoin'); c.style.transition = 'none'; c.style.transform = 'rotateY(0)'; void c.offsetWidth;
        const d = await play('coin', b.dataset.s); if (!d) return;
        c.style.transition = 'transform 1.3s cubic-bezier(.2,.8,.2,1)';
        c.style.transform = 'rotateY(' + (1800 + (d.detail.side === 'tails' ? 180 : 0)) + 'deg)';
        await sleep(1350); done(d);
      });
    },
    dice(root) {
      let mode = 'u', tg = 50;
      root.innerHTML = betBox() + `<div class="gm-stage"><div class="gm-die" id="gmDie">?</div></div>
        <div class="gm-two"><button class="gm-chip on" data-m="u">Меньше</button><button class="gm-chip" data-m="o">Больше</button></div>
        <input type="range" id="gmTg" min="5" max="95" value="50"><div class="gm-info" id="gmInf"></div>
        <button class="f2-btn gm-go" id="gmGo">🎲 Бросить</button><div id="gmMsg" class="gm-res"></div>`;
      betWire(root);
      const upd = () => { const ch = mode === 'u' ? tg - 1 : 100 - tg; Q('#gmInf').textContent = (mode === 'u' ? 'Выпадет меньше ' : 'Выпадет больше ') + tg + ' · шанс ' + ch + '% · ×' + (97 / ch).toFixed(2); };
      upd(); Q('#gmTg').oninput = e => { tg = +e.target.value; upd(); };
      root.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; root.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
      Q('#gmGo').onclick = async () => {
        const d = await play('dice', mode + tg); if (!d) return; const el = Q('#gmDie'); el.className = 'gm-die roll';
        for (let i = 0; i < 12; i++) { el.textContent = 1 + Math.floor(Math.random() * 100); await sleep(60 + i * 12); }
        el.textContent = d.detail.roll; el.className = 'gm-die ' + (d.win ? 'w' : 'l'); done(d);
      };
    },
    wheel(root) {
      const segs = [0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 1, 1, 2, 3, 3, 4], n = segs.length;
      const col = x => x === 0 ? '#2a2f38' : x < 1 ? '#7a4b2a' : x === 1 ? '#3b6ea8' : x < 3 ? '#2f9d63' : x < 4 ? '#c8a02a' : '#c0392b';
      const grad = segs.map((x, i) => `${col(x)} ${i * 360 / n}deg ${(i + 1) * 360 / n}deg`).join(',');
      const labels = segs.map((x, i) => `<b style="transform:rotate(${(i + .5) * 360 / n}deg) translateY(-96px)">${x ? '×' + x : '✖'}</b>`).join('');
      root.innerHTML = betBox() + `<div class="gm-stage"><div class="gm-wheel-wrap"><div class="gm-ptr">▼</div><div class="gm-wheel" id="gmW" style="background:conic-gradient(${grad})">${labels}</div></div></div>
        <button class="f2-btn gm-go" id="gmGo">🎡 Крутить</button><div id="gmMsg" class="gm-res"></div>`;
      betWire(root); let rot = 0;
      Q('#gmGo').onclick = async () => {
        const d = await play('wheel'); if (!d) return; const w = Q('#gmW');
        const target = 360 - (d.detail.idx + .5) * 360 / n; rot += 360 * 5 + ((target - rot % 360) + 360) % 360;
        w.style.transition = 'transform 3.6s cubic-bezier(.15,.7,.1,1)'; w.style.transform = 'rotate(' + rot + 'deg)';
        await sleep(3700); done(d);
      };
    },
    rps(root) {
      const E = { rock: '✊', paper: '✋', scissors: '✌️' };
      root.innerHTML = betBox() + `<div class="gm-stage gm-vs"><div class="gm-hand" id="gmMe">❔</div><span>VS</span><div class="gm-hand" id="gmBot">❔</div></div>
        <div class="gm-two">${Object.keys(E).map(k => `<button class="f2-btn" data-k="${k}">${E[k]}</button>`).join('')}</div><div id="gmMsg" class="gm-res"></div>`;
      betWire(root);
      root.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
        const me = Q('#gmMe'), bt = Q('#gmBot'); me.textContent = E[b.dataset.k]; bt.textContent = '❔';
        const d = await play('rps', b.dataset.k); if (!d) return;
        bt.classList.add('shake'); await sleep(700); bt.classList.remove('shake'); bt.textContent = E[d.detail.bot]; done(d);
      });
    },
    slots(root) {
      const S = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
      root.innerHTML = betBox() + `<div class="gm-stage gm-slots"><div class="gm-reel" id="r0">🎰</div><div class="gm-reel" id="r1">🎰</div><div class="gm-reel" id="r2">🎰</div></div>
        <div class="gm-info">Три одинаковых ×18 · пара — возврат ставки</div><button class="f2-btn gm-go" id="gmGo">🎰 Крутить</button><div id="gmMsg" class="gm-res"></div>`;
      betWire(root);
      Q('#gmGo').onclick = async () => {
        const d = await play('slots'); if (!d) return; const rs = [0, 1, 2].map(i => Q('#r' + i));
        rs.forEach(r => r.classList.add('spin'));
        for (let i = 0; i < 3; i++) {
          const t = Date.now() + 600 + i * 450;
          while (Date.now() < t) { rs[i].textContent = S[Math.floor(Math.random() * 6)]; await sleep(70); }
          rs[i].textContent = d.detail.reels[i]; rs[i].classList.remove('spin');
        }
        done(d);
      };
    },
  };
  function hub() {
    if (!ready() || !window.F2) return;
    if (M) M.close();
    M = window.F2.modal('🎮 Игры', '<div id="gmBody"></div>', (ov) => { ov.classList.add('gm-ov'); });
    const body = M.ov.querySelector('#gmBody');
    const home = () => {
      busy = false;
      body.innerHTML = `<div class="gm-bal gm-top">🪙 Твой баланс: <b id="gmBal">${fmt(bal)}</b></div><div class="gm-grid">` +
        GAMES.map(g => `<button class="gm-tile" data-g="${g.id}"><span>${g.ico}</span><b>${g.name}</b><small>${g.d}</small></button>`).join('') + '</div>';
      body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => open(b.dataset.g));
      refBal();
    };
    const open = id => {
      const g = GAMES.find(x => x.id === id);
      body.innerHTML = `<button class="gm-back">← Все игры</button><div class="gm-title">${g.ico} ${g.name}</div><div id="gmGame"></div>`;
      body.querySelector('.gm-back').onclick = home; V[id](body.querySelector('#gmGame')); refBal();
    };
    home();
  }
  (function addBtn() {
    const a = Q('.side-actions'); if (!a) return setTimeout(addBtn, 800);
    if (Q('#btnGames')) return;
    const b = document.createElement('button'); b.className = 'icon-btn'; b.id = 'btnGames'; b.title = 'Игры'; b.textContent = '🎮'; b.style.fontSize = '16px';
    b.onclick = hub; a.insertBefore(b, a.firstChild);
  })();
  window.GAMES_HUB = hub;
})();
