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
  const CLS = { D: '#a0764a', C: '#8b95a3', B: '#5aa2ff', A: '#b07dff', S: '#ffb52e', L: '#e8d9a0' };
  const CLN = { D: 'Развалюха', C: 'Эконом', B: 'Бизнес', A: 'Спорт', S: 'Суперкар', L: 'Люкс' };
  /* каталог внешнего вида: кузов, цвет, состояние (rust = ржавая, chrome/gold = отделка) */
  const CARS = {
    zaz965: { b: 'zaz', c: '#9db28a', f: 'rust' }, moskvich: { b: 'box', c: '#a98b6b', f: 'rust' }, kopeyka: { b: 'sedan', c: '#b5a47a', f: 'rust' }, vaz2107: { b: 'sedan', c: '#8b95a3', f: 'rust' }, gazel: { b: 'van', c: '#d8d4c4', f: 'rust' },
    priora: { b: 'sedan', c: '#7f8793' }, vesta: { b: 'sedan', c: '#e5e7eb' }, solaris: { b: 'sedan', c: '#4a79c8' }, rio: { b: 'hatch', c: '#c0392b' }, focus: { b: 'hatch', c: '#2e5ea8' },
    camry: { b: 'sedan', c: '#2b2f38', f: 'chrome' }, mazda6: { b: 'sedan', c: '#a32c2c', f: 'chrome' }, m5e39: { b: 'sedan', c: '#5b6f93', f: 'chrome' }, a6: { b: 'wagon', c: '#444b55', f: 'chrome' }, e63: { b: 'sedan', c: '#9aa0a8', f: 'chrome' },
    sclass: { b: 'lux', c: '#101216', f: 'chrome' }, bentley: { b: 'lux', c: '#1c3b2f', f: 'chrome' }, phantom: { b: 'lux', c: '#e9e6dc', f: 'chrome' }, maybach: { b: 'lux', c: '#14161a', f: 'gold' },
    gtr: { b: 'coupe', c: '#e8e8ea' }, m4: { b: 'coupe', c: '#2a63c9' }, p911: { b: 'coupe', c: '#d94a3d' }, r8: { b: 'coupe', c: '#8d9099' },
    huracan: { b: 'super', c: '#e0c322' }, f488: { b: 'super', c: '#c8102e' }, m720: { b: 'super', c: '#f07d00' }, chiron: { b: 'super', c: '#1d3f9a', f: 'duo' }, jesko: { b: 'super', c: '#e8e8ea', f: 'stripe' }
  };
  const BODY = {
    zaz: ['M16 61 Q12 46 30 38 Q46 21 84 21 Q124 21 148 35 Q176 43 184 58 L184 62 L16 62 Z', 'M54 37 Q66 27 86 27 L116 27 Q132 28 142 38 Z', 0.92],
    box: ['M12 61 L14 44 L50 40 L70 22 L140 22 L158 38 L186 42 L188 62 L12 62 Z', 'M72 28 L138 28 L150 38 L62 38 Z', 0.96],
    sedan: ['M8 60 L14 46 Q22 42 42 40 L64 24 Q70 20 82 20 L124 20 Q138 20 146 28 L164 40 Q186 42 192 54 L192 62 L8 62 Z', 'M70 27 L84 24 L124 24 Q132 24 138 31 L148 40 L62 41 Z', 1],
    hatch: ['M10 60 L14 46 Q30 42 54 38 L72 24 Q78 20 90 20 L136 20 Q148 22 154 34 L182 38 Q192 42 192 54 L192 62 L10 62 Z', 'M76 27 L90 24 L134 24 Q140 26 144 34 L148 39 L66 39 Z', 0.98],
    wagon: ['M8 60 L12 46 Q22 42 42 40 L64 24 Q70 20 82 20 L150 20 Q164 22 168 34 L186 40 Q194 44 194 54 L194 62 L8 62 Z', 'M70 27 L84 24 L150 24 Q158 26 162 36 L166 40 L62 41 Z', 1.02],
    van: ['M8 62 L8 30 Q8 22 16 22 L132 22 Q142 22 148 30 L168 42 Q190 44 192 54 L192 62 Z', 'M138 28 L160 40 L138 40 Z M22 28 L60 28 L60 40 L22 40 Z M66 28 L104 28 L104 40 L66 40 Z', 1.06],
    coupe: ['M8 59 L14 49 Q30 45 54 43 L82 27 Q90 23 104 23 L124 23 Q138 24 148 34 L170 42 Q192 46 194 56 L194 62 L8 62 Z', 'M88 31 L104 27 L124 27 Q132 28 138 35 L84 41 Z', 1],
    lux: ['M6 58 L10 46 Q20 42 46 40 L70 24 Q78 20 94 20 L128 20 Q142 20 152 30 L178 38 Q198 42 198 54 L198 62 L6 62 Z', 'M76 27 L94 24 L126 24 Q134 25 140 31 L150 39 L66 40 Z', 1.04],
    super: ['M6 60 L12 52 Q40 47 70 41 L98 28 Q112 24 130 28 L160 40 Q186 44 194 54 L194 62 L6 62 Z', 'M102 32 L114 29 L128 31 L144 40 L96 41 Z', 0.98]
  };
  function car(model, cls, w) {
    const m = CARS[model] || { b: cls === 'S' ? 'super' : cls === 'A' ? 'coupe' : 'sedan', c: '#999' }, B = BODY[m.b], c = m.c, rust = m.f === 'rust', ch = m.f === 'chrome' || m.f === 'gold', gold = m.f === 'gold';
    const big = m.b === 'lux' || m.b === 'super' || m.b === 'coupe', wr = big ? 13 : rust ? 11 : 12, tr = rust ? '#2a2a2a' : '#111', rim = rust ? '#6e7480' : ch ? '#e6e9ee' : '#aab2bd';
    let x = `<ellipse cx="100" cy="68" rx="88" ry="5" fill="#000" opacity=".28"/><path d="${B[0]}" fill="${c}" stroke="#fff" stroke-opacity=".16" stroke-width="1"/>`;
    x += `<path d="${B[0]}" fill="#fff" opacity=".10" transform="translate(0,-.6)" clip-path="inset(0 0 60% 0)"/><path d="M10 54 H192" stroke="#000" stroke-opacity=".2" stroke-width="2"/>`;
    if (m.f === 'stripe') x += '<path d="M60 40 L150 40 L150 44 L60 44 Z" fill="#c8102e" opacity=".9"/>';
    if (m.f === 'duo') x += `<path d="M96 41 L190 48 L194 56 L194 62 L96 62 Z" fill="#c9a43a" opacity=".85"/>`;
    x += `<path d="${B[1]}" fill="#0d1520" opacity=".88"/><path d="${B[1]}" fill="#9bd" opacity=".13"/>`;
    if (rust) x += `<g opacity=".85"><ellipse cx="46" cy="52" rx="13" ry="5" fill="#8a4b22"/><ellipse cx="112" cy="55" rx="9" ry="4" fill="#6b3a1b"/><ellipse cx="158" cy="48" rx="7" ry="4" fill="#9a5a2a"/><path d="M80 44 l6 4 l-3 5 z" fill="#7a431f"/><rect x="20" y="57" width="26" height="3" fill="#5a3418"/></g><path d="M100 28 V58" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`;
    else x += '<path d="M100 29 V56" stroke="#000" stroke-opacity=".16" stroke-width="1.4"/>';
    if (ch) x += `<path d="M14 56 H190" stroke="${gold ? '#e6c25a' : '#dfe3ea'}" stroke-width="2.4" opacity=".95"/><rect x="190" y="49" width="6" height="9" rx="1.5" fill="${gold ? '#e6c25a' : '#dfe3ea'}"/>`;
    if (m.b === 'super') x += `<path d="M6 40 H30 V44 H6 Z M16 44 V52" fill="${c}" stroke="#000" stroke-opacity=".4" stroke-width="2"/>`;
    if (m.b === 'van') x += '<path d="M10 24 H130" stroke="#555" stroke-width="3"/>';
    x += big ? `<rect x="184" y="50" width="12" height="3.2" rx="1.5" fill="#fff6c8"/><rect x="4" y="51" width="8" height="3" rx="1.5" fill="#ff3b3b"/>` : `<rect x="186" y="50" width="7" height="5" rx="2.4" fill="${rust ? '#d9c98a' : '#ffe9a3'}"/><rect x="6" y="50" width="6" height="5" rx="2" fill="#e5484d"/>`;
    for (const cx of [48, 152]) x += `<circle cx="${cx}" cy="62" r="${wr}" fill="${tr}"/><circle cx="${cx}" cy="62" r="${wr - 5}" fill="${rim}"/>` + (big || ch ? `<path d="M${cx} ${62 - wr + 5} V${62 + wr - 5} M${cx - wr + 5} 62 H${cx + wr - 5}" stroke="#555" stroke-width="1.2"/>` : '');
    return `<svg class="dv-car" viewBox="0 0 200 76" ${w ? `width="${w}"` : ''} aria-hidden="true">${x}</svg>`;
  }
  const PARTS = [['engine', 'Двигатель', '+2% к силе за уровень'], ['tires', 'Шины', '+1,5% за уровень'], ['turbo', 'Турбина', '+2,5% за уровень']];
  const S = { tab: 'race', st: null, plate: null, busy: false };
  let tick = null;

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
    b.innerHTML = head() + `<div class="pl-sec">Мои машины · ${s.cars.length}</div>` + s.cars.map(c => `<div class="ev-card dv-gc ${c.id === s.sel ? 'sel' : ''}" data-c="${c.id}"><div class="dv-gt">${car(c.model, c.cls, 110)}<div><b>${E(c.name)}</b><small>${CLN[c.cls]} · рейтинг ${c.rating}</small>${c.id === s.sel ? '<small class="dv-on">Выбрана для заездов</small>' : '<button class="ev-btn ghost sm" data-sel="' + c.id + '">Выбрать</button>'}</div></div>
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
    b.innerHTML = head() + `<div class="pl-sec">Автосалон</div>` + s.models.map(m => { const lock = s.level < m.lvl, cant = !lock && s.rub < m.price; return `<div class="ev-card dv-sh ${lock ? 'lock' : ''}"><div class="dv-gt">${car(m.id, m.cls, 110)}<div><b>${E(m.name)}</b><small>${CLN[m.cls]} · рейтинг ${m.rating}${m.owned ? ' · у вас ' + m.owned : ''}</small><small>${lock ? 'Нужен уровень ' + m.lvl : fm(m.price) + ' ₽'}</small></div></div><button class="ev-btn ${lock || cant ? 'ghost' : ''}" data-b="${m.id}" ${lock ? 'disabled' : ''}>${lock ? 'Уровень ' + m.lvl : 'Купить за ' + fm(m.price) + ' ₽'}</button></div>`; }).join('');
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
          `<div class="gh-grid">${tile('city', 'Автоград', 'Открытый город: езжайте на своей машине, собирайте монеты, заезжайте в салон, гараж и на заезды', ic('map'), 1)}${tile('drive', 'Автомир', 'Заезды, тюнинг, задания и уровни', ic('car'))}${tile('plates', 'Рулетка номеров', 'Крутите номера и собирайте коллекцию', ic('ticket'))}${tile('garage', 'Гараж номеров', 'Номера приносят рубли', ic('home'))}${tile('mini', 'Мини-игры', '2048, змейка, слоты и другие', ic('dice'))}${tile('tour', 'Турниры', 'Рейтинг и награды', ic('cup'))}</div>`;
        w.onclick = e => { const x = e.target.closest('[data-g]'); if (!x) return; const k = x.dataset.g; if (k === 'city') { G(() => PG().close()); setTimeout(() => G(() => window.GoldaPlace.open()), 120); } else if (k === 'drive') open('race'); else if (k === 'plates') G(() => window.GoldaPlates.open('game')); else if (k === 'garage') G(() => window.GoldaPlates.open('gar')); else if (k === 'mini') G(() => window.GAMES_HUB()); else if (k === 'tour') G(() => window.GoldaEngage.tourney()); };
      }
    });
  }
  const ic = n => ({
    car: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M5 11l1.6-4.3A2 2 0 018.5 5.400h7a2 2 0 011.900 1.300L19 11a2 2 0 011.500 2v4a1 1 0 01-1 1H18a2 2 0 01-4 0h-4a2 2 0 01-4 0H4.500a1 1 0 01-1-1v-4A2 2 0 015 11zm2.200 0h9.600l-1-2.600H8.200z"/></svg>',
    map: '<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M9 3l6 2.200L21 3v15l-6 2.200L9 18l-6 2.200V5.200zm1 2.800v10.700l4 1.500V7.300zM5 7v10.800l3-1.100V6z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4z"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 3l9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"/></svg>',
    dice: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zm2.500 4a1.500 1.500 0 100 3 1.500 1.500 0 000-3zm7 7a1.500 1.500 0 100 3 1.500 1.500 0 000-3z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7 3h10v5a5 5 0 01-4 4.900V16h3v2H8v-2h3v-3.100A5 5 0 017 8zM3 5h3v3a3 3 0 01-3-3zm18 0a3 3 0 01-3 3V5zM6 20h12v2H6z"/></svg>'
  })[n];
  window.GoldaDrive = { open, hub, S, load, CARS, CLS, CLN, car, draw: () => draw() };
})();
