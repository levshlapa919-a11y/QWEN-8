/* Аркада: 2048, Змейка, Скорость. Рекорды хранит сервер (score_submit). */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const NAMES = { g2048: '2048', snake: 'Змейка', tap: 'Скорость' };

  function swipe(el, cb) {
    let x0, y0, t0;
    el.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
    el.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend', e => {
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });
  }
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };

  async function finish(root, game, score, secs, again) {
    let rec = false, best = score;
    try { const r = await sb.rpc('score_submit', { p_game: game, p_score: score, p_secs: Math.round(secs) }); if (r.data && r.data.ok) { rec = r.data.record; best = r.data.best; } } catch (e) { }
    const o = document.createElement('div'); o.className = 'ar-end';
    o.innerHTML = '<div class="ar-card"><div class="ar-big">' + score + '</div><div class="ar-lbl">' + (rec ? 'Новый рекорд' : 'Твой рекорд: ' + best) + '</div><button class="ar-b ar-p" data-a="again">Ещё раз</button><button class="ar-b" data-a="top">Таблица рекордов</button><button class="ar-b" data-a="ch">Бросить вызов в чат</button></div>';
    root.appendChild(o);
    o.onclick = async e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'again') { o.remove(); again(); }
      else if (a === 'top') top(root, game);
      else if (a === 'ch') {
        let cid = null; try { cid = CURRENT || (CHATS.find(c => c.type === 'group' && c.name === 'Golda Лента') || {}).id; } catch (er) { }
        if (!cid) return tst('Открой чат, куда отправить', 'red');
        const { error } = await sb.from('messages').insert({ chat_id: cid, sender_id: ME.id, content: '**' + NAMES[game] + '**: мой результат ' + score + '. Побьёшь? Игры → ' + NAMES[game] });
        tst(error ? 'Не отправилось' : 'Вызов отправлен', error ? 'red' : '');
      }
    };
  }
  async function top(root, game) {
    const o = document.createElement('div'); o.className = 'ar-end ar-top';
    o.innerHTML = '<div class="ar-card"><div class="ar-lbl">Рекорды · ' + NAMES[game] + '</div><div class="ar-list">Загрузка…</div><button class="ar-b" data-a="x">Закрыть</button></div>';
    root.appendChild(o); o.onclick = e => { if (e.target.closest('[data-a=x]') || e.target === o) o.remove(); };
    try {
      const r = await sb.rpc('scores_top', { p_game: game });
      Q('.ar-list', o).innerHTML = (r.data || []).map((x, i) => '<div class="ar-row' + (x.user_id === ME.id ? ' me' : '') + '"><i>' + (i + 1) + '</i><span>' + esc(x.name) + '</span><b>' + x.best + '</b></div>').join('') || '<div class="ar-empty">Пока никого. Будь первым.</div>';
    } catch (e) { Q('.ar-list', o).textContent = 'Не удалось загрузить'; }
  }

  /* ---------------- 2048 ---------------- */
  function g2048(root) {
    root.innerHTML = '<div class="ar"><div class="ar-hd"><div><small>Счёт</small><b id="a-sc">0</b></div><button class="ar-t" data-a="top">Рекорды</button></div><div class="a48" id="a48"><div class="a48-bg">' + '<i></i>'.repeat(16) + '</div></div><div class="ar-hint">Свайпай или стрелки</div></div>';
    const B = Q('#a48', root); let tiles, score, id, over, t0, lock;
    const sz = () => B.clientWidth, gap = 8;
    const pos = (r, c) => { const w = (sz() - gap * 5) / 4; return 'translate(' + (gap + c * (w + gap)) + 'px,' + (gap + r * (w + gap)) + 'px)'; };
    const add = () => {
      const free = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!tiles.some(t => t.r === r && t.c === c && !t.dead)) free.push([r, c]);
      if (!free.length) return; const [r, c] = free[Math.floor(Math.random() * free.length)];
      mk(Math.random() < .9 ? 2 : 4, r, c, 'new');
    };
    const paint = t => { t.el.textContent = t.v; t.el.dataset.v = t.v > 2048 ? 'big' : t.v; t.el.style.transform = pos(t.r, t.c); };
    function mk(v, r, c, cls) { const el = document.createElement('div'); el.className = 'a48-t ' + (cls || ''); const t = { id: id++, v, r, c, el }; B.appendChild(el); tiles.push(t); const w = (sz() - gap * 5) / 4; el.style.width = el.style.height = w + 'px'; paint(t); setTimeout(() => el.classList.remove('new', 'pop'), 220); return t; }
    function start() {
      B.querySelectorAll('.a48-t').forEach(e => e.remove()); tiles = []; score = 0; id = 1; over = false; lock = false; t0 = Date.now(); Q('#a-sc', root).textContent = 0; add(); add();
    }
    function move(dir) {
      if (over || lock) return;
      const vec = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }[dir];
      const live = tiles.filter(t => !t.dead); let moved = false;
      const order = live.slice().sort((a, b) => dir === 'left' ? a.c - b.c : dir === 'right' ? b.c - a.c : dir === 'up' ? a.r - b.r : b.r - a.r);
      const grid = {}; const key = (r, c) => r + ',' + c; const merged = new Set();
      order.forEach(t => {
        let r = t.r, c = t.c;
        while (true) {
          const nr = r + vec[0], nc = c + vec[1];
          if (nr < 0 || nr > 3 || nc < 0 || nc > 3) break;
          const o = grid[key(nr, nc)];
          if (!o) { r = nr; c = nc; continue; }
          if (o.v === t.v && !merged.has(o.id)) { r = nr; c = nc; t.into = o; } break;
        }
        if (t.into) { merged.add(t.into.id); t.dead = true; t.r = r; t.c = c; t.el.style.transform = pos(r, c); t.el.style.zIndex = 1; score += t.v * 2; t.into.v *= 2; moved = true; }
        else { if (r !== t.r || c !== t.c) moved = true; t.r = r; t.c = c; grid[key(r, c)] = t; t.el.style.transform = pos(r, c); }
      });
      if (!moved) return;
      lock = true; Q('#a-sc', root).textContent = score;
      setTimeout(() => {
        tiles.filter(t => t.dead).forEach(t => { t.el.remove(); });
        tiles = tiles.filter(t => !t.dead);
        tiles.forEach(t => { if (t.into) delete t.into; });
        merged.forEach(i => { const t = tiles.find(x => x.id === i); if (t) { paint(t); t.el.classList.add('pop'); setTimeout(() => t.el.classList.remove('pop'), 220); } });
        add(); lock = false;
        if (!can()) { over = true; finish(root, 'g2048', score, (Date.now() - t0) / 1000, start); }
      }, 120);
    }
    function can() {
      if (tiles.length < 16) return true;
      const g = {}; tiles.forEach(t => g[t.r + ',' + t.c] = t.v);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = g[r + ',' + c]; if (g[r + ',' + (c + 1)] === v || g[(r + 1) + ',' + c] === v) return true; }
      return false;
    }
    swipe(B, move);
    const key = e => { if (!root.isConnected) return document.removeEventListener('keydown', key); const d = KEYS[e.key]; if (d) { e.preventDefault(); move(d); } };
    document.addEventListener('keydown', key);
    root.onclick = e => { if (e.target.closest('[data-a=top]')) top(root, 'g2048'); };
    requestAnimationFrame(start);
  }

  /* ---------------- Змейка ---------------- */
  function snake(root) {
    root.innerHTML = '<div class="ar"><div class="ar-hd"><div><small>Яблоки</small><b id="a-sc">0</b></div><button class="ar-t" data-a="top">Рекорды</button></div><div class="asn-w"><canvas id="asn"></canvas></div><div class="ar-hint">Свайпай или стрелки</div></div>';
    const cv = Q('#asn', root), N = 16; const W = Math.min(340, Math.floor(root.clientWidth - 8)); cv.width = cv.height = W * 2; cv.style.width = cv.style.height = W + 'px';
    const ctx = cv.getContext('2d'), cs = cv.width / N;
    const acc = getComputedStyle(document.body).getPropertyValue('--ac').trim() || '#3390ec';
    let sn, dir, nd, food, score, t0, last, run, stepMs;
    const rnd = () => ({ x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) });
    function place() { do { food = rnd(); } while (sn.some(s => s.x === food.x && s.y === food.y)); }
    function start() { sn = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]; dir = nd = { x: 1, y: 0 }; score = 0; stepMs = 130; Q('#a-sc', root).textContent = 0; place(); t0 = Date.now(); last = 0; run = true; requestAnimationFrame(loop); }
    function steer(d) { const v = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } }[d]; if (v.x + dir.x !== 0 || v.y + dir.y !== 0) nd = v; }
    function loop(ts) {
      if (!run || !root.isConnected) return; if (!last) last = ts;
      if (ts - last >= stepMs) {
        last = ts; dir = nd; const h = { x: sn[0].x + dir.x, y: sn[0].y + dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || sn.some(s => s.x === h.x && s.y === h.y)) { run = false; draw(); finish(root, 'snake', score, (Date.now() - t0) / 1000, start); return; }
        sn.unshift(h);
        if (h.x === food.x && h.y === food.y) { score++; Q('#a-sc', root).textContent = score; stepMs = Math.max(65, 130 - score * 3); place(); } else sn.pop();
      }
      draw(); requestAnimationFrame(loop);
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < N * N; i++) { if (((i % N) + Math.floor(i / N)) % 2) { ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect((i % N) * cs, Math.floor(i / N) * cs, cs, cs); } }
      ctx.fillStyle = '#ff5c6c'; ctx.beginPath(); ctx.arc((food.x + .5) * cs, (food.y + .5) * cs, cs * .34, 0, 7); ctx.fill();
      sn.forEach((s, i) => { ctx.fillStyle = acc; ctx.globalAlpha = Math.max(.45, 1 - i / (sn.length + 6)); rr(s.x * cs + 2, s.y * cs + 2, cs - 4, cs - 4, cs * .3); });
      ctx.globalAlpha = 1;
    }
    swipe(cv, steer);
    const key = e => { if (!root.isConnected) return document.removeEventListener('keydown', key); const d = KEYS[e.key]; if (d) { e.preventDefault(); steer(d); } };
    document.addEventListener('keydown', key);
    root.onclick = e => { if (e.target.closest('[data-a=top]')) top(root, 'snake'); };
    requestAnimationFrame(start);
  }

  /* ---------------- Скорость ---------------- */
  function tap(root) {
    root.innerHTML = '<div class="ar"><div class="ar-hd"><div><small>Попадания</small><b id="a-sc">0</b></div><button class="ar-t" data-a="top">Рекорды</button></div><div class="atp-bar"><i id="atpb"></i></div><div class="atp" id="atp"><div class="atp-go">Нажми, чтобы начать</div></div><div class="ar-hint">20 секунд. Лови кружки, пока они не сжались</div></div>';
    const A = Q('#atp', root), DUR = 20000; let score, t0, life, tm, live = false, bar;
    function target() {
      if (!live) return; A.querySelectorAll('.atp-t').forEach(e => e.remove());
      const s = 56, x = Math.random() * (A.clientWidth - s), y = Math.random() * (A.clientHeight - s);
      const el = document.createElement('div'); el.className = 'atp-t'; el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + s + 'px;height:' + s + 'px;animation-duration:' + life + 'ms';
      const hit = e => { e.preventDefault(); e.stopPropagation(); if (!live) return; score++; Q('#a-sc', root).textContent = score; life = Math.max(450, life - 22); clearTimeout(tm); el.classList.add('hit'); setTimeout(() => el.remove(), 120); target(); };
      el.addEventListener('pointerdown', hit); A.appendChild(el);
      tm = setTimeout(() => { el.remove(); target(); }, life);
    }
    function begin() {
      score = 0; life = 1000; live = true; t0 = Date.now(); Q('#a-sc', root).textContent = 0; A.innerHTML = ''; target();
      bar = setInterval(() => {
        const p = (Date.now() - t0) / DUR; Q('#atpb', root).style.transform = 'scaleX(' + Math.max(0, 1 - p) + ')';
        if (p >= 1 || !root.isConnected) { clearInterval(bar); clearTimeout(tm); live = false; A.innerHTML = ''; if (root.isConnected) finish(root, 'tap', score, DUR / 1000, init); }
      }, 50);
    }
    function init() { live = false; A.innerHTML = '<div class="atp-go">Нажми, чтобы начать</div>'; Q('#atpb', root).style.transform = 'scaleX(1)'; A.onclick = () => { A.onclick = null; begin(); }; }
    root.onclick = e => { if (e.target.closest('[data-a=top]')) top(root, 'tap'); };
    init();
  }

  window.ARCADE = { mount: (g, el) => ({ g2048, snake, tap }[g])(el), names: NAMES };
})();
