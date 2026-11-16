/* YZITK Chats: номера на машины, рубли, рулетка, гараж, оформление профиля */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const PG = () => window.GoldaPages;
  const fm = n => Number(n || 0).toLocaleString('ru-RU');
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const LS = { g: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const OWNERS = ['03d24548-56f1-4329-a7f0-466c18b8a8c9', '6c02c4d5-c674-432d-9a5c-86e31c465790'];
  const OWN = () => OWNERS.includes(G(() => ME.id));
  const RN = { common: 'Обычный', rare: 'Редкий', expensive: 'Дорогой', epic: 'Эпический', legendary: 'Легендарный', divine: 'Божественный' };
  const RK = Object.keys(RN);
  const RC = { common: '#9aa4b2', rare: '#5aa2ff', expensive: '#4cd37b', epic: '#b07dff', legendary: '#ffb52e', divine: '#ff7be5' };
  const ODDS = { common: '55%', rare: '25%', expensive: '13%', epic: '5%', legendary: '1,65%', divine: '0,35%' };
  const PREM = ['77', '97', '99', '177', '197', '199', '777', '797', '799'];
  const REGIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '82', '83', '86', '87', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99', '102', '113', '116', '121', '123', '124', '125', '126', '134', '136', '138', '142', '147', '150', '152', '154', '159', '161', '163', '164', '173', '174', '177', '178', '186', '190', '193', '196', '197', '199', '277', '702', '716', '725', '750', '761', '763', '777', '790', '797', '799'];
  const RNAME = { '77': 'Москва', '97': 'Москва', '99': 'Москва', '177': 'Москва', '197': 'Москва', '199': 'Москва', '777': 'Москва', '797': 'Москва', '799': 'Москва', '78': 'Санкт-Петербург', '98': 'Санкт-Петербург', '178': 'Санкт-Петербург', '50': 'Московская обл.', '90': 'Московская обл.', '16': 'Татарстан', '116': 'Татарстан', '52': 'Нижегородская обл.', '152': 'Нижегородская обл.', '02': 'Башкортостан', '102': 'Башкортостан', '23': 'Краснодарский край', '93': 'Краснодарский край', '61': 'Ростовская обл.', '161': 'Ростовская обл.', '63': 'Самарская обл.', '163': 'Самарская обл.', '66': 'Свердловская обл.', '96': 'Свердловская обл.', '74': 'Челябинская обл.', '174': 'Челябинская обл.', '54': 'Новосибирская обл.', '154': 'Новосибирская обл.', '24': 'Красноярский край', '124': 'Красноярский край', '36': 'Воронежская обл.', '136': 'Воронежская обл.', '59': 'Пермский край', '159': 'Пермский край', '55': 'Омская обл.', '86': 'ХМАО', '186': 'ХМАО', '25': 'Приморский край', '125': 'Приморский край', '38': 'Иркутская обл.', '138': 'Иркутская обл.', '64': 'Саратовская обл.', '164': 'Саратовская обл.', '34': 'Волгоградская обл.', '134': 'Волгоградская обл.', '26': 'Ставропольский край', '126': 'Ставропольский край', '05': 'Дагестан', '95': 'Чечня', '82': 'Крым', '92': 'Севастополь' };
  const POP = ['77', '78', '50', '16', '52', '02', '23', '61', '63', '66', '74', '54', '24', '36', '59', '55', '86', '25', '38', '64', '34', '26', '05', '82'];
  const BGN = { slate: 'Графит', ocean: 'Океан', forest: 'Лес', sunset: 'Закат', rose: 'Роза', violet: 'Фиалка', graphite: 'Уголь', mint: 'Мята' };
  const FREEBG = ['f_slate', 'f_ocean', 'f_forest', 'f_sunset', 'f_rose', 'f_violet', 'f_graphite', 'f_mint'];

  /* ---------- номер ---------- */
  function parse(s) { const m = String(s || '').match(/^(\S)(\d{3})(\S{2}) (\d{2,3})$/); return m && { a: m[1], d: m[2], b: m[3], r: m[4] }; }
  function plate(p, size) {
    const m = parse(p.plate); if (!m) return '';
    return `<span class="pl pl-${E(p.rarity)} ${size || ''}"><span class="pl-main"><span>${m.a}</span><b>${m.d}</b><span>${m.b}</span></span><span class="pl-reg"><b>${m.r}</b><small>RUS <i></i></small></span></span>`;
  }
  /* то же правило редкости, что и на сервере: нужно для предпросмотра у создателя */
  function rarityOf(p) {
    const m = parse(p); if (!m || m.d === '000') return null; const b = m.b[0], c = m.b[1], pr = PREM.includes(m.r);
    if (['001', '777'].includes(m.d) && m.a === b && b === c && 'КМОХ'.includes(m.a) && ['77', '777', '99', '199', '197'].includes(m.r)) return 'divine';
    if (['777', '001', '007', '999', '888'].includes(m.d) && b === c && pr) return 'legendary';
    if ((/^(\d)\1\1$/.test(m.d) || /^[1-9]00$/.test(m.d)) && pr) return 'epic';
    if (/^(\d)\1\1$/.test(m.d) || /^[1-9]00$/.test(m.d)) return 'expensive';
    if (/^(\d)(\d)\1$/.test(m.d) && m.d[0] !== m.d[1]) return 'rare';
    return 'common';
  }
  const LAT = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' };
  const normPlate = s => String(s || '').toUpperCase().replace(/[ABEKMHOPCTYX]/g, c => LAT[c]).replace(/\s+/g, '');
  const fmtPlate = s => { const m = normPlate(s).match(/^([АВЕКМНОРСТУХ])(\d{3})([АВЕКМНОРСТУХ]{2})(\d{2,3})$/); return m ? m[1] + m[2] + m[3] + ' ' + m[4] : null; };

  /* ---------- состояние ---------- */
  const S = { tab: 'game', st: null, mine: [], shop: null, gar: null, region: LS.g('pl_region') || '', filter: 'all', ownerOpen: LS.g('pl_own_open') === '1', ownerData: null };
  let tick = null;
  const body = () => Q('#plBody');
  const costOf = () => { const st = S.st || {}; return !S.region ? st.cost || 1000 : PREM.includes(S.region) ? st.cost_prem || 2500 : st.cost_region || 1500; };

  async function open() {
    PG().open('plates', {
      title: 'Номера', big: 1, sub: 'Рулетка, гараж и оформление профиля', tab: 'set', async render(b) {
        b.innerHTML = '<div id="plWrap"><div class="pl-seg" id="plSeg"><button data-t="game">Игра</button><button data-t="gar">Гараж</button><button data-t="col">Коллекция</button><button data-t="prof">Профиль</button></div><div id="plBody"></div></div>';
        Q('#plSeg', b).onclick = e => { const x = e.target.closest('[data-t]'); if (x) { S.tab = x.dataset.t; draw(); } };
        await draw(true);
      }
    });
  }
  async function refresh() {
    const [a, c, d, g] = await Promise.all([rpc('pl_state'), rpc('pl_mine'), rpc('deco_shop'), rpc('garage_state')]);
    if (a.data) S.st = a.data; if (c.data) S.mine = c.data; if (d.data) S.shop = d.data; if (g.data) { S.gar = g.data; S.garAt = Date.now(); }
  }
  async function draw(reload) {
    const b = body(); if (!b) return; clearInterval(tick);
    QA('#plSeg button').forEach(x => x.classList.toggle('on', x.dataset.t === S.tab));
    if (reload || !S.st) { b.innerHTML = '<div class="s2empty">Загрузка…</div>'; await refresh(); if (!S.st) { b.innerHTML = '<div class="s2empty">Не удалось загрузить. Проверьте соединение.</div>'; return; } }
    ({ game, gar: garage, col, prof })[S.tab](b);
  }
  const balCard = () => `<div class="ev-card pl-bal"><div><small>Ваши рубли</small><b id="plRub">${fm(S.st.rub)} ₽</b></div><div style="text-align:right"><small>Номеров</small><b id="plCnt">${S.mine.length}</b></div></div>`;
  const setBal = () => { const a = Q('#plRub'), c = Q('#plCnt'); if (a) a.textContent = fm(S.st.rub) + ' ₽'; if (c) c.textContent = S.mine.length; };

  /* ================= ИГРА ================= */
  function regionLabel() { return !S.region ? 'Случайный' : S.region + (RNAME[S.region] ? ' · ' + RNAME[S.region] : ''); }
  function game(b) {
    const st = S.st;
    b.innerHTML = balCard() + `<div class="ev-card"><div class="ev-h">Рулетка номеров</div><div class="ev-sub">Каждый номер на свете только один. Нажмите на номер, чтобы пропустить анимацию.</div>
      <div class="pl-stage" id="plSt"><div class="ev-sub">Нажмите «Крутить»</div></div><div style="text-align:center"><div class="pl-rn" id="plRn"></div><div class="pl-rs" id="plRs"></div></div>
      <div id="plAct"></div>
      <button class="pl-reg-btn" id="plReg"><span><small>Регион</small><b id="plRegT">${E(regionLabel())}</b></span><span class="pl-chev">›</span></button>
      <button class="ev-btn" id="plGo">Крутить · ${fm(costOf())} ₽</button>
      <div class="pl-odds">${RK.map(k => `<span><b style="color:${RC[k]}">${RN[k]}</b> ${ODDS[k]}</span>`).join('')}</div></div>
      <div class="ev-card"><div class="ev-h">Задания на сегодня</div><div class="ev-sub">Обновляются каждый день, за каждое награда в рублях.</div><div style="margin-top:8px">${st.tasks.map(tk => `<div class="pl-task"><div><b>${E(tk.title)}</b><small>${tk.have} / ${tk.goal} · ${fm(tk.rub)} ₽</small></div><button data-task="${tk.id}" ${tk.claimed || tk.have < tk.goal ? 'disabled' : ''}>${tk.claimed ? 'Получено' : tk.have < tk.goal ? 'В процессе' : 'Забрать'}</button></div>`).join('')}</div></div>
      ${OWN() ? '<div id="plOwn"></div>' : ''}`;
    Q('#plGo', b).onclick = spin; Q('#plReg', b).onclick = regionSheet;
    b.onclick = async e => {
      const t = e.target.closest('[data-task]'); if (!t || t.disabled) return; t.disabled = true;
      const r = await rpc('pl_task_claim', { p_task: t.dataset.task });
      if (r.data && r.data.ok) { tst('+' + fm(r.data.rub) + ' ₽'); await refresh(); draw(); } else { tst('Задание ещё не выполнено', 'red'); t.disabled = false; }
    };
    if (OWN()) ownerPanel(Q('#plOwn', b));
  }
  function regionSheet() {
    const st = S.st, c1 = st.cost_region || 1500, c2 = st.cost_prem || 2500, c0 = st.cost || 1000;
    const chip = r => `<button class="pl-rc ${S.region === r ? 'on' : ''}" data-r="${r}">${r}${RNAME[r] ? '<small>' + E(RNAME[r]) + '</small>' : ''}</button>`;
    PG().sheet(`<h3>Регион номера</h3><div class="ev-sub">Случайный регион: ${fm(c0)} ₽. Выбранный: ${fm(c1)} ₽, а в регионах со звездой ${fm(c2)} ₽. Эпические и выше выпадают только в регионах со звездой. В остальных потолок «дорогой».</div>
      <input class="s2in" id="rgQ" inputmode="numeric" placeholder="Найти регион: 16, Москва…" autocomplete="off" style="margin:12px 0 6px">
      <div class="pl-rgs" id="rgL"></div>`, (ov, close) => {
      const L = Q('#rgL', ov);
      const paint = () => {
        const q = Q('#rgQ', ov).value.trim().toLowerCase(); const ok = r => !q || r.includes(q) || (RNAME[r] || '').toLowerCase().includes(q);
        const prem = PREM.filter(ok), pop = POP.filter(r => !PREM.includes(r) && ok(r)), rest = REGIONS.filter(r => !PREM.includes(r) && !POP.includes(r) && ok(r));
        L.innerHTML = (!q ? `<button class="pl-rc wide ${!S.region ? 'on' : ''}" data-r="">Случайный регион<small>${fm(c0)} ₽ · все редкости</small></button>` : '') +
          (prem.length ? `<div class="pl-sec">⭐ Столичные · ${fm(c2)} ₽</div><div class="pl-rg">${prem.map(chip).join('')}</div>` : '') +
          (pop.length ? `<div class="pl-sec">Популярные · ${fm(c1)} ₽</div><div class="pl-rg">${pop.map(chip).join('')}</div>` : '') +
          (rest.length ? `<div class="pl-sec">Остальные · ${fm(c1)} ₽</div><div class="pl-rg">${rest.map(chip).join('')}</div>` : '') || '<div class="s2empty">Не найдено</div>';
      };
      paint(); Q('#rgQ', ov).oninput = paint;
      L.onclick = e => { const x = e.target.closest('[data-r]'); if (!x) return; S.region = x.dataset.r; LS.s('pl_region', S.region); close(); const t = Q('#plRegT'), g = Q('#plGo'); if (t) t.textContent = regionLabel(); if (g) g.textContent = 'Крутить · ' + fm(costOf()) + ' ₽'; };
    });
  }

  /* анимация: символы встают на место по одному */
  function shell(d) {
    const m = parse(d.plate), sl = (c, t) => `<u class="sl" data-t="${t}" data-c="${c}"></u>`;
    return `<span class="pl xl pl-spin"><span class="pl-main">${sl(m.a, 'L')}<b>${sl(m.d[0], 'D')}${sl(m.d[1], 'D')}${sl(m.d[2], 'D')}</b>${sl(m.b[0], 'L')}${sl(m.b[1], 'L')}</span><span class="pl-reg"><b>${[...m.r].map(c => sl(c, 'D')).join('')}</b><small>RUS <i></i></small></span></span>`;
  }
  function reveal(stg, d) {
    return new Promise(res => {
      stg.innerHTML = shell(d); const pl = Q('.pl', stg), sls = QA('.sl', stg), hot = ['legendary', 'divine'].includes(d.rarity);
      const L = 'АВЕКМНОРСТУХ', D = '0123456789', rnd = t => { const s = t === 'L' ? L : D; return s[Math.random() * s.length | 0]; };
      const gaps = [650, 600, 600, 650, 800, 900, 1050, 1250, 1500]; let at = 0; const sched = [];
      sls.forEach((s, i) => { at += gaps[i] || 1200; if (hot && i >= sls.length - 2) at += 700; sched.push(at); });
      const t0 = performance.now(); let done = false, locked = 0;
      const fin = () => {
        if (done) return; done = true; clearInterval(iv); sls.forEach(s => { s.textContent = s.dataset.c; s.classList.add('lk'); });
        pl.classList.remove('pl-spin', 'pl-hot'); pl.classList.add('pl-' + d.rarity, 'pl-in'); stg.onclick = null; res();
      };
      const iv = setInterval(() => {
        const t = performance.now() - t0;
        sls.forEach((s, i) => { if (t >= sched[i]) { if (!s.classList.contains('lk')) { s.textContent = s.dataset.c; s.classList.add('lk'); locked++; try { navigator.vibrate && navigator.vibrate(12); } catch (e) { } if (hot && locked >= sls.length - 2) pl.classList.add('pl-hot'); } } else s.textContent = rnd(s.dataset.t); });
        if (t >= sched[sls.length - 1] + 250) fin();
      }, 55);
      stg.onclick = fin;   // нажатие: показать сразу
    });
  }
  async function spin() {
    const go = Q('#plGo'), stg = Q('#plSt'), rn = Q('#plRn'), rs = Q('#plRs'), act = Q('#plAct'); if (!go || go.disabled) return;
    go.disabled = true; act.innerHTML = ''; rn.textContent = ''; rs.textContent = ''; rn.style.color = '';
    const r = await rpc('pl_roll', { p_region: S.region || null });
    if (!r.data || !r.data.ok) {
      go.disabled = false; const er = r.data && r.data.error;
      tst(er === 'no_money' ? 'Не хватает рублей. Выполните задания или выберите случайный регион.' : er === 'taken' ? 'Этот номер уже занят' : 'Не получилось прокрутить', 'red'); return;
    }
    const d = r.data; S.st.rub = d.rub; S.mine.unshift({ id: d.id, plate: d.plate, rarity: d.rarity, value: d.value }); S.st.spins++; setBal();
    await reveal(stg, d);
    if (!Q('#plSt')) return;
    rn.style.color = RC[d.rarity]; rn.textContent = RN[d.rarity]; rs.textContent = 'Цена при продаже ' + fm(d.value) + ' ₽';
    if (['legendary', 'divine'].includes(d.rarity)) { G(() => window.LIVE && LIVE.confetti && LIVE.confetti(d.rarity === 'divine' ? 220 : 120)); try { navigator.vibrate && navigator.vibrate([40, 40, 90]); } catch (e) { } }
    act.innerHTML = `<div class="pl-two"><button class="ev-btn ghost" id="plEq">В профиль</button><button class="ev-btn ghost" id="plSl">Продать за ${fm(d.value)} ₽</button></div>`;
    Q('#plEq').onclick = async () => { if (await equip({ plate: d.id })) { tst('Номер в профиле'); Q('#plEq').disabled = true; } };
    Q('#plSl').onclick = async () => { if (!confirm('Продать ' + d.plate + ' за ' + fm(d.value) + ' ₽?')) return; if (await sell(d.id)) { act.innerHTML = ''; stg.innerHTML = '<div class="ev-sub">Номер продан</div>'; rn.textContent = ''; rs.textContent = ''; } };
    go.disabled = false;
  }
  async function sell(id) {
    const r = await rpc('pl_sell', { p_id: id });
    if (r.data && r.data.ok) { S.st.rub += r.data.rub; S.mine = S.mine.filter(x => x.id !== id); tst('+' + fm(r.data.rub) + ' ₽'); setBal(); return true; }
    tst(r.data && r.data.error === 'equipped' ? 'Сначала снимите номер с профиля' : 'Не получилось продать', 'red'); return false;
  }
  async function equip(patch) {
    const d = Object.assign({ plate: S.shop && S.shop.plate, bg: S.shop && S.shop.bg, frame: S.shop && S.shop.frame, title: S.shop && S.shop.title }, patch);
    const r = await rpc('deco_set', { p_plate: d.plate || null, p_bg: d.bg || '', p_frame: d.frame || '', p_title: d.title || '' });
    if (r.data && r.data.ok) { if (S.shop) Object.assign(S.shop, d); S.mine.forEach(x => x.equipped = x.id === d.plate); decorateOwn(); return true; }
    tst('Не получилось применить', 'red'); return false;
  }

  /* ================= ПАНЕЛЬ СОЗДАТЕЛЯ ================= */
  async function ownerPanel(el) {
    if (!el) return;
    const head = `<button class="pl-own-h" id="ownT"><span>🔧 Панель создателя</span><span class="pl-chev ${S.ownerOpen ? 'up' : ''}">›</span></button>`;
    if (!S.ownerOpen) { el.innerHTML = `<div class="ev-card pl-own">${head}</div>`; Q('#ownT', el).onclick = () => { S.ownerOpen = true; LS.s('pl_own_open', '1'); ownerPanel(el); }; return; }
    el.innerHTML = `<div class="ev-card pl-own">${head}<div class="s2empty">Загрузка…</div></div>`; Q('#ownT', el).onclick = () => { S.ownerOpen = false; LS.s('pl_own_open', '0'); ownerPanel(el); };
    const [rg, ss] = await Promise.all([rpc('owner_pl_rig_get'), rpc('owner_pl_stats')]); const rig = rg.data || {}, ps = ss.data || {};
    const users = (G(() => USERS) || []).filter(u => u && u.id && !/^00000000-0000-4000-8000-0000000/.test(u.id)); const me = G(() => ME); if (me && !users.some(u => u.id === me.id)) users.unshift(me);
    let pick = me, rar = '';
    const nm = u => (u.id === me.id ? 'Я · ' : '') + (u.display_name || u.username || 'Пользователь');
    const rigLine = rig.plate ? `Подкручено: <b>${E(rig.plate)}</b> (${RN[rig.rarity]})` : rig.rarity ? `Подкручено: <b style="color:${RC[rig.rarity]}">${RN[rig.rarity]}</b>` : 'Следующая прокрутка обычная';
    el.querySelector('.pl-own').innerHTML = head + `
      <div class="pl-sec" style="margin-top:6px">Подкрутка номера</div>
      <div class="ev-sub" id="ownRig">${rigLine}${rig.plate || rig.rarity ? ' · <a href="#" id="ownClr">отменить</a>' : ''}</div>
      <input class="s2in" id="ownP" placeholder="Свой номер: А777АА 77 (латиница тоже можно)" autocomplete="off" style="margin-top:10px">
      <div class="pl-ownprev" id="ownPv"></div>
      <div class="pl-chips" id="ownR">${RK.map(k => `<button data-k="${k}" style="--c:${RC[k]}">${RN[k]}</button>`).join('')}</div>
      <div class="pl-two"><button class="ev-btn" id="ownRigBtn">Подкрутить прокрутку</button><button class="ev-btn ghost" id="ownGive">Выдать себе сразу</button></div>
      <div class="pl-sec">Рубли</div>
      <div class="pl-pick" id="ownU"></div><input class="s2in" id="ownQ" placeholder="Поиск пользователя" autocomplete="off"><div class="pl-ul" id="ownL"></div>
      <input class="s2in" id="ownA" inputmode="numeric" placeholder="Сколько рублей" autocomplete="off" style="margin-top:8px">
      <div class="pl-two"><button class="ev-btn" id="ownGr">Выдать</button><button class="ev-btn ghost" id="ownTk">Забрать</button></div>
      <div class="pl-sec">Статистика игры</div>
      <div class="pl-stats"><div><b>${fm(ps.players)}</b><small>игроков</small></div><div><b>${fm(ps.spins)}</b><small>прокруток</small></div><div><b>${fm(ps.plates)}</b><small>номеров</small></div><div><b>${fm(ps.rub)}</b><small>рублей в обороте</small></div></div>
      <div class="pl-odds" style="margin-top:8px">${RK.map(k => `<span><b style="color:${RC[k]}">${RN[k]}</b> ${fm((ps.by || {})[k] || 0)}</span>`).join('')}</div>
      ${(ps.top || []).map((x, i) => `<div class="pl-task" style="padding:8px 2px"><div><b>${i + 1}. ${E(x.name)}</b><small>${x.n} номеров · стоимость ${fm(x.v)} ₽</small></div></div>`).join('')}`;
    const root = el, P = Q('#ownP', root), PV = Q('#ownPv', root);
    Q('#ownT', root).onclick = () => { S.ownerOpen = false; LS.s('pl_own_open', '0'); ownerPanel(el); };
    const clr = Q('#ownClr', root); if (clr) clr.onclick = async e => { e.preventDefault(); await rpc('owner_pl_rig', { p_plate: '', p_rarity: '' }); tst('Подкрутка снята'); ownerPanel(el); };
    P.oninput = () => { const f = fmtPlate(P.value); const r = f && rarityOf(f); PV.innerHTML = f ? plate({ plate: f, rarity: r }, 'md') + `<small style="color:${RC[r]}">${RN[r]}</small>` : (P.value ? '<small>Формат: буква, 3 цифры, 2 буквы и регион. Буквы: А В Е К М Н О Р С Т У Х</small>' : ''); if (f) { rar = ''; QA('#ownR button', root).forEach(x => x.classList.remove('on')); } };
    Q('#ownR', root).onclick = e => { const x = e.target.closest('[data-k]'); if (!x) return; rar = rar === x.dataset.k ? '' : x.dataset.k; QA('#ownR button', root).forEach(y => y.classList.toggle('on', y.dataset.k === rar)); if (rar) { P.value = ''; PV.innerHTML = ''; } };
    const ER = { format: 'Неверный номер', taken: 'Такой номер уже занят', rarity: 'Выберите редкость', forbidden: 'Недоступно' };
    Q('#ownRigBtn', root).onclick = async () => {
      const f = P.value ? fmtPlate(P.value) : ''; if (P.value && !f) return tst('Неверный номер', 'red'); if (!f && !rar) return tst('Введите номер или выберите редкость', 'red');
      const r = await rpc('owner_pl_rig', { p_plate: f || '', p_rarity: f ? '' : rar }); if (r.data && r.data.ok) { tst('Следующая прокрутка подкручена'); ownerPanel(el); } else tst(ER[r.data && r.data.error] || 'Ошибка', 'red');
    };
    Q('#ownGive', root).onclick = async () => {
      const f = P.value ? fmtPlate(P.value) : ''; if (P.value && !f) return tst('Неверный номер', 'red'); if (!f && !rar) return tst('Введите номер или выберите редкость', 'red');
      const r = await rpc('owner_pl_give', { p_user: me.id, p_plate: f || '', p_rarity: f ? '' : rar }); if (r.data && r.data.ok) { tst('Выдан номер ' + r.data.plate); await refresh(); setBal(); ownerPanel(el); } else tst(ER[r.data && r.data.error] || 'Ошибка', 'red');
    };
    const U = Q('#ownU', root), L = Q('#ownL', root), qi = Q('#ownQ', root), A = Q('#ownA', root);
    const drawP = () => { U.innerHTML = `<div class="pl-pk">${G(() => avatarHTML(pick, 's')) || ''}<b>${E(nm(pick))}</b></div>`; };
    const drawL = () => { const q = qi.value.trim().toLowerCase(); L.innerHTML = q ? users.filter(u => nm(u).toLowerCase().includes(q) || String(u.username || '').toLowerCase().includes(q)).slice(0, 8).map(u => `<button data-u="${E(u.id)}">${G(() => avatarHTML(u, 's')) || ''}<span>${E(nm(u))}<small>@${E(u.username || '')}</small></span></button>`).join('') || '<div class="s2empty">Никого не нашли</div>' : ''; };
    drawP(); qi.oninput = drawL; L.onclick = e => { const x = e.target.closest('[data-u]'); if (!x) return; pick = users.find(u => u.id === x.dataset.u); qi.value = ''; drawP(); drawL(); };
    A.oninput = () => { A.value = A.value.replace(/\D/g, '').slice(0, 12); };
    const money = async (fn, ok) => { const v = +A.value; if (!v) return tst('Введите сумму', 'red'); const r = await rpc(fn, { p_user: pick.id, p_amount: v }); if (r.data && r.data.ok) { tst(ok(r.data, v)); A.value = ''; if (pick.id === me.id) { await refresh(); setBal(); } } else tst('Не получилось', 'red'); };
    Q('#ownGr', root).onclick = () => money('owner_grant_rub', (d, v) => 'Выдано ' + fm(v) + ' ₽ · ' + nm(pick));
    Q('#ownTk', root).onclick = () => money('owner_take_rub', d => 'Забрано ' + fm(d.taken) + ' ₽');
  }

  /* ================= ГАРАЖ ================= */
  function garage(b) {
    const g = S.gar; if (!g) { b.innerHTML = '<div class="s2empty">Гараж недоступен</div>'; return; }
    const free = g.slots - g.parked.length;
    const pend = () => Math.min(g.max, g.pending + g.per_hour * ((Date.now() - S.garAt) / 3600000));
    const nx = g.next;
    b.innerHTML = balCard() + `<div class="ev-card gr-card"><div class="gr-top"><div class="gr-door"><i></i><i></i><i></i><i></i></div><div><div class="ev-h">Ваш гараж</div><div class="ev-sub">Уровень ${g.level} из 10 · ${g.slots} мест</div></div></div>
      <div class="gr-stats"><div><b>${fm(g.per_hour)} ₽</b><small>в час</small></div><div><b>${(+g.rate).toLocaleString('ru-RU')}%</b><small>от цены номера в час</small></div><div><b>${g.cap} ч</b><small>копится максимум</small></div></div>
      <div class="gr-bar"><i id="grFill"></i></div><div class="gr-bt"><span id="grPend"></span><span>из ${fm(g.max)} ₽</span></div>
      <button class="ev-btn" id="grGet">Забрать</button></div>
      <div class="pl-sec">Припаркованные номера · ${g.parked.length} из ${g.slots}</div>
      <div class="pl-slots">${g.parked.map(p => `<button class="pl-slot" data-un="${p.id}">${plate(p, 'sm')}<b style="color:${RC[p.rarity]}">${RN[p.rarity]}</b><small>+${fm(p.per_hour)} ₽ в час</small></button>`).join('')}${Array.from({ length: Math.max(0, free) }, () => '<button class="pl-slot empty" data-add="1"><span>+</span><small>Поставить номер</small></button>').join('')}</div>
      ${nx ? `<div class="ev-card" style="margin-top:12px"><div class="ev-h">Улучшить до уровня ${nx.level}</div><div class="gr-up"><div><small>Места</small><b>${g.slots} → ${nx.slots}</b></div><div><small>Доход</small><b>${(+g.rate).toLocaleString('ru-RU')}% → ${(+nx.rate).toLocaleString('ru-RU')}%</b></div><div><small>Хранилище</small><b>${g.cap} → ${nx.cap} ч</b></div></div><button class="ev-btn" id="grUp">Улучшить за ${fm(nx.cost)} ₽</button></div>` : '<div class="ev-card"><div class="ev-sub">Максимальный уровень гаража. Вы построили лучшее.</div></div>'}`;
    const paint = () => { const p = pend(), f = Q('#grFill'), t = Q('#grPend'), bt = Q('#grGet'); if (!f) { clearInterval(tick); return; } f.style.width = (g.max ? Math.min(100, p / g.max * 100) : 0) + '%'; t.textContent = fm(Math.floor(p)) + ' ₽'; bt.disabled = Math.floor(p) < 1; bt.textContent = Math.floor(p) < 1 ? (g.parked.length ? 'Пока нечего забирать' : 'Поставьте номера в гараж') : 'Забрать ' + fm(Math.floor(p)) + ' ₽'; };
    paint(); tick = setInterval(paint, 1000);
    Q('#grGet').onclick = async () => { const r = await rpc('garage_collect'); if (r.data && r.data.ok) { tst('+' + fm(r.data.rub) + ' ₽'); await refresh(); draw(); } else tst('Пока нечего забирать', 'red'); };
    const up = Q('#grUp'); if (up) up.onclick = async () => { if (!confirm('Улучшить гараж за ' + fm(nx.cost) + ' ₽?')) return; const r = await rpc('garage_upgrade'); if (r.data && r.data.ok) { tst('Гараж улучшен до уровня ' + r.data.level); await refresh(); draw(); } else tst(r.data && r.data.error === 'no_money' ? 'Не хватает рублей' : 'Не получилось', 'red'); };
    b.onclick = async e => {
      const un = e.target.closest('[data-un]'), ad = e.target.closest('[data-add]');
      if (un) { const r = await rpc('garage_park', { p_plate: un.dataset.un, p_on: false }); if (r.data && r.data.ok) { await refresh(); draw(); } }
      else if (ad) {
        const list = S.mine.filter(p => !p.parked); if (!list.length) return tst('Свободных номеров нет. Выбейте новые в рулетке.', 'red');
        PG().sheet(`<h3>Поставить в гараж</h3><div class="ev-sub">Номер приносит рубли, пока стоит в гараже. Чем он дороже, тем больше доход.</div><div class="pl-grid" style="margin-top:12px">${list.map(p => `<button class="pl-cell" data-id="${p.id}">${plate(p, 'sm')}<b style="color:${RC[p.rarity]}">${RN[p.rarity]}</b><small>+${fm(Math.floor(p.value * g.rate / 100))} ₽ в час</small></button>`).join('')}</div>`, (ov, close) => {
          ov.onclick = async ev => { const c = ev.target.closest('[data-id]'); if (!c) return; const r = await rpc('garage_park', { p_plate: c.dataset.id, p_on: true }); close(); if (r.data && r.data.ok) { await refresh(); draw(); } else tst(r.data && r.data.error === 'full' ? 'В гараже нет мест' : 'Не получилось', 'red'); };
        });
      }
    };
  }

  /* ================= КОЛЛЕКЦИЯ ================= */
  function col(b) {
    const eq = S.shop && S.shop.plate; const list = S.mine.filter(p => S.filter === 'all' || p.rarity === S.filter);
    b.innerHTML = balCard() + `<div class="pl-chips flt" id="plFlt"><button data-k="all" class="${S.filter === 'all' ? 'on' : ''}">Все ${S.mine.length}</button>${RK.filter(k => S.mine.some(p => p.rarity === k)).map(k => `<button data-k="${k}" class="${S.filter === k ? 'on' : ''}" style="--c:${RC[k]}">${RN[k]} ${S.mine.filter(p => p.rarity === k).length}</button>`).join('')}</div>` +
      (list.length ? `<div class="pl-grid">${list.map(p => `<button class="pl-cell ${p.id === eq ? 'eq' : ''}" data-id="${p.id}">${plate(p, 'sm')}<b style="color:${RC[p.rarity]}">${RN[p.rarity]}</b><small>${p.id === eq ? 'В профиле' : p.parked ? 'В гараже' : fm(p.value) + ' ₽'}</small></button>`).join('')}</div>` : `<div class="ev-card"><div class="ev-sub">${S.mine.length ? 'С такой редкостью номеров нет.' : 'Пока нет номеров. Прокрутите рулетку на вкладке «Игра».'}</div></div>`);
    Q('#plFlt', b).onclick = e => { const x = e.target.closest('[data-k]'); if (x) { S.filter = x.dataset.k; col(b); } };
    b.onclick = e => {
      const c = e.target.closest('[data-id]'); if (!c) return; const p = S.mine.find(x => x.id === c.dataset.id); if (!p) return; const on = S.shop && S.shop.plate === p.id;
      PG().sheet(`<div class="pl-sh" style="text-align:center">${plate(p, 'lg')}<div class="ev-h" style="color:${RC[p.rarity]}">${RN[p.rarity]}</div><div class="ev-sub">Цена продажи ${fm(p.value)} ₽</div></div><button class="ev-btn" id="a1">${on ? 'Снять с профиля' : 'Повесить в профиль'}</button><button class="ev-btn ghost" id="a3">${p.parked ? 'Убрать из гаража' : 'Поставить в гараж'}</button><button class="ev-btn ghost" id="a2">Продать</button>`, (ov, close) => {
        Q('#a1', ov).onclick = async () => { close(); await equip({ plate: on ? null : p.id }); draw(); };
        Q('#a3', ov).onclick = async () => { close(); const r = await rpc('garage_park', { p_plate: p.id, p_on: !p.parked }); if (r.data && r.data.ok) { await refresh(); draw(); } else tst(r.data && r.data.error === 'full' ? 'В гараже нет мест' : 'Не получилось', 'red'); };
        Q('#a2', ov).onclick = async () => { close(); if (!confirm('Продать ' + p.plate + ' за ' + fm(p.value) + ' ₽?')) return; await sell(p.id); draw(); };
      });
    };
  }

  /* ================= ПРОФИЛЬ: оформление ================= */
  const bgClass = id => 'dc-bg-' + String(id).replace(/^[a-z]+_/, '');
  function bgStyle(v) { const m = /^c:(#[0-9a-fA-F]{6}),(#[0-9a-fA-F]{6})$/.exec(v || ''); return m ? `linear-gradient(160deg,${m[1]},${m[2]})` : ''; }
  function prof(b) {
    const sh = S.shop || {}, items = sh.items || [], eqPl = S.mine.find(x => x.id === sh.plate), me = G(() => ME) || {};
    const ttl = id => (items.find(x => x.id === id) || {}).name || '';
    const cust = /^c:/.test(sh.bg || '') ? sh.bg.slice(2).split(',') : ['#3a2a7a', '#0f6a8a'];
    const tile = (it, kind) => { const on = sh[kind] === it.id; return `<button class="pl-tile ${on ? 'on' : ''}" data-it="${it.id}" data-k="${kind}"><span class="pl-sw ${kind === 'bg' ? bgClass(it.id) : ''}">${kind === 'frame' ? `<span class="dc-ring dc-fr-${it.id.split('_')[1]}" style="width:34px;height:34px;background:var(--p2)"></span>` : kind === 'title' ? '🏷' : ''}</span><b>${E(it.name)}</b><small>${it.owned ? (on ? 'Выбрано' : 'Куплено') : fm(it.price) + ' ₽'}</small></button>`; };
    const freeTile = id => { const on = sh.bg === id; return `<button class="pl-tile ${on ? 'on' : ''}" data-free="${id}"><span class="pl-sw ${bgClass(id)}"></span><b>${BGN[id.slice(2)]}</b><small>${on ? 'Выбрано' : 'Бесплатно'}</small></button>`; };
    const none = (kind, label) => `<button class="pl-tile ${!sh[kind] ? 'on' : ''}" data-none="${kind}"><span class="pl-sw none">∅</span><b>${label}</b><small>${!sh[kind] ? 'Выбрано' : ' '}</small></button>`;
    const bgv = bgStyle(sh.bg), bgc = sh.bg && !/^c:/.test(sh.bg) ? bgClass(sh.bg) : '';
    b.innerHTML = balCard() + `<div class="pl-prev dc-bg ${bgc}" id="plPrev" style="${bgv ? 'background:' + bgv + '!important' : (!bgc ? 'background:var(--p1)!important' : '')}"><span class="dc-ring ${sh.frame ? 'dc-fr-' + sh.frame.split('_')[1] : ''}" style="${sh.frame ? '' : '--rc:none'}">${G(() => avatarHTML(ME, 'l')) || ''}</span><div class="pn">${E(me.display_name || me.username || '')}</div>${sh.title ? `<div class="dc-ttl">${E(ttl(sh.title))}</div>` : ''}<div class="pp">${eqPl ? plate(eqPl, 'lg') : '<span class="ev-sub">Номер не выбран</span>'}</div></div>
      <div class="pl-sec">Номер в профиле</div><button class="pl-reg-btn" id="plPickPl"><span><small>Выбран</small><b>${eqPl ? E(eqPl.plate) : 'Нет'}</b></span><span class="pl-chev">›</span></button>
      <div class="pl-sec">Фон · бесплатные</div><div class="pl-tiles">${none('bg', 'Без фона')}${FREEBG.map(freeTile).join('')}</div>
      <div class="pl-sec">Свой фон</div><div class="ev-card pl-cust"><div class="pl-cc"><label>Цвет 1<input type="color" id="cc1" value="${cust[0]}"></label><label>Цвет 2<input type="color" id="cc2" value="${cust[1]}"></label><div class="pl-cprev" id="ccP" style="background:linear-gradient(160deg,${cust[0]},${cust[1]})"></div></div><button class="ev-btn" id="ccGo">Применить свой фон</button></div>
      <div class="pl-sec">Фон · редкие</div><div class="pl-tiles">${items.filter(i => i.kind === 'bg').map(i => tile(i, 'bg')).join('')}</div>
      <div class="pl-sec">Рамка аватара</div><div class="pl-tiles">${none('frame', 'Без рамки')}${items.filter(i => i.kind === 'frame').map(i => tile(i, 'frame')).join('')}</div>
      <div class="pl-sec">Титул под именем</div><div class="pl-tiles">${none('title', 'Без титула')}${items.filter(i => i.kind === 'title').map(i => tile(i, 'title')).join('')}</div>`;
    const cc1 = Q('#cc1'), cc2 = Q('#cc2'), pv = Q('#ccP'); const up = () => pv.style.background = `linear-gradient(160deg,${cc1.value},${cc2.value})`; cc1.oninput = up; cc2.oninput = up;
    Q('#ccGo').onclick = async () => { if (await equip({ bg: `c:${cc1.value},${cc2.value}` })) { tst('Фон применён'); prof(b); } };
    Q('#plPickPl').onclick = () => {
      if (!S.mine.length) return tst('Сначала выбейте номер в рулетке', 'red');
      PG().sheet(`<h3>Номер в профиле</h3><div class="pl-grid" style="margin-top:12px">${S.mine.map(p => `<button class="pl-cell ${p.id === sh.plate ? 'eq' : ''}" data-id="${p.id}">${plate(p, 'sm')}<b style="color:${RC[p.rarity]}">${RN[p.rarity]}</b></button>`).join('')}</div>${sh.plate ? '<button class="ev-btn ghost" id="plNoPl">Убрать номер</button>' : ''}`, (ov, close) => {
        ov.onclick = async ev => { const c = ev.target.closest('[data-id]'), n = ev.target.closest('#plNoPl'); if (!c && !n) return; close(); if (await equip({ plate: c ? c.dataset.id : null })) prof(b); };
      });
    };
    b.onclick = async e => {
      const t = e.target.closest('.pl-tile'); if (!t) return;
      if (t.dataset.none) { if (await equip({ [t.dataset.none]: null })) prof(b); return; }
      if (t.dataset.free) { if (await equip({ bg: sh.bg === t.dataset.free ? null : t.dataset.free })) prof(b); return; }
      const it = items.find(x => x.id === t.dataset.it), k = t.dataset.k; if (!it) return;
      if (!it.owned) {
        if (S.st.rub < it.price) return tst('Не хватает рублей: нужно ' + fm(it.price) + ' ₽', 'red');
        if (!confirm('Купить «' + it.name + '» за ' + fm(it.price) + ' ₽?')) return;
        const r = await rpc('deco_buy', { p_item: it.id }); if (!(r.data && r.data.ok)) return tst('Не получилось купить', 'red');
        it.owned = true; S.st.rub = r.data.rub; tst('Куплено');
      }
      if (await equip({ [k]: sh[k] === it.id ? null : it.id })) prof(b);
    };
  }

  /* ---------- отображение в чужих профилях ---------- */
  function clean(el) { if (!el) return; QA('*', el).length; [...el.classList].filter(c => /^dc-/.test(c)).forEach(c => el.classList.remove(c)); el.style.removeProperty('background'); }
  function applyTo(card, ava, nameEl, d) {
    clean(card); clean(ava);
    const old = card && card.querySelector('.dc-box'); old && old.remove();
    if (!d) return;
    if (d.bg && card) { card.classList.add('dc-bg'); const g = bgStyle(d.bg); if (g) card.style.setProperty('background', g, 'important'); else card.classList.add(bgClass(d.bg)); }
    if (d.frame && ava) ava.classList.add('dc-ring', 'dc-fr-' + d.frame.split('_')[1]);
    if ((d.plate || d.title) && nameEl) {
      const box = document.createElement('div'); box.className = 'dc-box';
      box.innerHTML = (d.title ? `<div class="dc-ttl">${E(d.title)}</div>` : '') + (d.plate ? `<div class="dc-pl">${plate(d.plate, 'md')}</div>` : '');
      nameEl.insertAdjacentElement('afterend', box);
    }
  }
  const cache = {};
  async function deco(uid) { if (cache[uid] && Date.now() - cache[uid].t < 30000) return cache[uid].d; const r = await rpc('deco_get', { p_user: uid }); const d = r.data || null; cache[uid] = { t: Date.now(), d }; return d; }
  async function decorateModal(uid) {
    const d = await deco(uid); if (G(() => U_UID) !== uid) return;
    const ov = Q('#userOverlay'); if (!ov) return; applyTo(ov, Q('#uAva'), Q('#uUname'), d);
  }
  async function decorateOwn() {
    const id = G(() => ME.id); if (!id) return; delete cache[id];
    const h = Q('#s2ph'); if (!h) return; const d = await deco(id);
    applyTo(h.closest('.s2hero') || h, Q('.s2av', h), Q('p', h), d);
  }
  const hook = setInterval(() => {
    const o = window.openUserModal; if (typeof o !== 'function') return; clearInterval(hook);
    if (o._pl) return;
    const w = function (u) { const r = o.apply(this, arguments); try { u && u.id && decorateModal(u.id); } catch (e) { } return r; }; w._pl = 1; window.openUserModal = w;
  }, 500);
  window.GoldaPlates = { open, decorateOwn, plate };
})();
