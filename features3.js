/* features3: задания и серия, рейтинги, значки, витрина, коллекция, аукцион, обмен NFT */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const ready = () => typeof ME !== 'undefined' && ME && ME.id;
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const fmt = v => { try { const s = String(v == null ? '0' : v).split('.')[0]; return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); } catch (e) { return String(v); } };
  const RAR = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠', mythic: '🔴' };
  const gimg = g => g.image ? `<img src="${E(g.image)}" alt="">` : `<span>${E(g.emoji || '🎁')}</span>`;
  const gcell = (g, extra) => `<div class="g3-cell ${g.locked ? 'lock' : ''}" data-id="${E(g.id)}">${gimg(g)}<b>${E(g.name)}</b><small>${g.serial ? '#' + g.serial : ''} ${RAR[g.rarity] || ''}${g.locked ? ' 🔒' : ''}</small>${extra || ''}</div>`;
  const M = (t, b, mount) => F2.modal(t, b, mount);

  /* ---------- хаб ---------- */
  const TABS = [['tasks', '🎯 Задания'], ['top', '🏆 Рейтинг'], ['market', '🔨 Рынок'], ['me', '🎖 Значки'], ['col', '📚 Коллекция']];
  function hub(tab) {
    const m = M('Достижения', `<div class="g3-tabs">${TABS.map(t => `<button data-t="${t[0]}">${t[1]}</button>`).join('')}</div><div id="g3body" class="g3-body">…</div>`, (ov, close) => {
      const go = async t => { QA('.g3-tabs button', ov).forEach(b => b.classList.toggle('on', b.dataset.t === t)); const body = Q('#g3body', ov); body.textContent = 'Загрузка…'; try { await VIEWS[t](body, ov); } catch (e) { body.textContent = 'Ошибка: ' + e.message; } };
      ov.addEventListener('click', e => { const b = e.target.closest('.g3-tabs button'); if (b) go(b.dataset.t); });
      ov._go = go; go(tab || 'tasks');
    });
    return m;
  }
  const VIEWS = {
    async tasks(body, ov) {
      const r = await rpc('daily_state'); const s = r.data; if (!s) return body.textContent = 'Не удалось загрузить';
      body.innerHTML = `<div class="g3-streak"><div class="g3-fire">🔥</div><div><b>Серия: ${s.streak} дн.</b><div class="g3-s">Рекорд ${s.best} · всего входов ${s.total}</div></div></div>
        <button class="f2-btn" id="cd" ${s.today_done ? 'disabled' : ''}>${s.today_done ? '✔ Награда за сегодня получена' : 'Забрать ' + fmt(s.next_reward) + ' gold'}</button>
        <div class="f2-note" style="margin-top:6px">7 дней подряд = +1 праймик. Пропустишь день — серия сбросится.</div>
        <div class="g3-h">Задания на сегодня</div>` + s.tasks.map(t => `<div class="g3-task"><div><b>${E(t.title)}</b><div class="g3-s">${t.progress}/${t.goal} · +${fmt(t.reward)} gold</div><div class="g3-pb"><i style="width:${Math.round(t.progress * 100 / t.goal)}%"></i></div></div><button class="f2-chip" data-ct="${t.id}" ${t.claimed || t.progress < t.goal ? 'disabled' : ''}>${t.claimed ? '✔' : 'Забрать'}</button></div>`).join('');
      Q('#cd', body).onclick = async () => { const x = await rpc('claim_daily'); if (x.data && x.data.ok) { tst('🔥 Серия ' + x.data.streak + ' · +' + fmt(x.data.gold) + ' gold' + (x.data.prime_bonus ? ' и +1 праймик!' : '')); } else tst('Уже получено'); VIEWS.tasks(body, ov); };
      QA('[data-ct]', body).forEach(b => b.onclick = async () => { const x = await rpc('claim_task', { p_task: b.dataset.ct }); if (x.data && x.data.ok) tst('+' + fmt(x.data.reward) + ' gold'); else tst('Пока нельзя', 'red'); VIEWS.tasks(body, ov); });
    },
    async top(body) {
      const kinds = [['gold', '🪙 Gold'], ['prime', '💎 Праймики'], ['gifts', '🎁 Подарки'], ['streak', '🔥 Серия']];
      body.innerHTML = `<div class="g3-sub">${kinds.map(k => `<button data-k="${k[0]}">${k[1]}</button>`).join('')}</div><div id="g3l"></div>`;
      const load = async k => { QA('.g3-sub button', body).forEach(b => b.classList.toggle('on', b.dataset.k === k)); const r = await rpc('leaderboard', { p_kind: k }); const l = r.data || []; Q('#g3l', body).innerHTML = l.length ? l.map((x, i) => `<div class="g3-row"><span class="g3-n">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="g3-nm">${E(x.name)} ${E(x.em || '')}</span><b>${fmt(x.v)}</b></div>`).join('') : '<div class="f2-note">Пока пусто</div>'; };
      QA('.g3-sub button', body).forEach(b => b.onclick = () => load(b.dataset.k)); load('gold');
    },
    async col(body) {
      const r = await rpc('collection_progress'); const l = r.data || []; const have = l.filter(g => g.have > 0).length;
      body.innerHTML = `<div class="g3-h">Собрано ${have} из ${l.length}</div><div class="g3-pb"><i style="width:${l.length ? Math.round(have * 100 / l.length) : 0}%"></i></div><div class="g3-grid">${l.map(g => `<div class="g3-cell ${g.have ? '' : 'dim'}">${gimg(g)}<b>${E(g.name)}</b><small>${RAR[g.rarity] || ''}${g.have ? ' ×' + g.have : ''}</small></div>`).join('')}</div>`;
    },
    async me(body) {
      const [c, mk] = await Promise.all([rpc('profile_card', { p_user: ME.id }), rpc('my_market')]); const p = c.data || {}, mine = (mk.data && mk.data.mine) || [];
      const sc = (p.showcase || []).map(x => x.id);
      body.innerHTML = `<div class="g3-h">Эмодзи-статус</div><input class="f2-in" id="es" maxlength="8" placeholder="например 🚀" value="${E(p.emoji || '')}">
        <div class="g3-h">Титул</div><select class="f2-in" id="tt"><option value="">— без титула —</option>${(p.badges || []).map(b => `<option ${p.title === b.name ? 'selected' : ''}>${E(b.name)}</option>`).join('')}</select>
        <div class="g3-h">Значки</div><div class="g3-bd">${(p.badges || []).map(b => `<span title="${E(b.name)}">${b.emoji} ${E(b.name)}</span>`).join('') || '<div class="f2-note">Пока нет — играй, пиши, заходи каждый день</div>'}</div>
        <div class="g3-h">Витрина (до 6 NFT, нажми чтобы выбрать)</div><div class="g3-grid" id="vit">${mine.filter(g => g.serial).map(g => gcell(g)).join('') || '<div class="f2-note">Нет NFT</div>'}</div>
        <button class="f2-btn" id="sv">Сохранить</button>`;
      const sel = new Set(sc); const paint = () => QA('#vit .g3-cell', body).forEach(c => c.classList.toggle('sel', sel.has(c.dataset.id))); paint();
      Q('#vit', body).onclick = e => { const c = e.target.closest('.g3-cell'); if (!c) return; const id = c.dataset.id; if (sel.has(id)) sel.delete(id); else if (sel.size < 6) sel.add(id); paint(); };
      Q('#sv', body).onclick = async () => { const x = await rpc('set_profile_extra', { p_title: Q('#tt', body).value, p_emoji: Q('#es', body).value.trim(), p_showcase: [...sel] }); tst(x.data && x.data.ok ? 'Сохранено ✔' : 'Не вышло', x.data && x.data.ok ? '' : 'red'); };
    },
    async market(body, ov) {
      const r = await rpc('my_market'); const d = r.data; if (!d) return body.textContent = 'Не удалось загрузить';
      const left = t => { const s = Math.max(0, (new Date(t) - Date.now()) / 1000 | 0); return s > 3600 ? Math.floor(s / 3600) + ' ч ' + Math.floor(s % 3600 / 60) + ' мин' : Math.floor(s / 60) + ' мин ' + s % 60 + ' с'; };
      body.innerHTML = `<div class="g3-h">Аукцион</div>` + (d.auctions.length ? d.auctions.map(a => `<div class="g3-au"><div class="g3-ai">${gimg(a)}</div><div style="flex:1;min-width:0"><b>${E(a.name)} ${a.serial ? '#' + a.serial : ''}</b><div class="g3-s">от ${E(a.seller_name)} · ${left(a.ends)}</div><div class="g3-s">${a.bid ? 'Ставка: <b>' + fmt(a.bid) + '</b> 💎' + (a.mine_bid ? ' (твоя)' : '') : 'Старт: ' + fmt(a.start) + ' 💎'}</div></div>${a.seller === ME.id ? `<button class="f2-chip" data-ca="${a.id}">Снять</button>` : `<button class="f2-chip" data-bid="${a.id}" data-min="${a.bid ? '' : a.start}" data-cur="${a.bid || ''}">Ставка</button>`}</div>`).join('') : '<div class="f2-note">Лотов нет</div>') +
        `<button class="f2-btn ghost" id="sell">＋ Выставить NFT на аукцион</button><div class="f2-note">Комиссия 5% с продажи. Шаг ставки — 5%.</div>` +
        `<div class="g3-h">Предложения обмена</div>` + (d.trades.length ? d.trades.map(t => `<div class="g3-task"><div><b>${t.incoming ? E(t.other) + ' предлагает' : 'Ты предлагаешь ' + E(t.other)}</b><div class="g3-s">${E(t.give.emoji)} ${E(t.give.name)} ${t.give.serial ? '#' + t.give.serial : ''} ⇄ ${E(t.want.emoji)} ${E(t.want.name)} ${t.want.serial ? '#' + t.want.serial : ''}</div><div class="g3-s">${t.incoming ? 'Ты получишь первое, отдашь второе' : 'Отдаёшь первое, получаешь второе'}</div></div><div>${t.incoming ? `<button class="f2-chip" data-ta="${t.id}">Принять</button> ` : ''}<button class="f2-chip" data-td="${t.id}">${t.incoming ? 'Отказ' : 'Отмена'}</button></div></div>`).join('') : '<div class="f2-note">Нет. Предложить обмен можно из профиля человека.</div>');
      QA('[data-bid]', body).forEach(b => b.onclick = async () => { const v = prompt('Твоя ставка (праймики)' + (b.dataset.cur ? '. Нужно больше ' + b.dataset.cur : ', минимум ' + b.dataset.min)); if (!v || !/^\d+$/.test(v.trim())) return; const x = await rpc('bid_auction', { p_id: b.dataset.bid, p_amount: v.trim() }); const dd = x.data || {}; tst(dd.ok ? 'Ставка принята ✔' : ({ no_money: 'Не хватает праймиков', low: 'Ставка слишком мала, минимум ' + fmt(dd.min), closed: 'Аукцион закрыт', own: 'Свой лот' }[dd.error] || 'Не вышло'), dd.ok ? '' : 'red'); VIEWS.market(body, ov); });
      QA('[data-ca]', body).forEach(b => b.onclick = async () => { const x = await rpc('cancel_auction', { p_id: b.dataset.ca }); tst(x.data && x.data.ok ? 'Лот снят' : 'Нельзя снять — есть ставки', x.data && x.data.ok ? '' : 'red'); VIEWS.market(body, ov); });
      QA('[data-ta]', body).forEach(b => b.onclick = async () => { const x = await rpc('answer_trade', { p_id: b.dataset.ta, p_accept: true }); tst(x.data && x.data.ok ? 'Обмен состоялся 🔄' : 'Обмен невозможен', x.data && x.data.ok ? '' : 'red'); VIEWS.market(body, ov); });
      QA('[data-td]', body).forEach(b => b.onclick = async () => { await rpc('answer_trade', { p_id: b.dataset.td, p_accept: false }); VIEWS.market(body, ov); });
      Q('#sell', body).onclick = () => {
        const free = d.mine.filter(g => g.serial && !g.locked); if (!free.length) return tst('Нет свободных NFT', 'red');
        const m2 = M('Выбери NFT', `<div class="g3-grid">${free.map(g => gcell(g)).join('')}</div><input class="f2-in" id="sp" inputmode="numeric" placeholder="Стартовая цена, праймики"><select class="f2-in" id="sh"><option value="6">6 часов</option><option value="24" selected>24 часа</option><option value="72">72 часа</option><option value="1">1 час</option></select><button class="f2-btn" id="sgo2">Выставить</button>`, (o2, c2) => {
          let pick = null; o2.addEventListener('click', e => { const c = e.target.closest('.g3-cell'); if (c) { pick = c.dataset.id; QA('.g3-cell', o2).forEach(x => x.classList.toggle('sel', x === c)); } });
          Q('#sgo2', o2).onclick = async () => { const p = Q('#sp', o2).value.trim(); if (!pick || !/^\d+$/.test(p) || +p <= 0) return tst('Выбери NFT и цену', 'red'); const x = await rpc('create_auction', { p_ug: pick, p_start: p, p_hours: +Q('#sh', o2).value }); if (x.data && x.data.ok) { c2(); tst('Лот выставлен 🔨'); VIEWS.market(body, ov); } else tst('Не вышло', 'red'); };
        });
      };
    }
  };

  /* ---------- обмен из профиля + карточка ---------- */
  let lastU = null;
  const _ou = window.openUserModal;
  if (typeof _ou === 'function') window.openUserModal = function (u) { _ou.apply(this, arguments); lastU = u; try { decorateUser(u); } catch (e) { console.error(e); } };
  async function decorateUser(u) {
    const sec = Q('#uGiftSec'); if (!sec || !u || u.id === ME.id && false) return;
    let box = Q('#uCard3'); if (!box) { box = document.createElement('div'); box.id = 'uCard3'; box.className = 'tg-sec'; sec.before(box); }
    box.innerHTML = '';
    if (typeof BOTS !== 'undefined' && BOTS[u.id]) return;
    const r = await rpc('profile_card', { p_user: u.id }); const p = r.data; if (!p || lastU !== u) return;
    const top = (p.emoji ? p.emoji + ' ' : '') + (p.title || '');
    box.innerHTML = `${top ? `<div class="g3-top">${E(top)}</div>` : ''}<div class="g3-bd">${p.streak ? `<span>🔥 серия ${p.streak}</span>` : ''}${(p.badges || []).map(b => `<span title="${E(b.name)}">${b.emoji}</span>`).join('')}</div>${p.showcase && p.showcase.length ? `<div class="tg-sec-h">🖼 Витрина</div><div class="g3-grid">${p.showcase.map(g => gcell(g)).join('')}</div>` : ''}${u.id !== ME.id ? '<button class="f2-btn ghost" id="trBtn">🔄 Предложить обмен NFT</button>' : ''}`;
    const tb = Q('#trBtn', box); if (tb) tb.onclick = () => tradeUI(u);
  }
  async function tradeUI(u) {
    const [mk, theirs] = await Promise.all([rpc('my_market'), rpc('user_gifts_of', { p_user: u.id })]);
    const mine = ((mk.data && mk.data.mine) || []).filter(g => g.serial && !g.locked), th = (theirs.data || []).filter(g => !g.locked);
    if (!mine.length) return tst('У тебя нет NFT для обмена', 'red'); if (!th.length) return tst('У него нет NFT для обмена', 'red');
    M('🔄 Обмен', `<div class="g3-h">Отдаёшь</div><div class="g3-grid" id="gv">${mine.map(g => gcell(g)).join('')}</div><div class="g3-h">Получаешь</div><div class="g3-grid" id="gw">${th.map(g => gcell(g)).join('')}</div><button class="f2-btn" id="tgo">Отправить предложение</button>`, (ov, close) => {
      const pk = { v: null, w: null };
      ['gv', 'gw'].forEach((id, i) => Q('#' + id, ov).addEventListener('click', e => { const c = e.target.closest('.g3-cell'); if (!c) return; pk[i ? 'w' : 'v'] = c.dataset.id; QA('.g3-cell', Q('#' + id, ov)).forEach(x => x.classList.toggle('sel', x === c)); }));
      Q('#tgo', ov).onclick = async () => { if (!pk.v || !pk.w) return tst('Выбери оба NFT', 'red'); const x = await rpc('offer_trade', { p_give: pk.v, p_want: pk.w }); if (x.data && x.data.ok) { close(); tst('Предложение отправлено 🔄'); } else tst('Не вышло', 'red'); };
    });
  }

  /* ---------- вход в меню ---------- */
  function deco() {
    const menu = Q('#chatMenu'); if (!menu || Q('[data-f3m]', menu) || !menu.children.length) return;
    const b = document.createElement('button'); b.className = 'menu-i'; b.dataset.f3m = '1'; b.textContent = '🏆 Задания, рейтинг, рынок'; menu.insertBefore(b, menu.children[1] || null);
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-f3m]'); if (!b) return; e.stopPropagation(); const m = Q('#chatMenu'); if (m) m.classList.remove('open'); hub('tasks'); }, true);
  setInterval(() => { if (ready()) deco(); }, 700);

  /* напоминание о ежедневной награде (раз в сутки) */
  setTimeout(async function ping() {
    if (!ready()) return setTimeout(ping, 3000);
    try { const k = 'g3_ping', d = new Date().toISOString().slice(0, 10); if (localStorage.getItem(k) === d) return; const r = await rpc('daily_state'); if (r.data && !r.data.today_done) { localStorage.setItem(k, d); const t = document.createElement('div'); t.className = 'g3-toast'; t.innerHTML = '🔥 Ежедневная награда ждёт! <b>Забрать</b>'; t.onclick = () => { t.remove(); hub('tasks'); }; document.body.appendChild(t); setTimeout(() => t.remove(), 9000); } } catch (e) { }
  }, 4000);
  window.F3 = { hub };
})();
