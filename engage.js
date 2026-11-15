/* YZITK Chats: ежедневная награда, достижения, витрина NFT, крафт, приглашения */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s);
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const PG = () => window.GoldaPages;
  const fm = v => String(v == null ? 0 : v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const SITE = 'https://levshlapa919-a11y.github.io/QWEN-8/';
  const ME_ID = () => G(() => ME.id);
  const LSg = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, LSs = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };

  const ACH = [
    ['first_nft', 'Первый NFT', 'Получить свой первый NFT', 200],
    ['collector', 'Коллекционер', 'Собрать 10 NFT', 150],
    ['legend', 'Легенда', 'Владеть легендарным NFT', 45],
    ['streak3', 'Три дня подряд', 'Забирать награду 3 дня подряд', 120],
    ['streak7', 'Неделя подряд', 'Забирать награду 7 дней подряд', 170],
    ['streak30', 'Месяц подряд', 'Забирать награду 30 дней подряд', 280],
    ['talker', 'Разговорчивый', 'Отправить 100 сообщений', 210],
    ['veteran', 'Ветеран', 'Быть с нами 30 дней', 30],
    ['inviter', 'Посол', 'Пригласить друга по своей ссылке', 320],
    ['crafter', 'Мастер', 'Сделать первый крафт NFT', 260]
  ];
  const SYM = {
    first_nft: '<path d="M12 3l7 4v6c0 4-3 6.500-7 8-4-1.500-7-4-7-8V7z"/>', collector: '<rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/>',
    legend: '<path d="M12 3l2.600 5.600 6.100.8-4.500 4.200 1.200 6L12 16.600 6.600 19.600l1.200-6L3.300 9.400l6.100-.8z"/>', streak3: '<path d="M13 3c1 4-3 5-3 9a3 3 0 0 0 6 0c0-2-1-3-1-4 3 1 5 4 5 7a7 7 0 0 1-14 0c0-6 5-7 7-12z"/>',
    streak7: '<path d="M13 3c1 4-3 5-3 9a3 3 0 0 0 6 0c0-2-1-3-1-4 3 1 5 4 5 7a7 7 0 0 1-14 0c0-6 5-7 7-12z"/>', streak30: '<path d="M13 3c1 4-3 5-3 9a3 3 0 0 0 6 0c0-2-1-3-1-4 3 1 5 4 5 7a7 7 0 0 1-14 0c0-6 5-7 7-12z"/>',
    talker: '<path d="M4 5h16v11H9l-5 4z"/>', veteran: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7v5l3 2"/>', inviter: '<circle cx="9" cy="8" r="3.500"/><path d="M3 20c0-3.500 3-5.500 6-5.500"/><path d="M17 11v7M13.500 14.500h7"/>',
    crafter: '<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/>'
  };
  const badge = (code, hue, on, sz) => `<span class="ev-bd${on ? ' on' : ''}" style="--h:${hue};width:${sz || 54}px;height:${sz || 54}px"><svg width="${Math.round((sz || 54) * .48)}" height="${Math.round((sz || 54) * .48)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round">${SYM[code] || SYM.legend}</svg></span>`;
  const art = (g, sn) => { const A = window.GoldaArt; return `<div class="mx-art r-${E(g.rarity)}" style="background:${A ? A.bg(g) : '#222'}">${A ? A.svg(g) : ''}${sn ? `<span class="mx-sn">#${sn}</span>` : ''}</div>`; };
  const RAR = { uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный', mythic: 'Мифический' };

  async function myNfts() {
    const r = await sb.from('user_gifts').select('id,serial,locked,hidden,gifts(id,name,rarity,kind,bg1,bg2,collection)').eq('owner_id', ME_ID()).limit(600);
    return (r.data || []).filter(x => x.gifts && x.gifts.kind === 'nft');
  }
  const sheet = (h, f) => PG().sheet(h, f);

  /* ---------- ежедневная награда ---------- */
  function dots(streak, claimed) {
    const inCycle = streak % 7 === 0 && streak > 0 ? 7 : streak % 7;
    let h = ''; for (let i = 1; i <= 7; i++) { const done = i <= inCycle; h += `<span class="ev-d${done ? ' on' : ''}${i === 7 ? ' big' : ''}">${i === 7 ? '+100' : i}</span>`; }
    return `<div class="ev-dots">${h}</div>`;
  }
  const nextReward = st => Math.min(10 + st * 5, 50) + ((st + 1) % 7 === 0 ? 100 : 0);
  async function claim(done) {
    const r = await rpc('tix_daily_claim'); const d = r.data;
    if (!d || !d.ok) return tst('Не получилось получить награду', 'red');
    if (d.already) tst('Награда за сегодня уже получена'); else tst('Получено ' + fm(d.reward) + ' TIX. Серия: ' + d.streak);
    done && done(d);
  }
  async function dailyPopup() {
    const day = new Date().toISOString().slice(0, 10); if (LSg('yz_daily_' + ME_ID()) === day) return; LSs('yz_daily_' + ME_ID(), day);
    const r = await rpc('tix_daily_state'); const s = r.data; if (!s || s.claimed) return;
    const next = nextReward(s.streak);
    sheet(`<h3>Ежедневная награда</h3><div class="ev-sub">Заходи каждый день: серия растёт, награда тоже. Сегодня ${next} TIX.</div>${dots(s.streak)}<button class="ev-btn" id="evGo">Забрать ${next} TIX</button>`, (ov, close) => {
      Q('#evGo', ov).onclick = () => claim(() => { close(); G(() => rpc('ach_sync')); });
    });
  }

  /* ---------- центр наград ---------- */
  function hub() {
    PG().open('hub', {
      title: 'Награды и коллекция', big: 1, sub: 'Серия, достижения, витрина, крафт и приглашения', tab: 'set', async render(body) {
        const paint = async () => {
          const s = (await rpc('tix_daily_state')).data || { streak: 0, claimed: false, best: 0 };
          const row = (id, t, sub) => `<button class="s2r" data-id="${id}" type="button"><div class="s2rt"><b>${t}</b><small>${sub}</small></div><span class="s2c">›</span></button>`;
          body.innerHTML = `<div class="ev-card"><div class="ev-h">Ежедневная награда</div><div class="ev-sub">Серия: ${s.streak} ${s.streak === 1 ? 'день' : 'дн.'}${s.best ? ' · рекорд ' + s.best : ''}</div>${dots(s.streak)}
<button class="ev-btn" data-id="claim" ${s.claimed ? 'disabled' : ''}>${s.claimed ? 'Награда получена, возвращайся завтра' : 'Забрать ' + nextReward(s.streak) + ' TIX'}</button></div>
${row('ach', 'Достижения', 'Значки за активность и коллекцию')}${row('show', 'Витрина NFT', 'Три любимых NFT на вашем профиле')}${row('craft', 'Крафт NFT', 'Три одинаковой редкости дают один выше')}${row('ref', 'Пригласить друзей', '+200 TIX вам и +100 TIX другу')}`;
        };
        body.onclick = e => { const b = e.target.closest('[data-id]'); if (!b || b.disabled) return; const k = b.dataset.id; if (k === 'claim') claim(paint); else if (k === 'ach') ach(); else if (k === 'show') showcase(); else if (k === 'craft') craft(); else if (k === 'ref') invite(); };
        await paint();
      }
    });
  }

  /* ---------- достижения ---------- */
  function ach() {
    PG().open('ach', {
      title: 'Достижения', big: 1, sub: 'Значки видны в вашем профиле', tab: 'set', async render(body) {
        body.innerHTML = '<div class="s2empty">Загрузка…</div>';
        const got = {}; ((await rpc('ach_sync')).data || []).forEach(a => got[a.code] = a.at);
        const n = ACH.filter(a => got[a[0]]).length;
        body.innerHTML = `<div class="ev-sub" style="margin:0 4px 10px">Получено ${n} из ${ACH.length}</div>` + ACH.map(a => `<div class="ev-ar${got[a[0]] ? ' on' : ''}">${badge(a[0], a[3], !!got[a[0]], 52)}<div><b>${a[1]}</b><small>${a[2]}${got[a[0]] ? ' · ' + new Date(got[a[0]]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</small></div></div>`).join('');
      }
    });
  }

  /* ---------- витрина ---------- */
  function showcase() {
    PG().open('show', {
      title: 'Витрина NFT', big: 1, sub: 'Эти NFT видят все, кто открывает ваш профиль', tab: 'set', async render(body) {
        const paint = async () => {
          const sc = (await rpc('showcase_get', { p_user: ME_ID() })).data || []; const by = {}; sc.forEach(x => by[x.slot] = x);
          body.innerHTML = '<div class="ev-slots">' + [1, 2, 3].map(i => by[i] ? `<button class="ev-slot" data-s="${i}">${art(by[i].gift, by[i].serial)}<div class="mx-nm">${E(by[i].gift.name)}</div></button>` : `<button class="ev-slot empty" data-s="${i}"><div class="ev-plus">+</div><div class="mx-nm">Пусто</div></button>`).join('') + '</div><div class="ev-sub" style="margin:10px 4px">Нажмите на ячейку, чтобы выбрать или убрать NFT.</div>';
          body.onclick = e => { const b = e.target.closest('[data-s]'); if (b) pick(+b.dataset.s, !!by[+b.dataset.s], paint); };
        };
        await paint();
      }
    });
  }
  async function pick(slot, has, done) {
    const list = await myNfts();
    sheet(`<h3>Ячейка ${slot}</h3>${has ? '<button class="s2r" data-clear="1" type="button"><div class="s2rt"><b>Убрать из витрины</b></div></button>' : ''}${list.length ? `<div class="mx mx-grid g3">${list.map(u => `<button type="button" class="mx-n" data-u="${E(u.id)}">${art(u.gifts, u.serial)}<div class="mx-nm">${E(u.gifts.name)}</div></button>`).join('')}</div>` : '<div class="s2empty">У вас пока нет NFT</div>'}`, (ov, close) => {
      ov.addEventListener('click', async e => {
        const c = e.target.closest('[data-clear]'), u = e.target.closest('[data-u]'); if (!c && !u) return;
        const r = await rpc('showcase_set', { p_slot: slot, p_gift: c ? null : u.dataset.u }); close();
        if (r.data && r.data.ok) { tst('Витрина обновлена'); done && done(); } else tst('Не получилось', 'red');
      });
    });
  }

  /* ---------- крафт ---------- */
  function craft() {
    PG().open('craft', {
      title: 'Крафт NFT', big: 1, sub: 'Три NFT одной редкости превращаются в один новый уровнем выше', tab: 'set', async render(body) {
        let sel = [], list = [], rar = null;
        const NEXT = { uncommon: 'Редкий', rare: 'Эпический', epic: 'Легендарный' };
        const paint = () => {
          const ok = list.filter(u => !u.locked && NEXT[u.gifts.rarity]);
          body.innerHTML = (ok.length ? `<div class="ev-sub" style="margin:0 4px 10px">Выбрано ${sel.length} из 3${rar ? ' · получите ' + NEXT[rar] + ' NFT' : ''}. Выбранные NFT сгорят.</div><div class="mx mx-grid g3">${ok.map(u => `<button type="button" class="mx-n${sel.includes(u.id) ? ' ev-on' : ''}" data-u="${E(u.id)}">${art(u.gifts, u.serial)}<div class="mx-nm">${E(u.gifts.name)}</div><div class="mx-pr mut">${RAR[u.gifts.rarity] || ''}</div></button>`).join('')}</div><button class="ev-btn" id="evCraft" ${sel.length === 3 ? '' : 'disabled'}>Скрафтить</button>` : '<div class="s2empty">Нужны три NFT одной редкости: необычные, редкие или эпические. Легендарные не крафтятся.</div>');
          const bt = Q('#evCraft', body); if (bt) bt.onclick = go;
        };
        const go = async () => {
          const bt = Q('#evCraft', body); bt.disabled = true;
          if (!await G(() => confirmBox('Скрафтить?', 'Три выбранных NFT исчезнут, вместо них вы получите один случайный NFT редкостью выше.'))) { bt.disabled = false; return; }
          const r = await rpc('craft_nft', { p_ids: sel }); const d = r.data;
          if (!d || !d.ok) { bt.disabled = false; return tst({ same_rarity: 'Нужна одна и та же редкость', need3: 'Выберите три NFT', max: 'Эта редкость уже максимальная', none: 'Подходящих NFT сейчас нет' }[d && d.error] || 'Не получилось', 'red'); }
          sheet(`<h3>Новый NFT</h3><div style="max-width:220px;margin:8px auto">${art({ name: d.name, rarity: d.rarity }, d.serial)}</div><div style="text-align:center"><b>${E(d.name)}</b><div class="ev-sub">${RAR[d.rarity] || ''} · #${d.serial}</div></div>`);
          sel = []; rar = null; list = await myNfts(); paint(); G(() => rpc('ach_sync'));
        };
        body.onclick = e => {
          const b = e.target.closest('[data-u]'); if (!b) return; const u = list.find(x => x.id === b.dataset.u); if (!u) return;
          if (sel.includes(u.id)) sel = sel.filter(x => x !== u.id); else { if (rar && u.gifts.rarity !== rar) return tst('Нужна одна редкость', 'red'); if (sel.length >= 3) return; sel.push(u.id); }
          rar = sel.length ? (list.find(x => x.id === sel[0]).gifts.rarity) : null; paint();
        };
        body.innerHTML = '<div class="s2empty">Загрузка…</div>'; list = await myNfts(); paint();
      }
    });
  }

  /* ---------- приглашения ---------- */
  async function invite() {
    const r = (await rpc('ref_my')).data; if (!r) return tst('Не получилось', 'red');
    const link = SITE + '?ref=' + r.code;
    sheet(`<h3>Пригласить друзей</h3><div class="ev-sub">Когда друг зарегистрируется по вашей ссылке, вы получите 200 TIX, а он 100 TIX.</div><div class="ev-link">${E(link)}</div><button class="ev-btn" id="evCp">Скопировать ссылку</button><button class="ev-btn ghost" id="evSh">Поделиться</button><div class="ev-sub" style="margin-top:10px">Уже пригласили: ${r.count || 0}</div>`, ov => {
      Q('#evCp', ov).onclick = async () => { try { await navigator.clipboard.writeText(link); tst('Ссылка скопирована'); } catch (e) { tst(link); } };
      Q('#evSh', ov).onclick = async () => { try { if (navigator.share) await navigator.share({ title: 'YZITK Chats', text: 'Заходи в YZITK Chats', url: link }); else { await navigator.clipboard.writeText(link); tst('Ссылка скопирована'); } } catch (e) { } };
    });
  }

  /* ---------- блок витрины и значков в чужом профиле ---------- */
  async function userBlock(u) {
    if (!u || /^00000000-/.test(u.id)) return;
    const [s, a] = await Promise.all([rpc('showcase_get', { p_user: u.id }), rpc('ach_get', { p_user: u.id })]);
    const sc = s.data || [], ac = a.data || []; const box = Q('#uEv'); if (!box || box.dataset.u !== u.id) return;
    if (!sc.length && !ac.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = (sc.length ? `<div class="tg-sec-h">Витрина</div><div class="ev-slots mini">${sc.map(x => `<div class="ev-slot">${art(x.gift, x.serial)}<div class="mx-nm">${E(x.gift.name)}</div></div>`).join('')}</div>` : '') +
      (ac.length ? `<div class="tg-sec-h" style="margin-top:12px">Достижения</div><div class="ev-bds">${ac.map(x => { const d = ACH.find(k => k[0] === x.code); return d ? `<span title="${E(d[1])}">${badge(d[0], d[3], true, 44)}</span>` : ''; }).join('')}</div>` : '');
  }
  const _ou = window.openUserModal;
  if (typeof _ou === 'function') window.openUserModal = function (u) {
    _ou.apply(this, arguments);
    try {
      let box = Q('#uEv'); if (!box) { box = document.createElement('div'); box.id = 'uEv'; box.className = 'tg-sec'; const anchor = Q('#uGiftSec'); if (!anchor) return; anchor.before(box); }
      box.dataset.u = u.id; box.style.display = 'none'; userBlock(u);
    } catch (e) { }
  };

  /* ---------- запуск ---------- */
  try { const p = new URLSearchParams(location.search).get('ref'); if (p && /^[A-Za-z0-9]{6,12}$/.test(p)) LSs('yz_ref', p.toUpperCase()); } catch (e) { }
  let tries = 0;
  const boot = setInterval(async () => {
    if (++tries > 60) return clearInterval(boot);
    if (!ME_ID() || !G(() => document.body.classList.contains('auth-off'))) return; clearInterval(boot);
    const ref = LSg('yz_ref');
    if (ref && !LSg('yz_ref_done_' + ME_ID())) { LSs('yz_ref_done_' + ME_ID(), '1'); const r = await rpc('ref_claim', { p_code: ref }); if (r.data && r.data.ok) tst('Приглашение принято: +' + r.data.bonus + ' TIX'); }
    setTimeout(dailyPopup, 2500);
  }, 1000);

  window.GoldaEngage = { hub, ach, showcase, craft, invite, daily: dailyPopup };
})();
