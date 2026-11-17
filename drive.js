/* YZITK Chats: Автомир — машины, тюнинг, заезды, задания, уровни; вкладка «Игры» */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const PG = () => window.GoldaPages;
  const fm = n => Number(n || 0).toLocaleString('ru-RU');
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const CLS = { C: '#8b95a3', B: '#5aa2ff', A: '#b07dff', S: '#ffb52e' };
  const COL = { vaz2107: '#c9ccd2', priora: '#7f8793', vesta: '#e5e7eb', solaris: '#4a79c8', camry: '#2b2f38', m5e39: '#5b6f93', e63: '#9aa0a8', gtr: '#e8e8ea', p911: '#d94a3d', huracan: '#e0c322', chiron: '#1d3f9a' };
  const PARTS = [['engine', 'Двигатель', '+2% к силе за уровень'], ['tires', 'Шины', '+1,5% за уровень'], ['turbo', 'Турбина', '+2,5% за уровень']];
  const S = { tab: 'race', st: null, plate: null, busy: false };
  let tick = null;

  /* ---------- машина ---------- */
  function car(model, cls, w) {
    const c = COL[model] || '#aaa', low = cls === 'A' || cls === 'S';
    const body = low ? 'M8 58 L16 48 Q30 44 52 42 L76 28 Q84 24 96 24 L122 24 Q136 24 146 32 L166 42 Q190 46 194 56 L194 62 L8 62 Z' : 'M8 58 L14 46 Q22 42 42 40 L64 24 Q70 20 82 20 L124 20 Q138 20 146 28 L164 40 Q186 42 192 54 L192 62 L8 62 Z';
    const win = low ? 'M82 30 L96 28 L120 28 Q130 28 138 35 L84 40 Z' : 'M70 27 L84 24 L124 24 Q132 24 138 31 L148 40 L62 41 Z';
    return `<svg class="dv-car" viewBox="0 0 200 76" ${w ? `width="${w}"` : ''} aria-hidden="true"><ellipse cx="100" cy="68" rx="86" ry="5" fill="#000" opacity=".25"/><path d="${body}" fill="${c}"/><path d="${win}" fill="#0d1520" opacity=".85"/><path d="M12 54 H190" stroke="#000" stroke-opacity=".18" stroke-width="2"/><rect x="186" y="50" width="8" height="5" rx="2" fill="#ffe9a3"/><rect x="6" y="50" width="6" height="5" rx="2" fill="#e5484d"/><g><circle cx="48" cy="62" r="12" fill="#111"/><circle cx="48" cy="62" r="6" fill="#8b95a3"/><circle cx="152" cy="62" r="12" fill="#111"/><circle cx="152" cy="62" r="6" fill="#8b95a3"/></g></svg>`;
  }
  const plateOf = () => { const p = S.plate; return p && window.GoldaPlates ? window.GoldaPlates.plate(p, 'sm') : ''; };
  const sel = () => S.st && S.st.cars.find(c => c.id === S.st.sel);

  /* ---------- вход ---------- */
  async function open(tab) {
    S.tab = tab || S.tab || 'race';
    PG().open('drive', {
      title: 'Автомир', big: 1, sub: 'Машины, тюнинг, заезды и задания', tab: 'set', async render(b) {
        b.innerHTML = '<div id="dvWrap"><div class="pl-seg" id="dvSeg"><button data-t="race">Заезды</button><button data-t="gar">Гараж</button><button data-t="shop">Салон</button><button data-t="mis">Задания</button></div><div id="dvBody"></div></div>';
        Q('#dvSeg', b).onclick = e => { const x = e.target.closest('[data-t]'); if (x) { S.tab = x.dataset.t; draw(); } };
        await draw(true);
      }
    });
  }
  async function load() {
    const [a, d] = await Promise.all([rpc('drive_state'), rpc('deco_get', { p_user: G(() => ME.id) })]);
    if (a.data) S.st = a.data; S.plate = d.data && d.data.plate || null;
  }
  async function draw(reload) {
    const b = Q('#dvBody'); if (!b) return; clearInterval(tick);
    QA('#dvSeg button').forEach(x => x.classList.toggle('on', x.dataset.t === S.tab));
    if (reload || !S.st) { b.innerHTML = '<div class="s2empty">Загрузка…</div>'; await load(); if (!S.st) { b.innerHTML = '<div class="s2empty">Не удалось загрузить. Проверьте соединение.</div>'; return; } }
    ({ race, gar, shop, mis })[S.tab](b);
  }
  const head = () => {
    const s = S.st, span = s.xp_next ? s.xp_next - s.xp_cur : 1, pc = s.xp_next ? Math.min(100, (s.xp - s.xp_cur) / span * 100) : 100;
    return `<div class="ev-card dv-head"><div class="dv-lv"><b>${s.level}</b><small>уровень</small></div><div class="dv-xp"><div class="dv-bar"><i style="width:${pc}%"></i></div><small>${s.xp_next ? fm(s.xp - s.xp_cur) + ' / ' + fm(span) + ' опыта' : 'Максимальный уровень'}</small></div><div class="dv-rub"><b>${fm(s.rub)} ₽</b><small>рубли</small></div></div>`;
  };
  const fuelHTML = s => `<div class="dv-fuel"><span>Топливо</span><span class="dv-pips">${Array.from({ length: s.fuel_max }, (_, i) => `<i class="${i < s.fuel ? 'on' : ''}"></i>`).join('')}</span><small>${s.fuel >= s.fuel_max ? 'Бак полный' : 'Следующая единица через <b id="dvFi"></b>'}</small></div>`;
  function fuelTimer() {
    const s = S.st; const t0 = Date.now(), base = s.fuel_in; const el = Q('#dvFi'); if (!el || s.fuel >= s.fuel_max) return;
    const p = () => { const e = Q('#dvFi'); if (!e) { clearInterval(tick); return; } let r = base - Math.floor((Date.now() - t0) / 1000); if (r <= 0) { clearInterval(tick); S.st.fuel_in = 0; load().then(() => Q('#dvBody') && draw()); return; } e.textContent = Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); };
    p(); tick = setInterval(p, 1000);
  }

  /* ---------- заезды ---------- */
  function race(b) {
    const s = S.st, c = sel();
    b.innerHTML = head() + `<div class="ev-card dv-stage"><div class="dv-cname">${c ? E(c.name) : ''}<span class="dv-cls" style="--c:${CLS[c && c.cls] || '#999'}">${c ? c.cls : ''}</span></div>${c ? car(c.model, c.cls) : ''}<div class="dv-plate">${plateOf()}</div><div class="dv-rate"><b>${c ? c.rating : 0}</b><small>рейтинг машины</small></div></div>
      <div class="ev-card" id="dvRace" hidden></div>${fuelHTML(s)}
      <div class="pl-sec">Выберите заезд</div><div class="dv-tiers">${s.tiers.map(t => `<div class="dv-tier"><div><b>${t.name}</b><small>Соперник ${t.opp} · награда ${fm(t.rub)} ₽ и ${t.xp} опыта</small></div><div class="dv-ch ${t.chance >= 70 ? 'hi' : t.chance >= 40 ? 'mid' : 'lo'}"><b>${t.chance}%</b><small>шанс</small></div><button class="ev-btn" data-r="${t.id}" ${s.fuel < 1 ? 'disabled' : ''}>Ехать</button></div>`).join('')}</div>
      <div class="ev-sub" style="margin-top:10px">Шанс растёт вместе с рейтингом машины. Улучшайте её в гараже или покупайте новую в салоне. За проигрыш дают 10% награды.</div>`;
    fuelTimer();
    b.onclick = e => { const x = e.target.closest('[data-r]'); if (x && !x.disabled) go(x.dataset.r); };
  }
  async function go(tier) {
    if (S.busy) return; S.busy = true; const b = Q('#dvBody'); QA('[data-r]', b).forEach(x => x.disabled = true);
    const r = await rpc('drive_race', { p_tier: tier }); const d = r.data;
    if (!d || !d.ok) { S.busy = false; tst(d && d.error === 'fuel' ? 'Нет топлива. Подождите или выполните задания' : 'Не получилось начать заезд', 'red'); await load(); draw(); return; }
    const c = sel(), box = Q('#dvRace'); box.hidden = false;
    box.innerHTML = `<div class="dv-track"><div class="dv-lane"><span class="dv-fin"></span><div class="dv-rc" id="dvMe">${car(c.model, c.cls, 74)}</div></div><div class="dv-lane"><span class="dv-fin"></span><div class="dv-rc" id="dvOp">${car('priora', 'C', 74)}</div></div></div><div class="dv-cd" id="dvCd">3</div>`;
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    for (const n of [3, 2, 1]) { const e = Q('#dvCd'); if (!e) break; e.textContent = n; try { navigator.vibrate && navigator.vibrate(15); } catch (x) { } await sleep(650); }
    const me = Q('#dvMe'), op = Q('#dvOp'), cd = Q('#dvCd'); if (cd) cd.textContent = 'Старт!';
    if (me && op) { const W = me.parentElement.clientWidth - 84, tm = d.win ? 2.6 : 3.2, to = d.win ? 3.2 : 2.6; me.style.transition = `transform ${tm}s cubic-bezier(.45,.05,.55,.95)`; op.style.transition = `transform ${to}s cubic-bezier(.45,.05,.55,.95)`; me.style.transform = `translateX(${W}px)`; op.style.transform = `translateX(${W}px)`; }
    await sleep(3500); S.busy = false;
    try { navigator.vibrate && navigator.vibrate(d.win ? [30, 40, 60] : 40); } catch (x) { }
    S.st.rub = d.total; S.st.fuel = d.fuel;
    PG().sheet(`<div class="dv-res ${d.win ? 'win' : 'lose'}"><div class="dv-big">${d.win ? 'Победа!' : 'Проигрыш'}</div><div class="ev-sub">Ваш рейтинг ${d.me} против ${d.opp}. Шанс был ${d.chance}%.</div><div class="dv-rw"><div><b>+${fm(d.rub)} ₽</b><small>рубли</small></div><div><b>+${d.xp}</b><small>опыт</small></div></div>${d.level_up ? `<div class="dv-up">Новый уровень: ${d.level_up}! Бонус ${fm(d.reward)} ₽</div>` : ''}</div><button class="ev-btn" id="dvOk">Дальше</button>`, (ov, close) => { Q("#dvOk", ov).onclick = () => close(); });
    if (d.level_up) G(() => window.LIVE && LIVE.confetti && LIVE.confetti(100));
    await load(); draw();
  }

  /* ---------- гараж ---------- */
  function pips(n) { return `<span class="dv-pp">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; }
  function gar(b) {
    const s = S.st;
    b.innerHTML = head() + `<div class="pl-sec">Мои машины · ${s.cars.length}</div>` + s.cars.map(c => `<div class="ev-card dv-gc ${c.id === s.sel ? 'sel' : ''}" data-c="${c.id}"><div class="dv-gt">${car(c.model, c.cls, 110)}<div><b>${E(c.name)}</b><small>Класс <span style="color:${CLS[c.cls]}">${c.cls}</span> · рейтинг ${c.rating}</small>${c.id === s.sel ? '<small class="dv-on">Выбрана для заездов</small>' : '<button class="ev-btn ghost sm" data-sel="' + c.id + '">Выбрать</button>'}</div></div>
      <div class="dv-parts">${PARTS.map(p => { const lv = c[p[0]], cost = c['cost_' + p[0]]; return `<div class="dv-part"><div><b>${p[1]}</b>${pips(lv)}<small>${p[2]}</small></div><button class="ev-btn ${cost == null ? 'ghost' : ''}" data-t="${c.id}|${p[0]}" ${cost == null ? 'disabled' : ''}>${cost == null ? 'Максимум' : fm(cost) + ' ₽'}</button></div>`; }).join('')}</div>
      ${s.cars.length > 1 ? `<button class="dv-sell" data-sell="${c.id}">Продать за ${fm(c.sell)} ₽</button>` : ''}</div>`).join('');
    b.onclick = async e => {
      const sl = e.target.closest('[data-sel]'), t = e.target.closest('[data-t]'), sd = e.target.closest('[data-sell]');
      if (sl) { const r = await rpc('drive_select', { p_car: sl.dataset.sel }); if (r.data && r.data.ok) { await load(); draw(); } }
      else if (t && !t.disabled) {
        const [id, part] = t.dataset.t.split('|'); t.disabled = true; const r = await rpc('drive_tune', { p_car: id, p_part: part }); const d = r.data;
        if (d && d.ok) { tst('Улучшено'); if (d.level_up) tst('Новый уровень: ' + d.level_up + '! +' + fm(d.reward) + ' ₽'); } else tst(d && d.error === 'no_money' ? 'Не хватает рублей' : 'Не получилось', 'red');
        await load(); draw();
      }
      else if (sd) { const c = s.cars.find(x => x.id === sd.dataset.sell); if (!c || !confirm('Продать ' + c.name + ' за ' + fm(c.sell) + ' ₽? Улучшения пропадут.')) return; const r = await rpc('drive_sell', { p_car: c.id }); if (r.data && r.data.ok) { tst('+' + fm(r.data.got) + ' ₽'); await load(); draw(); } else tst('Нельзя продать последнюю машину', 'red'); }
    };
  }

  /* ---------- салон ---------- */
  function shop(b) {
    const s = S.st;
    b.innerHTML = head() + `<div class="pl-sec">Автосалон</div>` + s.models.map(m => { const lock = s.level < m.lvl, cant = !lock && s.rub < m.price; return `<div class="ev-card dv-sh ${lock ? 'lock' : ''}"><div class="dv-gt">${car(m.id, m.cls, 110)}<div><b>${E(m.name)}</b><small>Класс <span style="color:${CLS[m.cls]}">${m.cls}</span> · рейтинг ${m.rating}${m.owned ? ' · у вас ' + m.owned : ''}</small><small>${lock ? 'Нужен уровень ' + m.lvl : fm(m.price) + ' ₽'}</small></div></div><button class="ev-btn ${lock || cant ? 'ghost' : ''}" data-b="${m.id}" ${lock ? 'disabled' : ''}>${lock ? 'Уровень ' + m.lvl : 'Купить за ' + fm(m.price) + ' ₽'}</button></div>`; }).join('');
    b.onclick = async e => {
      const x = e.target.closest('[data-b]'); if (!x || x.disabled) return; const m = s.models.find(k => k.id === x.dataset.b);
      if (s.rub < m.price) return tst('Не хватает рублей: нужно ' + fm(m.price) + ' ₽', 'red');
      if (!confirm('Купить ' + m.name + ' за ' + fm(m.price) + ' ₽?')) return;
      const r = await rpc('drive_buy', { p_model: m.id }); const d = r.data;
      if (d && d.ok) { tst('Машина куплена и выбрана'); S.tab = 'race'; await load(); draw(); } else tst(d && d.error === 'level' ? 'Нужен уровень ' + d.need : d && d.error === 'no_money' ? 'Не хватает рублей' : d && d.error === 'full' ? 'В гараже нет места' : 'Не получилось', 'red');
    };
  }

  /* ---------- задания ---------- */
  function mis(b) {
    const s = S.st;
    b.innerHTML = head() + `<div class="ev-card"><div class="ev-h">Задания дня</div><div class="ev-sub">Обновляются каждый день. Награда: рубли и опыт.</div><div style="margin-top:8px">${s.missions.map(m => `<div class="pl-task"><div><b>${E(m.title)}</b><small>${m.have} / ${m.goal} · ${fm(m.rub)} ₽ и ${m.xp} опыта</small></div><button data-m="${m.id}" ${m.claimed || m.have < m.goal ? 'disabled' : ''}>${m.claimed ? 'Получено' : m.have < m.goal ? 'В процессе' : 'Забрать'}</button></div>`).join('')}</div></div>
      <div class="ev-card"><div class="ev-h">Статистика</div><div class="gr-stats"><div><b>${fm(s.races)}</b><small>заездов</small></div><div><b>${fm(s.wins)}</b><small>побед</small></div><div><b>${s.races ? Math.round(s.wins / s.races * 100) : 0}%</b><small>побед в доле</small></div></div></div>
      <div class="ev-card"><div class="ev-h">Как расти</div><div class="ev-sub">Заезды дают опыт и рубли. С каждым уровнем соперники сильнее, но открываются новые машины и растут награды. На новом уровне вы получаете бонус в рублях.</div></div>`;
    b.onclick = async e => { const x = e.target.closest('[data-m]'); if (!x || x.disabled) return; x.disabled = true; const r = await rpc('drive_claim', { p_m: x.dataset.m }); const d = r.data; if (d && d.ok) { tst('+' + fm(d.rub) + ' ₽ и ' + d.xp + ' опыта'); if (d.level_up) tst('Новый уровень: ' + d.level_up + '! +' + fm(d.reward) + ' ₽'); await load(); draw(); } else { tst('Задание ещё не выполнено', 'red'); x.disabled = false; } };
  }

  /* ---------- вкладка «Игры» ---------- */
  async function hub() {
    PG().open('games', {
      title: 'Игры', big: 1, sub: 'Играйте и зарабатывайте рубли', tab: 'set', async render(b) {
        b.innerHTML = '<div id="gmhWrap"><div class="s2empty">Загрузка…</div></div>';
        await load(); const s = S.st, w = Q('#gmhWrap', b); if (!w) return;
        const tile = (id, t, d, ic, big) => `<button class="gh-tile ${big ? 'big' : ''}" data-g="${id}"><span class="gh-ic">${ic}</span><b>${t}</b><small>${d}</small></button>`;
        w.innerHTML = (s ? `<div class="ev-card dv-head"><div class="dv-lv"><b>${s.level}</b><small>уровень</small></div><div class="dv-xp"><b style="font-size:15px">${s.fuel} из ${s.fuel_max} топлива</b><small>Рейтинг машины ${s.rating}</small></div><div class="dv-rub"><b>${fm(s.rub)} ₽</b><small>рубли</small></div></div>` : '') +
          `<div class="gh-grid">${tile('drive', 'Автомир', 'Заезды, тюнинг, задания и уровни', ic('car'), 1)}${tile('plates', 'Рулетка номеров', 'Крутите номера и собирайте коллекцию', ic('ticket'))}${tile('garage', 'Гараж номеров', 'Номера приносят рубли', ic('home'))}${tile('mini', 'Мини-игры', '2048, змейка, слоты и другие', ic('dice'))}${tile('tour', 'Турниры', 'Рейтинг и награды', ic('cup'))}</div>`;
        w.onclick = e => { const x = e.target.closest('[data-g]'); if (!x) return; const k = x.dataset.g; if (k === 'drive') open('race'); else if (k === 'plates') G(() => window.GoldaPlates.open('game')); else if (k === 'garage') G(() => window.GoldaPlates.open('gar')); else if (k === 'mini') G(() => window.GAMES_HUB()); else if (k === 'tour') G(() => window.GoldaEngage.tourney()); };
      }
    });
  }
  const ic = n => ({
    car: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M5 11l1.6-4.3A2 2 0 018.5 5.400h7a2 2 0 011.900 1.300L19 11a2 2 0 011.500 2v4a1 1 0 01-1 1H18a2 2 0 01-4 0h-4a2 2 0 01-4 0H4.500a1 1 0 01-1-1v-4A2 2 0 015 11zm2.200 0h9.600l-1-2.600H8.200z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4z"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 3l9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"/></svg>',
    dice: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zm2.500 4a1.500 1.500 0 100 3 1.500 1.500 0 000-3zm7 7a1.500 1.500 0 100 3 1.500 1.500 0 000-3z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7 3h10v5a5 5 0 01-4 4.900V16h3v2H8v-2h3v-3.100A5 5 0 017 8zM3 5h3v3a3 3 0 01-3-3zm18 0a3 3 0 01-3 3V5zM6 20h12v2H6z"/></svg>'
  })[n];
  window.GoldaDrive = { open, hub };
})();
