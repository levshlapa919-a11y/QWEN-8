/* YZITK Chats: номера на машины, рубли, рулетка, украшения профиля */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const Q = (s, r) => (r || document).querySelector(s);
  const PG = () => window.GoldaPages;
  const fm = n => Number(n || 0).toLocaleString('ru-RU');
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const RN = { common: 'Обычный', rare: 'Редкий', expensive: 'Дорогой', epic: 'Эпический', legendary: 'Легендарный', divine: 'Божественный' };
  const RC = { common: '#9aa4b2', rare: '#5aa2ff', expensive: '#4cd37b', epic: '#b07dff', legendary: '#ffb52e', divine: '#ff7be5' };
  const ODDS = { common: '55%', rare: '25%', expensive: '13%', epic: '5%', legendary: '1,65%', divine: '0,35%' };
  const BGN = { dawn: 'Рассвет', ice: 'Лёд', neon: 'Неон', matrix: 'Матрица', space: 'Космос', fire: 'Огонь', aurora: 'Северное сияние', gold: 'Золото' };

  /* ---------- номер ---------- */
  function plate(p, size) {
    const m = String(p.plate || '').match(/^(\S)(\d{3})(\S{2}) (\d{2,3})$/); if (!m) return '';
    return `<span class="pl pl-${E(p.rarity)} ${size || ''}"><span class="pl-main"><span>${m[1]}</span><b>${m[2]}</b><span>${m[3]}</span></span><span class="pl-reg"><b>${m[4]}</b><small>RUS <i></i></small></span></span>`;
  }
  const rndPlate = () => { const L = 'АВЕКМНОРСТУХ', r = n => L[Math.random() * L.length | 0]; return { plate: r() + String(Math.random() * 1000 | 0).padStart(3, '0') + r() + r() + ' ' + ['77', '16', '52', '178', '99', '161'][Math.random() * 6 | 0], rarity: ['common', 'rare', 'expensive', 'epic'][Math.random() * 4 | 0] }; };

  /* ---------- страница ---------- */
  let S = { tab: 'game', st: null, mine: [], shop: null, last: null };
  const body = () => Q('#plBody');
  async function open() {
    PG().open('plates', {
      title: 'Номера и украшения', big: 1, sub: 'Задания, рубли и рулетка номеров', tab: 'set', async render(b) {
        b.innerHTML = '<div class="pl-seg" id="plSeg"><button data-t="game">Игра</button><button data-t="col">Коллекция</button><button data-t="shop">Магазин</button></div><div id="plBody"></div>';
        Q('#plSeg', b).onclick = e => { const x = e.target.closest('[data-t]'); if (x) { S.tab = x.dataset.t; draw(); } };
        await draw(true);
      }
    });
  }
  async function refresh() {
    const [a, c, d] = await Promise.all([rpc('pl_state'), rpc('pl_mine'), rpc('deco_shop')]);
    if (a.data) S.st = a.data; if (c.data) S.mine = c.data; if (d.data) S.shop = d.data;
  }
  async function draw(reload) {
    const b = body(); if (!b) return;
    document.querySelectorAll('#plSeg button').forEach(x => x.classList.toggle('on', x.dataset.t === S.tab));
    if (reload || !S.st) { b.innerHTML = '<div class="s2empty">Загрузка…</div>'; await refresh(); if (!S.st) { b.innerHTML = '<div class="s2empty">Не удалось загрузить</div>'; return; } }
    if (S.tab === 'game') game(b); else if (S.tab === 'col') col(b); else shop(b);
  }
  const balCard = () => `<div class="ev-card pl-bal"><div><small>Ваши рубли</small><b>${fm(S.st.rub)} ₽</b></div><div style="text-align:right"><small>Номеров</small><b>${S.mine.length}</b></div></div>`;

  function game(b) {
    const st = S.st;
    b.innerHTML = balCard() + `<div class="ev-card"><div class="ev-h">Рулетка номеров</div><div class="ev-sub">Одна прокрутка стоит ${fm(st.cost)} ₽. Выпадает номер, у каждого своя редкость, и каждый номер на свете только один.</div>
      <div class="pl-stage" id="plSt"><div class="ev-sub">Нажмите «Крутить»</div></div><div style="text-align:center"><div class="pl-rn" id="plRn"></div><div class="pl-rs" id="plRs"></div></div>
      <div id="plAct"></div><button class="ev-btn" id="plGo">Крутить за ${fm(st.cost)} ₽</button>
      <div class="pl-odds">${Object.keys(RN).map(k => `<span style="color:${RC[k]}"><b style="color:${RC[k]}">${RN[k]}</b> ${ODDS[k]}</span>`).join('')}</div></div>
      <div class="ev-card"><div class="ev-h">Задания на сегодня</div><div class="ev-sub">Каждый день обновляются, за каждое даётся награда в рублях.</div><div style="margin-top:8px">${st.tasks.map(tk => `<div class="pl-task"><div><b>${E(tk.title)}</b><small>${tk.have} / ${tk.goal} · ${fm(tk.rub)} ₽</small></div><button data-task="${tk.id}" ${tk.claimed || tk.have < tk.goal ? 'disabled' : ''}>${tk.claimed ? 'Получено' : tk.have < tk.goal ? 'В процессе' : 'Забрать'}</button></div>`).join('')}</div></div>`;
    Q('#plGo', b).onclick = spin;
    b.onclick = async e => {
      const t = e.target.closest('[data-task]'); if (!t || t.disabled) return; t.disabled = true;
      const r = await rpc('pl_task_claim', { p_task: t.dataset.task });
      if (r.data && r.data.ok) { tst('+' + fm(r.data.rub) + ' ₽'); await refresh(); draw(); } else { tst('Задание ещё не выполнено', 'red'); t.disabled = false; }
    };
  }
  async function spin() {
    const go = Q('#plGo'), stg = Q('#plSt'), rn = Q('#plRn'), rs = Q('#plRs'), act = Q('#plAct'); if (!go || go.disabled) return;
    go.disabled = true; act.innerHTML = ''; rn.textContent = ''; rs.textContent = '';
    const r = await rpc('pl_spin');
    if (!r.data || !r.data.ok) { go.disabled = false; tst(r.data && r.data.error === 'no_money' ? 'Не хватает рублей. Выполните задания.' : 'Не получилось прокрутить', 'red'); return; }
    let i = 0, delay = 60; const total = 16;
    await new Promise(res => { const step = () => { stg.innerHTML = plate(rndPlate()); stg.classList.remove('pl-fl'); void stg.offsetWidth; stg.classList.add('pl-fl'); try { navigator.vibrate && navigator.vibrate(8); } catch (e) { } if (++i >= total) return res(); delay *= 1.12; setTimeout(step, delay); }; step(); });
    const d = r.data; S.last = d;
    S.st.rub = d.rub; S.mine.unshift({ id: d.id, plate: d.plate, rarity: d.rarity, value: d.value }); S.st.spins++;
    if (!stg.isConnected) { const s2 = Q('#plSt'); if (!s2) return; return spinShow(d); }
    spinShow(d);
  }
  function spinShow(d) {
    const go = Q('#plGo'), stg = Q('#plSt'), rn = Q('#plRn'), rs = Q('#plRs'), act = Q('#plAct'); if (!stg || !go) return;
    stg.innerHTML = `<div class="pl-in">${plate(d, 'xl')}</div>`;
    rn.style.color = RC[d.rarity]; rn.textContent = RN[d.rarity]; rs.textContent = 'Стоимость при продаже ' + fm(d.value) + ' ₽';
    if (['legendary', 'divine'].includes(d.rarity)) { G(() => window.LIVE && LIVE.confetti && LIVE.confetti(d.rarity === 'divine' ? 220 : 120)); try { navigator.vibrate && navigator.vibrate([40, 40, 90]); } catch (e) { } }
    const bl = Q('.pl-bal b'); if (bl) bl.textContent = fm(d.rub) + ' ₽'; const cn = document.querySelectorAll('.pl-bal b')[1]; if (cn) cn.textContent = S.mine.length;
    act.innerHTML = `<div style="display:flex;gap:8px"><button class="ev-btn ghost" id="plEq">Повесить в профиль</button><button class="ev-btn ghost" id="plSl">Продать за ${fm(d.value)} ₽</button></div>`;
    Q('#plEq').onclick = async () => { await equip({ plate: d.id }); tst('Номер в профиле'); Q('#plEq').disabled = true; };
    Q('#plSl').onclick = async () => { if (!confirm('Продать номер ' + d.plate + ' за ' + fm(d.value) + ' ₽?')) return; await sell(d.id); act.innerHTML = ''; stg.innerHTML = '<div class="ev-sub">Номер продан</div>'; rn.textContent = ''; rs.textContent = ''; };
    go.disabled = false;
    if (S.st.rub < S.st.cost) go.disabled = false;
  }
  async function sell(id) {
    const r = await rpc('pl_sell', { p_id: id });
    if (r.data && r.data.ok) { S.st.rub += r.data.rub; S.mine = S.mine.filter(x => x.id !== id); tst('+' + fm(r.data.rub) + ' ₽'); const bl = Q('.pl-bal b'); if (bl) bl.textContent = fm(S.st.rub) + ' ₽'; return true; }
    tst(r.data && r.data.error === 'equipped' ? 'Сначала снимите номер с профиля' : 'Не получилось продать', 'red'); return false;
  }
  async function equip(patch) {
    const d = Object.assign({ plate: S.shop && S.shop.plate, bg: S.shop && S.shop.bg, frame: S.shop && S.shop.frame, title: S.shop && S.shop.title }, patch);
    const r = await rpc('deco_set', { p_plate: d.plate || null, p_bg: d.bg || '', p_frame: d.frame || '', p_title: d.title || '' });
    if (r.data && r.data.ok) { if (S.shop) Object.assign(S.shop, d); S.mine.forEach(x => x.equipped = x.id === d.plate); decorateOwn(); return true; }
    tst('Не получилось применить', 'red'); return false;
  }

  function col(b) {
    const eq = S.shop && S.shop.plate;
    b.innerHTML = balCard() + (S.mine.length ? `<div class="pl-grid">${S.mine.map(p => `<button class="pl-cell ${p.id === eq ? 'eq' : ''}" data-id="${p.id}">${plate(p, 'sm')}<b style="color:${RC[p.rarity]}">${RN[p.rarity]}</b><small>${p.id === eq ? 'В профиле' : fm(p.value) + ' ₽'}</small></button>`).join('')}</div>` : '<div class="ev-card"><div class="ev-sub">Пока нет номеров. Прокрутите рулетку на вкладке «Игра».</div></div>');
    b.onclick = e => {
      const c = e.target.closest('[data-id]'); if (!c) return; const p = S.mine.find(x => x.id === c.dataset.id); if (!p) return; const on = S.shop && S.shop.plate === p.id;
      PG().sheet(`<div class="pl-sh" style="text-align:center">${plate(p, 'lg')}<div class="ev-h" style="color:${RC[p.rarity]}">${RN[p.rarity]}</div><div class="ev-sub">Цена продажи ${fm(p.value)} ₽</div></div><button class="ev-btn" id="a1">${on ? 'Снять с профиля' : 'Повесить в профиль'}</button><button class="ev-btn ghost" id="a2">Продать</button>`, (ov, close) => {
        Q('#a1', ov).onclick = async () => { close(); await equip({ plate: on ? null : p.id }); draw(); };
        Q('#a2', ov).onclick = async () => { close(); if (!confirm('Продать номер ' + p.plate + ' за ' + fm(p.value) + ' ₽?')) return; await sell(p.id); draw(); };
      });
    };
  }

  /* ---------- магазин ---------- */
  function swatch(it) {
    const k = it.id.split('_')[1];
    if (it.kind === 'bg') return `<div class="pl-sw dc-bg-${k}"></div>`;
    if (it.kind === 'frame') return `<div class="pl-sw"><span class="dc-ring dc-fr-${k}" style="width:30px;height:30px;background:var(--p2)"></span></div>`;
    return '<div class="pl-sw" style="background:var(--p2)">🏷</div>';
  }
  function shop(b) {
    const sh = S.shop || {}, items = sh.items || [], eqPl = S.mine.find(x => x.id === sh.plate);
    const cur = { bg: sh.bg, frame: sh.frame, title: sh.title };
    const tn = id => (items.find(x => x.id === id) || {}).name || '';
    const name = G(() => ME.display_name || ME.username) || '';
    const sec = (kind, label) => `<div class="pl-sec">${label}</div>` + items.filter(i => i.kind === kind).map(it => {
      const on = cur[kind] === it.id;
      return `<div class="pl-it">${swatch(it)}<div><b>${E(it.name)}</b><small>${it.owned ? (on ? 'Применено' : 'Куплено') : fm(it.price) + ' ₽'}</small></div>${it.owned ? `<button data-use="${it.id}" data-k="${kind}">${on ? 'Снять' : 'Применить'}</button>` : `<button class="buy" data-buy="${it.id}">Купить</button>`}</div>`; }).join('');
    b.innerHTML = balCard() + `<div class="pl-prev ${sh.bg ? 'dc-bg dc-bg-' + sh.bg.split('_')[1] : ''}" id="plPrev"><span class="dc-ring ${sh.frame ? 'dc-fr-' + sh.frame.split('_')[1] : ''}" style="${sh.frame ? '' : '--rc:none'}">${G(() => avatarHTML(ME, 'l')) || ''}</span><div class="pn">${E(name)}</div><div class="pt">${sh.title ? E(tn(sh.title)) : ''}</div><div class="pp">${eqPl ? plate(eqPl, 'lg') : '<span class="ev-sub">Номер не выбран</span>'}</div></div>` + sec('bg', 'Фоны профиля') + sec('frame', 'Рамки аватара') + sec('title', 'Титулы');
    b.onclick = async e => {
      const buy = e.target.closest('[data-buy]'), use = e.target.closest('[data-use]');
      if (buy) {
        const it = items.find(x => x.id === buy.dataset.buy); if (!confirm('Купить «' + it.name + '» за ' + fm(it.price) + ' ₽?')) return;
        const r = await rpc('deco_buy', { p_item: it.id });
        if (r.data && r.data.ok) { it.owned = true; S.st.rub = r.data.rub; tst('Куплено'); draw(); } else tst(r.data && r.data.error === 'no_money' ? 'Не хватает рублей' : 'Не получилось купить', 'red');
      } else if (use) { const k = use.dataset.k, id = use.dataset.use; if (await equip({ [k]: cur[k] === id ? null : id })) draw(); }
    };
  }

  /* ---------- отображение в профилях ---------- */
  const CL = ['dc-bg', 'dc-ring'];
  function clean(el) { if (!el) return; [...el.classList].filter(c => /^dc-/.test(c)).forEach(c => el.classList.remove(c)); }
  function applyTo(card, ava, nameEl, d) {
    clean(card); clean(ava);
    const old = card && card.querySelector('.dc-box'); old && old.remove();
    if (!d) return;
    if (d.bg && card) card.classList.add('dc-bg', 'dc-bg-' + d.bg.split('_')[1]);
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
    const ov = Q('#userOverlay'); if (!ov) return;
    applyTo(ov, Q('#uAva'), Q('#uUname'), d);
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
