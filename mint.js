/* GOLDA 2.1: строгая графика NFT, кошелёк TIX, рынок NFT, окно «выход из беты», инструменты, очистка интерфейса от эмодзи */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const LS = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fm = v => { const s = String(v == null ? 0 : v).split('.')[0]; return /^-?\d+$/.test(s) ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'; };
  const num = v => Number(v) || 0;
  const tst = (m, k) => G(() => toast(m, k));
  const ME_ = () => G(() => ME);
  const PG = () => window.GoldaPages;
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const RAR = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
  const ERR = { no_tix: 'Недостаточно TIX', no_primes: 'Недостаточно праймиков', bad_amount: 'Введите корректную сумму', bad_user: 'Получатель недоступен', gone: 'Лот уже недоступен', own: 'Это ваш собственный лот', locked: 'NFT занят: обмен или аукцион', bad_price: 'Укажите корректную цену', not_nft: 'Это не NFT', not_owner: 'NFT вам не принадлежит', bad_params: 'Проверьте текст и время', too_many: 'Не больше 50 активных напоминаний', not_found: 'Не найдено' };
  const eMsg = r => (r && r.data && ERR[r.data.error]) || 'Не получилось, попробуйте ещё раз';
  const BOTID = /^00000000-0000-4000-8000-/;

  /* ================= Графика NFT: гильошир + геометрическая эмблема ================= */
  const RC = { common: '#aeb5bf', uncommon: '#93c4b2', rare: '#93b8ec', epic: '#bfaaee', legendary: '#ecce8b' };
  const h32 = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const f1 = n => (Math.round(n * 10) / 10).toString();
  const ART = {};
  function rosette(R, a, n, ph, pts) {
    let d = ''; for (let i = 0; i <= pts; i++) { const t = i / pts * Math.PI * 2, r = R + a * Math.cos(n * t + ph); d += (i ? 'L' : 'M') + f1(50 + r * Math.cos(t)) + ' ' + f1(50 + r * Math.sin(t)); }
    return `<path d="${d}Z"/>`;
  }
  function poly(r, m, rot) { let d = ''; for (let i = 0; i < m; i++) { const t = rot + i / m * Math.PI * 2; d += (i ? 'L' : 'M') + f1(50 + r * Math.cos(t)) + ' ' + f1(50 + r * Math.sin(t)); } return `<path d="${d}Z"/>`; }
  function emblem(h) {
    const st = h % 3, m = 4 + (h >>> 3) % 5, rot = ((h >>> 6) % 12) * Math.PI / 12 - Math.PI / 2; let o = '';
    if (st === 0) { for (let i = 0; i < 4; i++) o += poly(17 - i * 4, m, rot + i * Math.PI / m); o += '<circle cx="50" cy="50" r="1.600" fill="currentColor"/>'; }
    else if (st === 1) { const mm = m + 1, k = mm > 6 ? 3 : 2; let d = ''; for (let i = 0; i < mm; i++) { const t1 = rot + i / mm * Math.PI * 2, t2 = rot + ((i + k) % mm) / mm * Math.PI * 2; d += 'M' + f1(50 + 18 * Math.cos(t1)) + ' ' + f1(50 + 18 * Math.sin(t1)) + 'L' + f1(50 + 18 * Math.cos(t2)) + ' ' + f1(50 + 18 * Math.sin(t2)); } o += `<path d="${d}"/><circle cx="50" cy="50" r="18"/><circle cx="50" cy="50" r="4"/>`; }
    else { for (let i = 0; i < m; i++) o += `<ellipse cx="50" cy="40.500" rx="5.200" ry="10.500" transform="rotate(${f1(i * 360 / m)} 50 50)"/>`; o += '<circle cx="50" cy="50" r="3"/><circle cx="50" cy="50" r="21"/>'; }
    return o;
  }
  function svg(g) {
    g = g || {}; const nm = String(g.name || ''), rar = g.rarity || 'common', key = nm + '|' + rar; if (ART[key]) return ART[key];
    const w = nm.split(/\s+/), a = h32(w[0] || 'x'), b = h32(w[1] || w[0] || 'y'), col = RC[rar] || RC.common, n = 5 + b % 8, ph = (b >>> 5) % 6;
    let o = `<circle cx="50" cy="50" r="46.500" stroke-width=".55" opacity=".7"/><circle cx="50" cy="50" r="44.800" stroke-width=".25" opacity=".5"/>`;
    if (rar === 'legendary') o += '<circle cx="50" cy="50" r="48.600" stroke-width=".35" opacity=".8"/>'; else if (rar === 'epic') o += '<circle cx="50" cy="50" r="48.400" stroke-width=".3" stroke-dasharray="1 1.800" opacity=".8"/>';
    o += `<g stroke-width=".3" opacity=".62">${rosette(35, 4, n, ph, 150)}${rosette(35, 4, n, ph + Math.PI / 2, 150)}${rosette(27, 3, n + 2, ph, 130)}${rosette(27, 3, n + 2, ph + Math.PI / 2, 130)}</g>`;
    o += `<g stroke-width=".7" style="color:${col}">${emblem(a)}</g>`;
    return (ART[key] = `<svg class="ga" viewBox="0 0 100 100" fill="none" stroke="${col}" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${o}</svg>`);
  }
  window.GoldaArt = { svg, h32 };
  /* старый набор мультяшных значков больше не нужен */
  window.giftSVG = n => svg({ name: n, rarity: 'rare' });

  /* ================= Очистка интерфейса от эмодзи (только элементы интерфейса, не переписка) ================= */
  const EMO = /(?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*|\uFE0F)/gu;
  const KEEP = new Set(['\u2714', '\u2715', '\u2716', '\u2709', '\u2022']);
  const SUB = { '\u2705': '\u2714', '\u274C': '\u2715', '\u2757': '', '\u2753': '' };
  const DENY = '.gs-who,.u-name,.uname,.prof-name,.mx-u span,.mx-pk b,.ci-name,.m-name,.chat-title,#chName,#uName,#uAbout,.about-t,.m-text,.rx,.rxc,.ci-prev,.ci-name,.m-name,textarea,input,[contenteditable],.stk,.emoji-grid,.emo-grid,.emoji-pick,.ep-grid,.ae-fb,.story-text,.rx-burst,.emo-pk,.react-pick,.rpick,.rp-bar,script,style,.bubble>.m-text';
  const ALLOW = 'button,.toast,.xo-title,.xo-top,.gs-t,.gs-k,.gs-hide,.gs-more,.gs-v,.gs-sell,.gs-del,.gs-ow,.sh-tabs,.sh-hint,.sh-sel,.sh-bal,.sg,.gf,.gm,.s2sh,.s2lbl,.mx,.tg-sec-h,.tg-lbl,.menu-i,.gf-empty,.tr-card,.g3,.f2m,.bm-sheet,.tix-card,.yp-big,.side-tabs,.g3-toast,.xo-empty,.settings-label,.s2empty,.empty-note';
  const ICON = { '\uD83D\uDC8E': 'pmk', '\uD83E\uDE99': 'gmk' };
  function cleanText(n) {
    const v = n.nodeValue; if (!v || v.length > 600 || !/[^\u0000-\u2000]/.test(v)) return;
    const p = n.parentElement; if (!p || p.closest(DENY) || !p.closest(ALLOW)) return;
    EMO.lastIndex = 0; if (!EMO.test(v)) return;
    const parts = []; let out = '', changed = false, last = 0; EMO.lastIndex = 0; let m;
    while ((m = EMO.exec(v))) {
      const ch = m[0].replace(/\uFE0F/g, '');
      if (KEEP.has(ch)) continue;
      out += v.slice(last, m.index); last = m.index + m[0].length; changed = true;
      if (ICON[ch]) { parts.push(out); parts.push(ICON[ch]); out = ''; } else if (SUB[ch] != null) out += SUB[ch];
    }
    out += v.slice(last); if (!changed) return;
    const rest = (parts.filter(x => x !== 'pmk' && x !== 'gmk').join('') + out).trim();
    if (!rest && !parts.some(x => x === 'pmk' || x === 'gmk')) return;   /* кнопка из одного эмодзи (выбор реакции и т.п.) не трогаем */
    const clean = s => s.replace(/[ \t]{2,}/g, ' ').replace(/^\s+(?=\S)/, m2 => /\n/.test(m2) ? m2 : '');
    if (!parts.length) { n.nodeValue = clean(out); return; }
    const fr = document.createDocumentFragment();
    parts.forEach(x => { if (x === 'pmk' || x === 'gmk') { const i = document.createElement('i'); i.className = x; fr.appendChild(i); } else if (x) fr.appendChild(document.createTextNode(x)); });
    if (out) fr.appendChild(document.createTextNode(out));
    n.replaceWith(fr);
  }
  const BK = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.500h10a1 1 0 0 1 1 1V21l-6-4-6 4V4.500a1 1 0 0 1 1-1z"/></svg>';
  function sweep(root) {
    if (!root) return;
    if (root.nodeType === 1) QA('.ava-sv:not([data-mx])', root.matches && root.matches('.ava-sv') ? root.parentNode : root).forEach(e => { e.dataset.mx = 1; e.innerHTML = BK; });
    if (root.nodeType === 3) return cleanText(root);
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(root.tagName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = []; let n; while ((n = w.nextNode())) list.push(n);
    list.forEach(cleanText);
  }
  let pend = new Set(), tm = 0;
  const mo = new MutationObserver(ms => { ms.forEach(m => m.addedNodes.forEach(x => pend.add(x))); if (!tm) tm = setTimeout(() => { tm = 0; const l = [...pend]; pend = new Set(); l.forEach(x => { if (x.isConnected) sweep(x); }); mo.takeRecords(); }, 30); });
  const _toast = window.toast;
  if (typeof _toast === 'function') window.toast = function (m, k) { return _toast.call(this, typeof m === 'string' ? m.replace(EMO, x => (KEEP.has(x.replace(/\uFE0F/g, '')) ? x : '')).replace(/\s{2,}/g, ' ').trim() : m, k); };

  /* ================= TIX: карточка перевода в чате ================= */
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf;
  window.parseMedia = function (c) { const m = String(c).match(/^\[\[tix\|(\d{1,13})\|([^\]]*)\]\]$/); return m ? { kind: 'tix', amt: m[1], note: m[2], cap: '' } : _pm.apply(this, arguments); };
  window.mediaHTML = function (md) { if (md && md.kind === 'tix') return `<div class="tix-card"><div class="tx-h">Перевод TIX</div><div class="tx-a">${fm(md.amt)}<span>TIX</span></div>${md.note ? `<div class="tx-n">${E(md.note)}</div>` : ''}</div>`; return _mh.apply(this, arguments); };
  window.previewOf = function (lm, chat) { const md = window.parseMedia(lm.content); if (md && md.kind === 'tix') return (lm.sender_id === G(() => ME.id) ? 'Вы: ' : '') + 'Перевод ' + fm(md.amt) + ' TIX'; return _pv.apply(this, arguments); };

  /* ================= Кошелёк ================= */
  const REAS = { launch: 'Подарок к запуску', swap_in: 'Обмен праймиков на TIX', swap_out: 'Обмен TIX на праймики', send: 'Перевод', receive: 'Перевод получен', market_buy: 'Покупка на рынке', market_sell: 'Продажа на рынке' };
  const dtf = t => { const d = new Date(t); return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ''); };
  const ago = t => { const s = (Date.now() - new Date(t)) / 1000; return s < 60 ? 'сейчас' : s < 3600 ? Math.floor(s / 60) + ' мин назад' : s < 86400 ? Math.floor(s / 3600) + ' ч назад' : dtf(t); };
  const bgOf = g => `radial-gradient(circle at 50% 42%,rgba(255,255,255,.12),rgba(255,255,255,0) 64%),linear-gradient(165deg,${g.bg1 || '#3a4a5c'},${g.bg2 || '#141c26'})`;
  const sheet = (h, f) => PG().sheet(h, f);
  const digits = el => { el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 12); }); };

  function wallet() {
    PG().open('tix', {
      title: 'TIX', big: 1, sub: 'Внутренняя валюта GOLDA', tab: 'set', async render(body) {
        const paint = async () => {
          const r = await rpc('tix_state'); const d = r.data;
          if (!d) { body.innerHTML = '<div class="s2empty">Не удалось загрузить кошелёк</div>'; return; }
          body.innerHTML = `<div class="mx mx-card"><div class="mx-bg">${svg({ name: 'Основа Кошелёк', rarity: 'legendary' })}</div><div class="mx-l">Баланс</div><div class="mx-b">${fm(d.tix)}<span>TIX</span></div><div class="mx-s">${fm(d.primes)} праймиков · обмен 1:1</div></div>
            <div class="mx mx-act"><button data-a="swap">Обмен</button><button data-a="send">Перевод</button><button data-a="mkt">Рынок</button></div>
            <div class="s2lbl">История</div>` + ((d.log || []).length ? d.log.map(x => `<div class="mx mx-lg"><div><b>${E(REAS[x.r] || 'Операция')}</b><small>${E(x.o || '')}${x.o ? ' · ' : ''}${E(dtf(x.t))}</small></div><span class="${num(x.d) < 0 ? 'neg' : 'pos'}">${num(x.d) > 0 ? '+' : ''}${fm(x.d)}</span></div>`).join('') : '<div class="s2empty">Операций пока нет</div>');
          body.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'swap') swapSheet(d, paint); else if (b.dataset.a === 'send') sendSheet(null, paint); else market(); };
        };
        await paint();
      }
    });
  }
  function swapSheet(st, done) {
    let dir = 'buy';
    sheet(`<h3>Обмен</h3><div class="mx mx-seg"><button data-d="buy" class="on">Праймики в TIX</button><button data-d="sell">TIX в праймики</button></div><input class="s2in" id="mxA" inputmode="numeric" placeholder="Сумма" autocomplete="off"><div class="mx mx-hint" id="mxH"></div><button class="go" id="mxGo">Обменять</button>`, (ov, close) => {
      const a = Q('#mxA', ov), h = Q('#mxH', ov); digits(a);
      const upd = () => { const v = num(a.value); if (dir === 'buy') h.textContent = `Доступно ${fm(st.primes)} праймиков. Вы получите ${fm(v)} TIX.`; else h.textContent = `Доступно ${fm(st.tix)} TIX. Комиссия 5%. Вы получите ${fm(Math.floor(v * 0.95))} праймиков.`; };
      ov.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b) return; dir = b.dataset.d; QA('[data-d]', ov).forEach(x => x.classList.toggle('on', x === b)); upd(); });
      a.oninput = () => { a.value = a.value.replace(/\D/g, '').slice(0, 12); upd(); }; upd();
      Q('#mxGo', ov).onclick = async () => {
        const v = num(a.value); if (v < 1) return tst('Введите сумму', 'red'); const b = Q('#mxGo', ov); b.disabled = true;
        const r = await rpc('tix_swap', { p_dir: dir, p_amount: v }); b.disabled = false;
        if (r.data && r.data.ok) { tst('Обмен выполнен'); close(); done && done(); } else tst(eMsg(r), 'red');
      };
    });
  }
  function sendSheet(uid, done) {
    const users = (G(() => USERS) || []).filter(u => u && u.id && u.id !== G(() => ME.id) && !BOTID.test(u.id));
    let pick = uid ? (users.find(u => u.id === uid) || G(() => PROFILES[uid]) || { id: uid }) : null;
    sheet(`<h3>Перевод TIX</h3><div id="mxP"></div><input class="s2in" id="mxQ" placeholder="Поиск получателя" autocomplete="off"><div class="mx mx-us" id="mxU"></div><input class="s2in" id="mxA" inputmode="numeric" placeholder="Сумма в TIX" autocomplete="off"><input class="s2in" id="mxN" maxlength="120" placeholder="Комментарий (необязательно)" autocomplete="off"><button class="go" id="mxGo">Отправить</button>`, (ov, close) => {
      const P = Q('#mxP', ov), U = Q('#mxU', ov), qi = Q('#mxQ', ov), a = Q('#mxA', ov); digits(a);
      const nm = u => u.display_name || u.username || 'Пользователь';
      const drawP = () => { P.innerHTML = pick ? `<div class="mx mx-pk">${G(() => avatarHTML(pick, 's')) || ''}<b>${E(nm(pick))}</b>${uid ? '' : '<button type="button" id="mxX">Изменить</button>'}</div>` : ''; U.style.display = pick ? 'none' : ''; qi.style.display = pick ? 'none' : ''; const x = Q('#mxX', ov); if (x) x.onclick = () => { pick = null; drawP(); drawU(); }; };
      const drawU = () => { const q = qi.value.trim().toLowerCase(); U.innerHTML = users.filter(u => !q || nm(u).toLowerCase().includes(q) || String(u.username || '').toLowerCase().includes(q)).slice(0, 30).map(u => `<button type="button" class="mx-u" data-u="${E(u.id)}">${G(() => avatarHTML(u, 's')) || ''}<span>${E(nm(u))}<small>@${E(u.username || '')}</small></span></button>`).join('') || '<div class="s2empty">Никого не найдено</div>'; };
      U.onclick = e => { const b = e.target.closest('[data-u]'); if (!b) return; pick = users.find(u => u.id === b.dataset.u); drawP(); }; qi.oninput = drawU; drawP(); drawU();
      Q('#mxGo', ov).onclick = async () => {
        if (!pick) return tst('Выберите получателя', 'red'); const v = num(a.value); if (v < 1) return tst('Введите сумму', 'red');
        const b = Q('#mxGo', ov); b.disabled = true; const r = await rpc('tix_send', { p_to: pick.id, p_amount: v, p_note: Q('#mxN', ov).value });
        b.disabled = false; if (r.data && r.data.ok) { tst('Переведено ' + fm(v) + ' TIX'); close(); done && done(); } else tst(eMsg(r), 'red');
      };
    });
  }

  /* ================= Рынок NFT ================= */
  const art = (g, sn) => `<div class="mx-art r-${E(g.rarity)}" style="background:${bgOf(g)}">${svg(g)}${sn ? `<span class="mx-sn">#${sn}</span>` : ''}</div>`;
  function market() {
    const S = { tab: 'shop', q: '', rar: '', sort: 'new', items: [], mine: [], st: null, bal: null };
    PG().open('market', {
      title: 'Рынок NFT', big: 1, sub: 'Покупка и продажа за TIX · комиссия 5%', tab: 'set', async render(body) {
        const load = async () => {
          const [a, b, c, d] = await Promise.all([rpc('market_browse', { p_q: S.q, p_rarity: S.rar, p_sort: S.sort, p_limit: 60, p_off: 0 }), rpc('market_mine'), rpc('market_stats'), rpc('tix_state')]);
          S.items = a.data || []; S.mine = b.data || []; S.st = c.data; S.bal = d.data ? d.data.tix : null;
        };
        const draw = () => {
          const st = S.st || {};
          let h = `<div class="mx mx-st"><div><b>${fm(st.listed || 0)}</b><small>в продаже</small></div><div><b>${fm(st.sales24 || 0)}</b><small>продаж за сутки</small></div><div><b>${fm(st.vol24 || 0)}</b><small>оборот, TIX</small></div></div>
            <div class="mx mx-seg tabs">${[['shop', 'Каталог'], ['mine', 'Мои NFT'], ['hist', 'Продажи']].map(x => `<button data-tab="${x[0]}" class="${S.tab === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>`;
          if (S.tab === 'shop') {
            h += `<input class="s2in mx-q" id="mxQ" placeholder="Название или номер, например #12" value="${E(S.q)}" autocomplete="off"><div class="mx mx-ch">${[['', 'Все'], ['common', 'Обычные'], ['uncommon', 'Необычные'], ['rare', 'Редкие'], ['epic', 'Эпические'], ['legendary', 'Легендарные']].map(x => `<button data-r="${x[0]}" class="${S.rar === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>
              <div class="mx mx-ch">${[['new', 'Новые'], ['cheap', 'Дешевле'], ['rich', 'Дороже']].map(x => `<button data-s="${x[0]}" class="${S.sort === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}<span class="mx-bal">${S.bal != null ? fm(S.bal) + ' TIX' : ''}</span></div>`;
            h += S.items.length ? `<div class="mx mx-grid">${S.items.map(l => `<button type="button" class="mx-n" data-l="${E(l.id)}">${art(l, l.serial)}<div class="mx-nm">${E(l.name)}</div><div class="mx-pr">${fm(l.price)} TIX${l.mine ? '<em>ваш лот</em>' : ''}</div></button>`).join('')}</div>` : '<div class="s2empty">Лотов по этому запросу нет</div>';
          } else if (S.tab === 'mine') {
            h += S.mine.length ? `<div class="mx mx-grid">${S.mine.map(u => `<button type="button" class="mx-n" data-u="${E(u.ug)}">${art(u, u.serial)}<div class="mx-nm">${E(u.name)}</div><div class="mx-pr ${u.listing ? '' : 'mut'}">${u.listing ? fm(u.price) + ' TIX' : u.locked ? 'Занят' : 'Не в продаже'}</div></button>`).join('')}</div>` : '<div class="s2empty">У вас пока нет NFT. Их можно купить на рынке или получить в подарок.</div>';
          } else {
            h += (st.recent || []).length ? (st.recent).map(x => `<div class="mx mx-lg"><div><b>${E(x.name)} #${x.serial}</b><small>${E(RAR[x.rarity] || '')} · ${E(ago(x.at))}</small></div><span>${fm(x.price)} TIX</span></div>`).join('') : '<div class="s2empty">Продаж пока не было</div>';
          }
          body.innerHTML = h;
        };
        const reload = async () => { await load(); draw(); };
        body.onclick = async e => {
          const t = e.target.closest('[data-tab]'); if (t) { S.tab = t.dataset.tab; draw(); return; }
          const r = e.target.closest('[data-r]'); if (r) { S.rar = r.dataset.r; await reload(); return; }
          const s = e.target.closest('[data-s]'); if (s) { S.sort = s.dataset.s; await reload(); return; }
          const l = e.target.closest('[data-l]'); if (l) { const it = S.items.find(x => x.id === l.dataset.l); if (it) buySheet(it, reload); return; }
          const u = e.target.closest('[data-u]'); if (u) { const it = S.mine.find(x => x.ug === u.dataset.u); if (it) mySheet(it, reload); }
        };
        body.addEventListener('input', e => { if (e.target.id === 'mxQ') S.q = e.target.value.trim(); });
        body.addEventListener('keydown', e => { if (e.target.id === 'mxQ' && e.key === 'Enter') { S.q = e.target.value.trim(); reload().then(() => { const i = Q('#mxQ', body); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); } });
        body.innerHTML = '<div class="s2empty">Загрузка…</div>'; await reload();
      }
    });
  }
  const rows = a => `<div class="mx mx-rows">${a.map(r => `<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>`;
  function buySheet(l, done) {
    const mine = l.mine;
    sheet(`<div class="mx mx-big">${art(l, l.serial)}</div><h3 style="text-align:center">${E(l.name)}</h3>` + rows([['Редкость', E(RAR[l.rarity] || '')], ['Коллекция', E(l.collection || '')], ['Номер', '#' + l.serial + (l.supply ? ' из ' + l.supply : '')], ['Продавец', E(l.seller_name || '')], ['Минимальная цена', fm(l.floor) + ' TIX'], ['Цена', '<u>' + fm(l.price) + ' TIX</u>']]) + `<button class="go" id="mxGo">${mine ? 'Снять с продажи' : 'Купить за ' + fm(l.price) + ' TIX'}</button>`, (ov, close) => {
      Q('#mxGo', ov).onclick = async () => {
        const b = Q('#mxGo', ov); if (!mine && !b.dataset.c) { b.dataset.c = 1; b.textContent = 'Подтвердить покупку: ' + fm(l.price) + ' TIX'; return; }
        b.disabled = true; const r = mine ? await rpc('market_cancel', { p_id: l.id }) : await rpc('market_buy', { p_id: l.id }); b.disabled = false;
        if (r.data && r.data.ok) { tst(mine ? 'Лот снят с продажи' : 'NFT куплен'); close(); done && done(); } else { tst(eMsg(r), 'red'); if (r.data && r.data.error === 'gone') { close(); done && done(); } }
      };
    });
  }
  function mySheet(u, done) {
    sheet(`<div class="mx mx-big">${art(u, u.serial)}</div><h3 style="text-align:center">${E(u.name)}</h3>` + rows([['Редкость', E(RAR[u.rarity] || '')], ['Номер', '#' + u.serial + (u.supply ? ' из ' + u.supply : '')], ['Минимальная цена на рынке', u.floor ? fm(u.floor) + ' TIX' : 'нет лотов'], ['Последняя продажа', u.last ? fm(u.last) + ' TIX' : 'нет данных']].concat(u.listing ? [['Ваша цена', fm(u.price) + ' TIX']] : [])) +
      (u.listing ? '<button class="go" id="mxGo">Снять с продажи</button>' : u.locked ? '<div class="mx mx-hint">NFT сейчас занят: обмен или аукцион.</div>' : `<input class="s2in" id="mxP" inputmode="numeric" placeholder="Цена в TIX" value="${u.floor ? E(String(Math.floor(num(u.floor)))) : ''}" autocomplete="off"><div class="mx mx-hint" id="mxH"></div><button class="go" id="mxGo">Выставить на продажу</button>`), (ov, close) => {
      const p = Q('#mxP', ov), h = Q('#mxH', ov); if (p) { digits(p); const upd = () => { h.textContent = 'Вы получите ' + fm(Math.floor(num(p.value) * 0.95)) + ' TIX после комиссии 5%.'; }; p.oninput = () => { p.value = p.value.replace(/\D/g, '').slice(0, 12); upd(); }; upd(); }
      const go = Q('#mxGo', ov); if (!go) return;
      go.onclick = async () => {
        go.disabled = true; const r = u.listing ? await rpc('market_cancel', { p_id: u.listing }) : await rpc('market_list', { p_ug: u.ug, p_price: num(p.value) }); go.disabled = false;
        if (r.data && r.data.ok) { tst(u.listing ? 'Лот снят с продажи' : 'NFT выставлен на продажу'); close(); done && done(); } else tst(eMsg(r), 'red');
      };
    });
  }

  /* ================= Инструменты ================= */
  const quiet = () => { if (LS.g('golda_dnd', '0') !== '1') return false; const f = LS.g('golda_dnd_from', '23:00'), t = LS.g('golda_dnd_to', '08:00'), d = new Date(), c = d.getHours() * 60 + d.getMinutes(), m = x => { const p = x.split(':'); return (+p[0]) * 60 + (+p[1] || 0); }; return m(f) <= m(t) ? (c >= m(f) && c < m(t)) : (c >= m(f) || c < m(t)); };
  const _sn = window.sendNotif; if (typeof _sn === 'function') window.sendNotif = function () { if (quiet()) return; return _sn.apply(this, arguments); };
  const chatTitle = c => c.type === 'group' ? (c.name || 'Группа') : ((((c.members || []).find(m => m.id !== G(() => ME.id))) || {}).display_name || c.name || 'Чат');
  const nameOf = id => { const p = G(() => PROFILES[id]); return p ? (p.display_name || p.username) : 'Участник'; };
  const pad = n => String(n).padStart(2, '0'), stamp = t => { const d = new Date(t); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  async function exportChat(c, btn) {
    btn.disabled = true; const old = btn.textContent; btn.textContent = 'Выгрузка…'; const out = []; let from = 0;
    try {
      for (; ;) { const { data, error } = await sb.from('messages').select('sender_id,content,created_at').eq('chat_id', c.id).order('created_at', { ascending: true }).range(from, from + 999); if (error) throw error; (data || []).forEach(m => out.push(`[${stamp(m.created_at)}] ${nameOf(m.sender_id)}: ${/^\[\[/.test(m.content) ? '[вложение]' : m.content}`)); if (!data || data.length < 1000 || out.length >= 20000) break; from += 1000; }
      const txt = `Переписка «${chatTitle(c)}» · выгружено ${stamp(Date.now())} · сообщений: ${out.length}\n\n` + out.join('\n'), fn = 'golda-' + (chatTitle(c).replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 30) || 'chat') + '.txt', file = new File([txt], fn, { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: fn }); } catch (e) { if (e && e.name !== 'AbortError') throw e; } }
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
      tst('Переписка выгружена: ' + out.length + ' сообщ.');
    } catch (e) { tst('Не удалось выгрузить переписку', 'red'); }
    btn.disabled = false; btn.textContent = old;
  }
  function tools() {
    const { row } = PG();
    PG().open('tools', {
      title: 'Инструменты', big: 1, sub: 'Дополнительные возможности GOLDA', tab: 'set', render(body) {
        const dnd = LS.g('golda_dnd', '0') === '1';
        body.innerHTML = row({ id: 'rem', ic: 'clock', t: 'Напоминания', s: 'Бот напомнит в нужное время' }) + row({ id: 'find', ic: 'search', t: 'Поиск по сообщениям', s: 'По всем вашим чатам' }) + row({ id: 'notes', ic: 'user', t: 'Заметки о контактах', s: 'Видны только вам' }) + row({ id: 'exp', ic: 'bookmark', t: 'Экспорт переписки', s: 'Сохранить чат в текстовый файл' }) +
          row({ id: 'dnd', ic: 'bell', t: 'Тихие часы', s: dnd ? 'Включены: ' + LS.g('golda_dnd_from', '23:00') + ' – ' + LS.g('golda_dnd_to', '08:00') : 'Отключены', v: dnd ? 'Вкл' : 'Выкл' }) + row({ id: 'send', ic: 'wallet', t: 'Перевод TIX', s: 'Отправить другу' });
        body.onclick = e => { const r = e.target.closest('[data-id]'); if (!r) return; ({ rem: reminders, find: finder, notes: notes, exp: exporter, dnd: () => dndSheet(() => tools()), send: () => sendSheet(null) })[r.dataset.id](); };
      }
    });
  }
  function dndSheet(done) {
    const on = LS.g('golda_dnd', '0') === '1';
    sheet(`<h3>Тихие часы</h3><div class="mx mx-hint">В это время всплывающие уведомления на этом устройстве не показываются. Сообщения при этом приходят как обычно.</div><div class="mx mx-tm"><label>С<input type="time" class="s2in" id="mxF" value="${LS.g('golda_dnd_from', '23:00')}"></label><label>До<input type="time" class="s2in" id="mxT" value="${LS.g('golda_dnd_to', '08:00')}"></label></div><button class="go" id="mxGo">${on ? 'Сохранить' : 'Включить'}</button>${on ? '<button class="go mx-ghost" id="mxOff">Отключить</button>' : ''}`, (ov, close) => {
      Q('#mxGo', ov).onclick = () => { LS.s('golda_dnd', '1'); LS.s('golda_dnd_from', Q('#mxF', ov).value || '23:00'); LS.s('golda_dnd_to', Q('#mxT', ov).value || '08:00'); close(); done && done(); tst('Тихие часы включены'); };
      const off = Q('#mxOff', ov); if (off) off.onclick = () => { LS.s('golda_dnd', '0'); close(); done && done(); tst('Тихие часы отключены'); };
    });
  }
  function exporter() {
    const list = (G(() => CHATS) || []).slice(0, 40);
    sheet('<h3>Экспорт переписки</h3>' + (list.map((c, i) => `<button class="s2r" data-i="${i}"><span class="s2rt"><b>${E(chatTitle(c))}</b></span></button>`).join('') || '<div class="s2empty">Чатов нет</div>'), (ov, close) => { ov.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) exportChat(list[+b.dataset.i], b); }); });
  }
  function finder() {
    PG().open('find', {
      title: 'Поиск по сообщениям', tab: 'set', render(body) {
        body.innerHTML = '<input class="s2in mx-q" id="mxQ" placeholder="Что искать (от 2 символов)" autocomplete="off"><div id="mxR"></div>'; const i = Q('#mxQ', body), R = Q('#mxR', body); let tm = 0, seq = 0;
        i.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => {
          const q = i.value.trim(), my = ++seq; if (q.length < 2) { R.innerHTML = ''; return; } R.innerHTML = '<div class="s2empty">Поиск…</div>';
          const r = await rpc('msg_search', { p_q: q, p_limit: 60 }); if (my !== seq) return; const l = r.data || [];
          const hl = t => E(t).replace(new RegExp(E(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), m => `<mark>${m}</mark>`);
          R.innerHTML = l.length ? l.map(m => { const c = (G(() => CHATS) || []).find(x => x.id === m.chat); return `<button type="button" class="mx mx-hit" data-c="${E(m.chat)}"><b>${E(c ? chatTitle(c) : 'Чат')}</b><span>${E(nameOf(m.sender))} · ${E(dtf(m.at))}</span><p>${hl(m.text)}</p></button>`; }).join('') : '<div class="s2empty">Ничего не найдено</div>';
        }, 350); };
        R.onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; PG().close(); G(() => openChat(b.dataset.c)); };
        setTimeout(() => i.focus(), 350);
      }
    });
  }
  function notes() {
    PG().open('notes', {
      title: 'Заметки о контактах', big: 1, sub: 'Видны только вам', tab: 'set', async render(body) {
        const paint = async () => {
          const r = await sb.from('contact_notes').select('about,note,updated_at').order('updated_at', { ascending: false }); const l = r.data || [];
          body.innerHTML = '<button class="go" id="mxAdd" style="margin:0 0 12px">Добавить заметку</button>' + (l.length ? l.map(n => `<button class="s2r" data-a="${E(n.about)}"><span class="s2rt"><b>${E(nameOf(n.about))}</b><small>${E(n.note)}</small></span></button>`).join('') : '<div class="s2empty">Заметок пока нет</div>');
          Q('#mxAdd', body).onclick = () => edit(null, '', paint);
          body.onclick = e => { const b = e.target.closest('[data-a]'); if (b) { const n = l.find(x => x.about === b.dataset.a); edit(b.dataset.a, n ? n.note : '', paint); } };
        };
        const edit = (uid, text, done) => {
          const users = (G(() => USERS) || []).filter(u => u && u.id && u.id !== G(() => ME.id) && !BOTID.test(u.id)); let pick = uid;
          sheet(`<h3>Заметка</h3>${uid ? `<div class="mx mx-pk"><b>${E(nameOf(uid))}</b></div>` : '<input class="s2in" id="mxQ" placeholder="Поиск контакта" autocomplete="off"><div class="mx mx-us" id="mxU"></div>'}<textarea class="s2in" id="mxN" rows="4" maxlength="500" placeholder="Текст заметки">${E(text)}</textarea><button class="go" id="mxGo">Сохранить</button>${text ? '<button class="go mx-ghost" id="mxDel">Удалить заметку</button>' : ''}`, (ov, close) => {
            const U = Q('#mxU', ov), qi = Q('#mxQ', ov);
            if (U) { const draw = () => { const q = qi.value.trim().toLowerCase(); U.innerHTML = users.filter(u => !q || (u.display_name || u.username || '').toLowerCase().includes(q)).slice(0, 25).map(u => `<button type="button" class="mx-u${pick === u.id ? ' on' : ''}" data-u="${E(u.id)}">${G(() => avatarHTML(u, 's')) || ''}<span>${E(u.display_name || u.username)}<small>@${E(u.username || '')}</small></span></button>`).join(''); }; qi.oninput = draw; draw(); U.onclick = e => { const b = e.target.closest('[data-u]'); if (b) { pick = b.dataset.u; draw(); } }; }
            Q('#mxGo', ov).onclick = async () => { if (!pick) return tst('Выберите контакт', 'red'); const v = Q('#mxN', ov).value.trim(); if (!v) return tst('Введите текст', 'red'); const r = await rpc('note_set', { p_about: pick, p_note: v }); if (r.error) return tst('Не удалось сохранить', 'red'); close(); done(); };
            const d = Q('#mxDel', ov); if (d) d.onclick = async () => { await rpc('note_set', { p_about: pick, p_note: '' }); close(); done(); };
          });
        };
        await paint();
      }
    });
  }
  function reminders() {
    PG().open('rem', {
      title: 'Напоминания', big: 1, sub: 'Бот пришлёт сообщение в назначенное время', tab: 'set', async render(body) {
        const paint = async () => {
          const r = await sb.from('reminders').select('id,text,run_at').eq('status', 'pending').order('run_at', { ascending: true }); const l = r.data || [];
          const d = new Date(Date.now() + 3600e3); const v = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          body.innerHTML = `<div class="mx mx-form"><input class="s2in" id="mxT" maxlength="300" placeholder="О чём напомнить" autocomplete="off"><input class="s2in" id="mxD" type="datetime-local" value="${v}"><button class="go" id="mxGo" style="margin:0">Добавить</button></div><div class="s2lbl">Запланировано</div>` +
            (l.length ? l.map(x => `<div class="mx mx-lg"><div><b>${E(x.text)}</b><small>${E(stamp(x.run_at))}</small></div><button type="button" class="mx-x" data-d="${E(x.id)}">Отменить</button></div>`).join('') : '<div class="s2empty">Напоминаний нет</div>');
          Q('#mxGo', body).onclick = async () => {
            const t = Q('#mxT', body).value.trim(), at = new Date(Q('#mxD', body).value); if (!t) return tst('Введите текст', 'red'); if (isNaN(at)) return tst('Укажите дату и время', 'red');
            const r2 = await rpc('reminder_add', { p_text: t, p_at: at.toISOString() }); if (r2.data && r2.data.ok) { tst('Напоминание добавлено'); paint(); } else tst(eMsg(r2), 'red');
          };
          body.onclick = async e => { const b = e.target.closest('[data-d]'); if (!b) return; await rpc('reminder_cancel', { p_id: b.dataset.d }); paint(); };
        };
        await paint();
      }
    });
  }

  /* ================= Окно «выход из беты» ================= */
  let launchBusy = false;
  async function launch() {
    if (launchBusy || Q('#mxLaunch')) return; const me = ME_(); if (!me || !me.id || !G(() => sb)) return;
    if (LS.g('golda_rel1_' + me.id, '0') === '1') return;
    launchBusy = true;
    try {
      const r = await sb.from('profiles').select('flags').eq('id', me.id).maybeSingle();
      if (r.error || !r.data) { launchBusy = false; return; }
      if ((r.data.flags || {}).rel1 === '1') { LS.s('golda_rel1_' + me.id, '1'); launchBusy = false; return; }
    } catch (e) { launchBusy = false; return; }
    const o = document.createElement('div'); o.id = 'mxLaunch'; o.className = 'mx-lo';
    const items = [['Кошелёк TIX', 'Обмен праймиков на TIX, переводы друзьям, история операций.'], ['Рынок NFT', 'Покупайте и продавайте NFT за TIX по свободным ценам.'], ['Новая коллекция', 'Все подарки и NFT переработаны: строгая графика вместо значков.'], ['Инструменты', 'Напоминания, поиск по сообщениям, заметки о контактах, экспорт переписки, тихие часы.'], ['Приватность', 'Скрытие фото, статуса и «о себе», чёрный список, список устройств.']];
    o.innerHTML = `<div class="mx-lc"><div class="mx-lart">${svg({ name: 'Основа Запуск', rarity: 'legendary' })}</div><div class="mx-lk">GOLDA 2.1</div><h2>Мессенджер вышел из беты</h2><p>Спасибо, что были с нами с самого начала. Теперь GOLDA работает в полную силу.</p><div class="mx-li">${items.map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div><button class="go" id="mxLgo">Получить 100 TIX</button><small>Приветственный бонус начисляется один раз.</small></div>`;
    document.body.appendChild(o);
    Q('#mxLgo', o).onclick = async () => {
      const b = Q('#mxLgo', o); b.disabled = true; b.textContent = 'Начисляем…';
      const r = await rpc('launch_claim');
      if (r.data && (r.data.ok || r.data.error === 'already')) { LS.s('golda_rel1_' + me.id, '1'); G(() => { ME.flags = Object.assign({}, ME.flags, { rel1: '1' }); }); o.remove(); launchBusy = false; if (r.data.ok) tst('На ваш счёт зачислено 100 TIX'); }
      else { b.disabled = false; b.textContent = 'Получить 100 TIX'; tst('Нет соединения, попробуйте ещё раз', 'red'); }
    };
  }
  let tries = 0; (function wait() { if (ME_() && ME_().id && Q('#app,.app,.side')) { setTimeout(launch, 1800); } else if (tries++ < 400) setTimeout(wait, 800); })();

  window.GoldaMint = { wallet, market, tools, send: uid => sendSheet(uid), launch, sweep: () => sweep(document.body) };
  function start() { sweep(document.body); mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
