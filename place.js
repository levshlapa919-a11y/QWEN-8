/* YZITK Chats: «Автоград» — открытый город, по которому можно ездить на своей машине */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fm = n => Number(n || 0).toLocaleString('ru-RU');
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const D = () => window.GoldaDrive;
  const T = 64, N = 60, WORLD = T * N;
  /* ---------- карта ---------- */
  const rnd = (a, b) => { let h = (a * 374761393 + b * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const isRoadI = i => (i % 10) < 2;
  const POIS = [
    { k: 'salon', bx: 2, by: 2, name: 'Автосалон', col: '#d9a441', open: () => D().open('shop') },
    { k: 'tune', bx: 4, by: 2, name: 'Тюнинг-гараж', col: '#4aa3d9', open: () => D().open('gar') },
    { k: 'race', bx: 3, by: 4, name: 'Заезды', col: '#e5484d', open: () => D().open('race') },
    { k: 'mis', bx: 1, by: 3, name: 'Диспетчер', col: '#4cd37b', open: () => D().open('mis') },
    { k: 'plates', bx: 4, by: 4, name: 'Номера', col: '#b07dff', open: () => G(() => window.GoldaPlates.open('game')) }
  ];
  const PARKS = [[1, 1], [3, 1], [5, 5], [0, 4], [5, 2], [2, 5]];
  const PAL = ['#6d7a8c', '#8a7a6a', '#5f7f78', '#7a6a8c', '#8c6a6a', '#6a7f93', '#9a8f72', '#677064'];
  const solid = new Uint8Array(N * N), bl = [], trees = [], isPoiTile = new Uint8Array(N * N);
  (function gen() {
    for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 6; by++) {
      const ox = bx * 10 + 2, oy = by * 10 + 2, poi = POIS.find(p => p.bx === bx && p.by === by);
      if (poi) {
        for (let i = ox + 2; i < ox + 6; i++) for (let j = oy + 2; j < oy + 5; j++) { solid[j * N + i] = 1; }
        bl.push({ x: (ox + 2) * T, y: (oy + 2) * T, w: 4 * T, h: 3 * T, hh: 150, c: poi.col, poi: poi }); continue;
      }
      if (PARKS.some(p => p[0] === bx && p[1] === by)) {
        for (let n = 0; n < 14; n++) { const i = ox + 1 + Math.floor(rnd(bx * 9 + n, by) * 6), j = oy + 1 + Math.floor(rnd(bx, by * 9 + n) * 6); if (!solid[j * N + i]) { solid[j * N + i] = 1; trees.push({ x: (i + .5) * T, y: (j + .5) * T, r: 22 + rnd(i, j) * 12 }); } }
        continue;
      }
      for (let lx = 0; lx < 2; lx++) for (let ly = 0; ly < 2; ly++) {
        if (rnd(bx * 7 + lx, by * 5 + ly) < .12) continue;
        const i0 = ox + lx * 4 + Math.floor(rnd(lx + bx, ly + by * 3) * 2), j0 = oy + ly * 4 + Math.floor(rnd(ly + by, lx + bx * 3) * 2), w = 3, h = 3;
        for (let i = i0; i < i0 + w; i++) for (let j = j0; j < j0 + h; j++) solid[j * N + i] = 1;
        bl.push({ x: i0 * T, y: j0 * T, w: w * T, h: h * T, hh: 50 + Math.floor(rnd(i0, j0) * 90), c: PAL[Math.floor(rnd(i0 * 3, j0 * 7) * PAL.length)] });
      }
    }
  })();
  const markerOf = p => ({ x: (p.bx * 10 + 6) * T, y: (p.by * 10 + 11) * T });
  const coinsAll = []; (function () { let n = 0; for (let t = 0; t < 400 && n < 150; t++) { const i = Math.floor(rnd(t, 77) * N), j = Math.floor(rnd(77, t) * N); if (isRoadI(i) !== isRoadI(j) || (isRoadI(i) && isRoadI(j))) { if (!(isRoadI(i) || isRoadI(j))) continue; coinsAll.push({ x: (i + .5) * T + (rnd(i, t) - .5) * 24, y: (j + .5) * T + (rnd(t, j) - .5) * 24, t: 0 }); n++; } } })();

  /* ---------- состояние ---------- */
  let R = null, cv, cx, W = 0, H = 0, dpr = 1, raf = 0, last = 0, me, keys = {}, touch = { steer: 0, gas: 0, brake: 0 }, ch = null, others = new Map(), pend = 0, pickAt = 0, near = null, floaters = [], sendAt = 0, capHit = false, paused = false, speedShow = 0;
  const carStats = () => {
    const S = D().S.st, c = S.cars.find(k => k.id === S.sel) || S.cars[0], m = S.models.find(k => k.id === c.model) || { power: 60, grip: 55 };
    const f = 1 + c.engine * .02 + c.turbo * .025;
    return { c, model: c.model, top: (170 + m.power * .9) * f, acc: (200 + m.power * 1.4) * f, turn: 1.7 + m.grip * .006 + c.tires * .03, grip: m.grip };
  };
  async function open() {
    if (R) return;
    await D().load(); const S = D().S.st; if (!S) { tst('Не удалось загрузить игру', 'red'); return; }
    document.body.classList.add('plc-open');
    R = document.createElement('div'); R.id = 'plcRoot';
    R.innerHTML = `<canvas id="plcCv"></canvas><div class="plc-hud"><button class="plc-x" id="plcX" aria-label="Выйти">✕</button><div class="plc-pill" id="plcPill"></div><canvas id="plcMap" width="120" height="120"></canvas><button class="plc-enter" id="plcEnter" hidden></button><div class="plc-ctl"><div class="plc-steer" id="plcSt"><span id="plcKnob"></span><small>Руль</small></div><div class="plc-pedals"><button id="plcBr">Тормоз</button><button id="plcGas">Газ</button></div></div><div class="plc-spd" id="plcSpd"></div></div>`;
    document.body.appendChild(R); cv = Q('#plcCv'); cx = cv.getContext('2d');
    me = { x: 30 * T + T, y: 30 * T + T, a: 0, v: 0, st: carStats() }; me.a = 0;
    resize(); bind(); net(); hud(); last = performance.now(); raf = requestAnimationFrame(loop);
    tst('Ведите машину по городу, собирайте монеты и заезжайте в здания с кольцами');
  }
  const Q = (s, r) => (r || document).querySelector(s);
  function close() { if (!R) return; if (pend > 0 && !capHit) { rpc('drive_pickup', { p_n: Math.min(12, pend) }); } cancelAnimationFrame(raf); raf = 0; try { ch && sb.removeChannel(ch); } catch (e) { } ch = null; others.clear(); unbind(); R.remove(); R = null; document.body.classList.remove('plc-open'); G(() => D().hub()); }
  function resize() { if (!R) return; dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }

  /* ---------- ввод ---------- */
  const kd = e => { keys[e.code] = 1; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); if (e.code === 'KeyE' || e.code === 'Enter') enter(); };
  const ku = e => { keys[e.code] = 0; };
  let stId = null, stX = 0;
  function bind() {
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('resize', resize);
    const st = Q('#plcSt'), kn = Q('#plcKnob');
    st.onpointerdown = e => { stId = e.pointerId; stX = e.clientX; st.setPointerCapture(e.pointerId); };
    st.onpointermove = e => { if (e.pointerId !== stId) return; const dx = Math.max(-60, Math.min(60, e.clientX - stX)); touch.steer = dx / 60; kn.style.transform = `translateX(${dx}px)`; };
    const up = e => { if (e.pointerId !== stId) return; stId = null; touch.steer = 0; kn.style.transform = ''; };
    st.onpointerup = up; st.onpointercancel = up;
    const pedal = (id, k) => { const b = Q(id); b.onpointerdown = e => { touch[k] = 1; b.classList.add('on'); b.setPointerCapture(e.pointerId); }; const o = () => { touch[k] = 0; b.classList.remove('on'); }; b.onpointerup = o; b.onpointercancel = o; };
    pedal('#plcGas', 'gas'); pedal('#plcBr', 'brake');
    Q('#plcX').onclick = close; Q('#plcEnter').onclick = enter;
    R.addEventListener('contextmenu', e => e.preventDefault());
  }
  function unbind() { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', resize); keys = {}; touch = { steer: 0, gas: 0, brake: 0 }; }
  function enter() {
    if (!near || !R) return; const p = near; me.v = 0; keys = {}; touch.gas = touch.brake = 0; Q('#plcGas').classList.remove('on'); Q('#plcBr').classList.remove('on');
    paused = true; p.open(); const w = setInterval(() => { if (!R) { clearInterval(w); return; } if (!document.body.classList.contains('s2-open')) { clearInterval(w); paused = false; D().load().then(() => { if (R) { me.st = carStats(); hud(); } }); } }, 400);
  }

  /* ---------- сеть: другие игроки ---------- */
  function net() {
    try {
      const my = G(() => ME.id); ch = sb.channel('place-avtograd', { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'p' }, m => { const d = m && m.payload; if (!d || d.i === my || typeof d.x !== 'number') return; let o = others.get(d.i); if (!o) { if (others.size >= 40) return; o = { x: d.x, y: d.y, a: d.a }; others.set(d.i, o); } o.tx = d.x; o.ty = d.y; o.ta = d.a; o.n = String(d.n || '').slice(0, 18); o.m = String(d.m || ''); o.t = performance.now(); });
      ch.subscribe();
    } catch (e) { ch = null; }
  }
  function send(t) { if (!ch || t - sendAt < 200) return; sendAt = t; try { ch.send({ type: 'broadcast', event: 'p', payload: { i: G(() => ME.id), n: G(() => ME.display_name || ME.username), x: Math.round(me.x), y: Math.round(me.y), a: +me.a.toFixed(2), m: me.st.model } }); } catch (e) { } }

  /* ---------- физика ---------- */
  function step(dt) {
    const s = me.st, gas = (keys.KeyW || keys.ArrowUp ? 1 : 0) || touch.gas, br = (keys.KeyS || keys.ArrowDown ? 1 : 0) || touch.brake, steer = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touch.steer, hb = keys.Space;
    const sc = Math.max(-1, Math.min(1, steer));
    if (gas) me.v += s.acc * dt; else if (br) me.v -= (me.v > 0 ? s.acc * 2.2 : s.acc * .7) * dt; else me.v -= Math.sign(me.v) * Math.min(Math.abs(me.v), 160 * dt);
    if (hb) me.v -= Math.sign(me.v) * Math.min(Math.abs(me.v), 420 * dt);
    me.v = Math.max(-s.top * .35, Math.min(s.top, me.v));
    const k = Math.min(1, Math.abs(me.v) / 70) * Math.sign(me.v), hi = 1 - Math.min(.45, Math.abs(me.v) / s.top * .35);
    me.a += sc * s.turn * k * hi * dt;
    const nx = me.x + Math.cos(me.a) * me.v * dt, ny = me.y + Math.sin(me.a) * me.v * dt;
    if (!hit(nx, me.y)) me.x = nx; else { me.v *= -.25; bump(); }
    if (!hit(me.x, ny)) me.y = ny; else { me.v *= -.25; bump(); }
    me.x = Math.max(20, Math.min(WORLD - 20, me.x)); me.y = Math.max(20, Math.min(WORLD - 20, me.y));
  }
  let bumpAt = 0; const bump = () => { const t = performance.now(); if (t - bumpAt > 400) { bumpAt = t; try { navigator.vibrate && navigator.vibrate(20); } catch (e) { } } };
  function hit(x, y) { const r = 15; for (let i = Math.floor((x - r) / T); i <= Math.floor((x + r) / T); i++) for (let j = Math.floor((y - r) / T); j <= Math.floor((y + r) / T); j++) { if (i < 0 || j < 0 || i >= N || j >= N) return true; if (!solid[j * N + i]) continue; const cx_ = Math.max(i * T, Math.min(x, i * T + T)), cy_ = Math.max(j * T, Math.min(y, j * T + T)); if ((x - cx_) ** 2 + (y - cy_) ** 2 < r * r) return true; } return false; }

  /* ---------- монеты и точки ---------- */
  function world(t) {
    for (const c of coinsAll) { if (c.t && t - c.t > 70000) c.t = 0; if (c.t) continue; if ((c.x - me.x) ** 2 + (c.y - me.y) ** 2 < 30 * 30) { c.t = t; pend++; floaters.push({ x: c.x, y: c.y, s: '+', t }); } }
    if (pend > 0 && t - pickAt > 6000 && !capHit) flush(t);
    near = null; for (const p of POIS) { const m = markerOf(p); if ((m.x - me.x) ** 2 + (m.y - me.y) ** 2 < 75 * 75) { near = p; break; } }
    const b = Q('#plcEnter'); if (b) { if (near && Math.abs(me.v) < 140) { b.hidden = false; b.textContent = 'Войти: ' + near.name; } else b.hidden = true; }
  }
  async function flush(t) {
    pickAt = t; const n = Math.min(12, pend); const r = await rpc('drive_pickup', { p_n: n }); const d = r.data;
    if (d && d.ok) { pend -= n; if (pend < 0) pend = 0; const S = D().S.st; if (S) S.rub = d.total; floaters.push({ x: me.x, y: me.y - 30, s: '+' + fm(d.rub) + ' ₽', t: performance.now(), big: 1 }); if (d.level_up) tst('Новый уровень: ' + d.level_up + '! +' + fm(d.reward) + ' ₽'); hud(); }
    else if (d && d.error === 'cap') { pend = 0; capHit = true; tst('Лимит монет на сегодня набран. Завтра они снова принесут рубли', 'red'); }
    else if (!d || d.error !== 'fast') pend = 0;
  }
  function hud() { const S = D().S.st; const p = Q('#plcPill'); if (!p || !S) return; p.innerHTML = `<b>Ур. ${S.level}</b><span>${fm(S.rub)} ₽</span><span>⛽ ${S.fuel}</span>`; }

  /* ---------- отрисовка ---------- */
  function loop(t) {
    if (!R) return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!paused) { step(dt); world(t); send(t); }
    for (const [k, o] of others) { if (t - o.t > 4000) { others.delete(k); continue; } o.x += (o.tx - o.x) * Math.min(1, dt * 8); o.y += (o.ty - o.y) * Math.min(1, dt * 8); let da = o.ta - o.a; da = Math.atan2(Math.sin(da), Math.cos(da)); o.a += da * Math.min(1, dt * 8); }
    draw(t);
  }
  function draw(t) {
    const sc = Math.max(1.1, Math.min(1.8, Math.min(W, H) / 340)) * (1 - Math.min(.12, Math.abs(me.v) / me.st.top * .12));
    cx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0); const vw = W / sc, vh = H / sc;
    const camX = me.x - vw / 2 + Math.cos(me.a) * me.v * .25, camY = me.y - vh / 2 + Math.sin(me.a) * me.v * .25;
    cx.fillStyle = '#1e2a22'; cx.fillRect(0, 0, vw, vh); cx.save(); cx.translate(-camX, -camY);
    const i0 = Math.max(0, Math.floor(camX / T) - 1), i1 = Math.min(N - 1, Math.floor((camX + vw) / T) + 1), j0 = Math.max(0, Math.floor(camY / T) - 1), j1 = Math.min(N - 1, Math.floor((camY + vh) / T) + 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const rd = isRoadI(i) || isRoadI(j); cx.fillStyle = rd ? '#30343b' : ((i + j) & 1 ? '#3b4540' : '#3e4943'); cx.fillRect(i * T, j * T, T + 1, T + 1); }
    cx.strokeStyle = 'rgba(230,220,160,.55)'; cx.lineWidth = 3; cx.setLineDash([20, 18]);
    cx.beginPath();
    for (let i = i0; i <= i1; i++) if (i % 10 === 0) { const x = (i + 1) * T; for (let j = j0; j <= j1; j++) if (!isRoadI(j)) { cx.moveTo(x, j * T); cx.lineTo(x, j * T + T); } }
    for (let j = j0; j <= j1; j++) if (j % 10 === 0) { const y = (j + 1) * T; for (let i = i0; i <= i1; i++) if (!isRoadI(i)) { cx.moveTo(i * T, y); cx.lineTo(i * T + T, y); } }
    cx.stroke(); cx.setLineDash([]);
    // метки POI
    for (const p of POIS) { const m = markerOf(p); if (m.x < camX - 100 || m.x > camX + vw + 100 || m.y < camY - 100 || m.y > camY + vh + 100) continue; const pl = 1 + Math.sin(t / 300) * .08; cx.beginPath(); cx.arc(m.x, m.y, 52 * pl, 0, 7); cx.fillStyle = p.col + '33'; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = p.col; cx.stroke(); cx.fillStyle = p.col; cx.font = '700 14px system-ui,sans-serif'; cx.textAlign = 'center'; cx.fillText(p.name, m.x, m.y + 5); }
    // монеты
    for (const c of coinsAll) { if (c.t || c.x < camX - 20 || c.x > camX + vw + 20 || c.y < camY - 20 || c.y > camY + vh + 20) continue; const bob = Math.sin(t / 250 + c.x) * 2; cx.beginPath(); cx.arc(c.x, c.y + bob, 9, 0, 7); cx.fillStyle = '#ffc928'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#b8870c'; cx.stroke(); cx.fillStyle = '#b8870c'; cx.font = '800 10px system-ui'; cx.textAlign = 'center'; cx.fillText('₽', c.x, c.y + bob + 3.500); }
    // машины
    for (const o of others.values()) drawCar(o.x, o.y, o.a, o.m); 
    drawCar(me.x, me.y, me.a, me.st.model, 1);
    cx.textAlign = 'center'; cx.font = '700 12px system-ui,sans-serif';
    for (const o of others.values()) label(o.x, o.y - 26, o.n || 'Игрок');
    label(me.x, me.y - 26, G(() => ME.display_name || ME.username) || 'Вы');
    // деревья и здания (поверх)
    for (const tr of trees) { if (tr.x < camX - 60 || tr.x > camX + vw + 60 || tr.y < camY - 60 || tr.y > camY + vh + 60) continue; cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.arc(tr.x + 5, tr.y + 6, tr.r, 0, 7); cx.fill(); cx.fillStyle = '#2f6b3d'; cx.beginPath(); cx.arc(tr.x, tr.y - 8, tr.r, 0, 7); cx.fill(); cx.fillStyle = '#3d8a50'; cx.beginPath(); cx.arc(tr.x - 4, tr.y - 12, tr.r * .65, 0, 7); cx.fill(); }
    for (const b of bl) {
      if (b.x > camX + vw + 40 || b.x + b.w < camX - 40 || b.y > camY + vh + 160 || b.y + b.h < camY - 40) continue;
      const off = b.hh * .38; cx.fillStyle = 'rgba(0,0,0,.28)'; cx.fillRect(b.x + 8, b.y + 8, b.w, b.h);
      cx.fillStyle = shade(b.c, -38); cx.fillRect(b.x, b.y + b.h - off, b.w, off);
      cx.fillStyle = b.c; cx.fillRect(b.x, b.y - off, b.w, b.h);
      cx.fillStyle = shade(b.c, 18); cx.fillRect(b.x + 6, b.y - off + 6, b.w - 12, b.h - 12);
      cx.fillStyle = 'rgba(255,255,255,.07)'; for (let wx = 14; wx < b.w - 14; wx += 26) for (let wy = 12; wy < b.h - 14; wy += 22) cx.fillRect(b.x + wx, b.y - off + wy, 14, 10);
      cx.fillStyle = 'rgba(255,214,120,.55)'; for (let wx = 14; wx < b.w - 14; wx += 26) cx.fillRect(b.x + wx, b.y + b.h - off + 7, 14, Math.max(5, off - 16));
      if (b.poi) { cx.fillStyle = '#fff'; cx.font = '800 18px system-ui,sans-serif'; cx.textAlign = 'center'; cx.fillText(b.poi.name, b.x + b.w / 2, b.y - off + b.h / 2 + 6); }
    }
    for (const f of floaters) { const a = (t - f.t) / 1000; if (a > 1.2) continue; cx.globalAlpha = 1 - a / 1.2; cx.fillStyle = f.big ? '#ffd95a' : '#fff'; cx.font = (f.big ? '800 18px' : '700 14px') + ' system-ui'; cx.textAlign = 'center'; cx.fillText(f.s, f.x, f.y - a * 40); cx.globalAlpha = 1; }
    floaters = floaters.filter(f => t - f.t < 1300);
    cx.restore();
    map(); const sp = Q('#plcSpd'); if (sp) { speedShow += (Math.abs(me.v) - speedShow) * .2; sp.textContent = Math.round(speedShow * .6) + ' км/ч'; }
  }
  function label(x, y, s) { cx.fillStyle = 'rgba(0,0,0,.55)'; const w = cx.measureText(s).width + 12; cx.fillRect(x - w / 2, y - 12, w, 17); cx.fillStyle = '#fff'; cx.fillText(s, x, y + 1); }
  function shade(h, d) { const n = parseInt(h.slice(1), 16), c = v => Math.max(0, Math.min(255, v + d)); return `rgb(${c(n >> 16)},${c(n >> 8 & 255)},${c(n & 255)})`; }
  const DIM = { zaz: [38, 22], box: [44, 23], sedan: [48, 23], hatch: [44, 23], wagon: [52, 24], van: [54, 26], coupe: [50, 23], lux: [58, 25], super: [52, 24] };
  function drawCar(x, y, a, model, own) {
    const m = (D().CARS || {})[model] || { b: 'sedan', c: '#999' }, d = DIM[m.b] || DIM.sedan, L = d[0], Wd = d[1];
    cx.save(); cx.translate(x, y); cx.rotate(a);
    cx.fillStyle = 'rgba(0,0,0,.3)'; cx.fillRect(-L / 2 + 3, -Wd / 2 + 4, L, Wd);
    cx.fillStyle = '#111'; for (const sx of [-.3, .3]) for (const sy of [-1, 1]) cx.fillRect(sx * L - 5, sy * (Wd / 2) - (sy > 0 ? 3 : 0), 10, 3.500);
    cx.fillStyle = m.c; rr(-L / 2, -Wd / 2, L, Wd, 6); cx.fill();
    if (m.f === 'rust') { cx.fillStyle = 'rgba(138,75,34,.8)'; cx.fillRect(-L * .1, -Wd / 2 + 2, 9, 6); cx.fillRect(L * .2, Wd / 2 - 9, 8, 6); cx.fillRect(-L * .4, -3, 6, 5); }
    if (m.f === 'stripe') { cx.fillStyle = '#c8102e'; cx.fillRect(-L / 2, -2, L, 4); } if (m.f === 'duo') { cx.fillStyle = '#c9a43a'; cx.fillRect(0, -Wd / 2, L / 2, Wd); cx.fillStyle = m.c; rr(-L / 2, -Wd / 2, L / 2 + 2, Wd, 6); cx.fill(); }
    cx.fillStyle = 'rgba(10,18,28,.9)'; rr(-L * .12, -Wd / 2 + 3, L * .36, Wd - 6, 4); cx.fill(); rr(-L * .38, -Wd / 2 + 4, L * .14, Wd - 8, 3); cx.fill();
    cx.fillStyle = m.f === 'gold' ? '#e6c25a' : m.f === 'chrome' ? '#dfe3ea' : 'rgba(255,255,255,.18)'; cx.fillRect(-L / 2 + 2, -.8, L - 4, 1.6);
    cx.fillStyle = '#fff3b0'; cx.fillRect(L / 2 - 3, -Wd / 2 + 2, 3, 5); cx.fillRect(L / 2 - 3, Wd / 2 - 7, 3, 5); cx.fillStyle = '#e5484d'; cx.fillRect(-L / 2, -Wd / 2 + 2, 2.500, 5); cx.fillRect(-L / 2, Wd / 2 - 7, 2.500, 5);
    if (m.b === 'super') { cx.fillStyle = m.c; cx.fillRect(-L / 2 - 3, -Wd / 2, 4, Wd); }
    if (own && (me.v > 20)) { cx.fillStyle = 'rgba(255,240,170,.10)'; cx.beginPath(); cx.moveTo(L / 2, -Wd / 2 + 3); cx.lineTo(L / 2 + 90, -Wd - 18); cx.lineTo(L / 2 + 90, Wd + 18); cx.lineTo(L / 2, Wd / 2 - 3); cx.fill(); }
    cx.restore();
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function map() {
    const c = Q('#plcMap'); if (!c) return; const g = c.getContext('2d'), s = 120 / WORLD; g.clearRect(0, 0, 120, 120); g.fillStyle = 'rgba(15,22,28,.82)'; g.fillRect(0, 0, 120, 120);
    g.fillStyle = 'rgba(160,170,180,.45)'; for (let k = 0; k < 6; k++) { g.fillRect(k * 10 * T * s, 0, 2 * T * s, 120); g.fillRect(0, k * 10 * T * s, 120, 2 * T * s); }
    for (const p of POIS) { const m = markerOf(p); g.fillStyle = p.col; g.beginPath(); g.arc(m.x * s, m.y * s, 3.500, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; for (const o of others.values()) { g.beginPath(); g.arc(o.x * s, o.y * s, 2.200, 0, 7); g.fill(); }
    g.fillStyle = '#4cd37b'; g.beginPath(); g.arc(me.x * s, me.y * s, 3.800, 0, 7); g.fill();
  }
  window.GoldaPlace = { open, close, _t: (x, y, a) => { if (me) { me.x = x; me.y = y; if (a != null) me.a = a; } } };
})();
