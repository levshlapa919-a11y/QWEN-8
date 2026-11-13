/* GOLDA 2.1: строгая графика NFT, кошелёк TIX, рынок NFT, окно «выход из беты», инструменты, очистка интерфейса от эмодзи */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const LS = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fm = v => { const s = String(v == null ? 0 : v).split('.')[0]; if (/^-?inf/i.test(s)) return '∞'; return /^-?\d+$/.test(s) ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'; };
  const num = v => Number(v) || 0;
  const tst = (m, k) => G(() => toast(m, k));
  const ME_ = () => G(() => ME);
  const PG = () => window.GoldaPages;
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  const RAR = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
  const ERR = { no_tix: 'Недостаточно TIX', no_gold: 'Недостаточно gold', forbidden: 'Доступно только создателю', bad_amount: 'Введите корректную сумму', bad_user: 'Получатель недоступен', gone: 'Лот уже недоступен', own: 'Это ваш собственный лот', locked: 'NFT занят: обмен или аукцион', bad_price: 'Укажите корректную цену', not_nft: 'Это не NFT', not_owner: 'NFT вам не принадлежит', bad_params: 'Проверьте текст и время', too_many: 'Не больше 50 активных напоминаний', not_found: 'Не найдено' };
  const eMsg = r => (r && r.data && ERR[r.data.error]) || 'Не получилось, попробуйте ещё раз';
  const OWNERS = ['03d24548-56f1-4329-a7f0-466c18b8a8c9', '6c02c4d5-c674-432d-9a5c-86e31c465790'];
  const OWN = () => OWNERS.includes(G(() => ME.id));
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

  /* рисунки предметов: каждый подарок и NFT изображает то, что написано в названии */
  const IC = {
    'вымпел': '<path d="M35 72V29"/><path d="M35 31L69 42L35 54Z"/><path d="M35 38L55 42L35 47"/>',
    'жетон': '<circle cx="50" cy="50" r="18"/><circle cx="50" cy="50" r="13"/><path d="M50 41L59 50L50 59L41 50Z"/>',
    'кубок': '<path d="M38 33h24v13a12 12 0 0 1-24 0Z"/><path d="M38 37h-5a5 7 0 0 0 5 9M62 37h5a5 7 0 0 1-5 9"/><path d="M50 58v8M41 69h18"/>',
    'медальон': '<path d="M41 29l9 15 9-15"/><circle cx="50" cy="57" r="14"/><circle cx="50" cy="57" r="8"/>',
    'монограмма': '<circle cx="50" cy="50" r="20"/><path d="M41 61V39l9 15 9-15v22"/>',
    'ориентир': '<path d="M50 71C38 57 35 50 35 44a15 15 0 0 1 30 0c0 6-3 13-15 27Z"/><circle cx="50" cy="44" r="5.500"/>',
    'перстень': '<circle cx="50" cy="59" r="13"/><path d="M43 42l7-9 7 9-7 6Z"/>',
    'печать': '<circle cx="50" cy="50" r="19"/><circle cx="50" cy="50" r="14"/><path d="M50 39l3.500 8 8.500.700-6.500 5.600 2 8.400-7.500-4.500-7.500 4.500 2-8.400-6.500-5.600 8.500-.700Z"/>',
    'свеча': '<path d="M44 46h12v22H44Z"/><path d="M50 30c-5 7-4 12 0 12s5-5 0-12Z"/><path d="M50 42v4M39 68h22"/>',
    'талисман': '<path d="M50 31l17 10v18L50 69 33 59V41Z"/><path d="M38 50c6-8 18-8 24 0-6 8-18 8-24 0Z"/><circle cx="50" cy="50" r="4"/>',
    'фонарь': '<path d="M44 34a6 6 0 0 1 12 0"/><path d="M42 36h16l3 8v16l-3 8H42l-3-8V44Z"/><path d="M50 44c-4 5-3 9 0 9s4-4 0-9Z"/>',
    'хронограф': '<rect x="46" y="30" width="8" height="5"/><circle cx="50" cy="53" r="17"/><path d="M50 53V42M50 53l7 4M50 38v2M50 66v-2M35 53h2M65 53h-2"/>',
    'витраж': '<path d="M37 70V44a13 13 0 0 1 26 0v26Z"/><path d="M50 31v39M37 54h26M37 62h26"/>',
    'горизонт': '<path d="M30 60h40M37 60a13 13 0 0 1 26 0M33 66h34M38 72h24M50 33v7M37 41l4 4M63 41l-4 4"/>',
    'грань': '<path d="M50 31l17 10v19L50 70 33 60V41Z"/><path d="M33 41l17 10 17-10M50 51v19"/>',
    'диадема': '<path d="M31 63h38M31 63l4-22 9 12 6-17 6 17 9-12 4 22"/><circle cx="50" cy="35" r="1.800"/><circle cx="35" cy="41" r="1.800"/><circle cx="65" cy="41" r="1.800"/>',
    'квинтэссенция': '<circle cx="50" cy="50" r="19"/><path d="M50 31l10.600 32.600L32.900 43.400h34.200L39.400 63.600Z"/>',
    'компас': '<circle cx="50" cy="50" r="19"/><path d="M50 34l6 16-6 16-6-16Z"/><path d="M44 50h12"/><path d="M50 29v3M50 68v3M29 50h3M68 50h3"/>',
    'левиафан': '<path d="M31 55c0-12 16-18 29-11l9-7-2 13c0 10-12 16-23 14-8-1-13-4-13-9Z"/><circle cx="57" cy="48" r="1.400"/><path d="M33 66q7-5 14 0t14 0 9 0"/>',
    'маяк': '<path d="M44 70l2-31h8l2 31Z"/><path d="M46 39v-6h8v6M50 28v5M37 35l9 3M63 35l-9 3M45 52h10M44 61h12"/>',
    'монолит': '<path d="M43 70V30h14v40Z"/><path d="M43 38h14M36 70h28"/>',
    'нексус': '<circle cx="50" cy="34" r="4"/><circle cx="33" cy="62" r="4"/><circle cx="67" cy="62" r="4"/><circle cx="50" cy="53" r="3"/><path d="M50 38v12M36 60l11-6M64 60L53 54M37 62h26"/>',
    'обелиск': '<path d="M44 71l2-32 4-9 4 9 2 32Z"/><path d="M40 71h20M46 48h8"/>',
    'орбита': '<ellipse cx="50" cy="50" rx="21" ry="8" transform="rotate(-28 50 50)"/><ellipse cx="50" cy="50" rx="21" ry="8" transform="rotate(28 50 50)"/><circle cx="50" cy="50" r="5"/>',
    'ореол': '<ellipse cx="50" cy="35" rx="14" ry="5"/><circle cx="50" cy="52" r="7"/><path d="M37 70a13 13 0 0 1 26 0"/>',
    'пламя': '<path d="M50 30c8 12 17 18 13 30-2 6-7 9-13 9s-11-4-12-10c-1-7 6-11 8-19 2 4 4 4 4-10Z"/><path d="M50 69c-4 0-7-3-6-7 1-3 4-5 6-9 2 4 6 6 6 10 0 4-2 6-6 6Z"/>',
    'призма': '<path d="M50 31l19 36H31Z"/><path d="M24 53l17 2M59 52l17-9M61 57l15-1M62 62l14 8"/>',
    'реликварий': '<path d="M35 47l15-13 15 13v22H35Z"/><path d="M35 47h30M44 55h12v8H44ZM50 27v6M47 30h6"/>',
    'сигил': '<circle cx="50" cy="50" r="19"/><path d="M50 31v38M34 41l32 18M66 41L34 59"/>',
    'сосуд': '<path d="M42 33h16M44 33v7c-8 4-10 17-4 25 2 3 6 4 10 4s8-1 10-4c6-8 4-21-4-25v-7"/><path d="M40 52h20"/>',
    'страж': '<path d="M50 30l17 6v16c0 11-8 17-17 19-9-2-17-8-17-19V36Z"/><path d="M50 38v26M42 47h16"/>',
    'тень': '<circle cx="50" cy="50" r="19"/><path d="M50 31a19 19 0 0 0 0 38 12 19 0 0 1 0-38Z"/>',
    'тессера': '<path d="M50 31l19 19-19 19-19-19Z"/><path d="M50 41l9 9-9 9-9-9Z"/><path d="M50 31v10M69 50H59M50 69V59M31 50h10"/>',
    'хронометр': '<circle cx="50" cy="50" r="19"/><path d="M50 37v13l8 6M50 31v3M69 50h-3M50 69v-3M31 50h3"/><path d="M46 28h8"/>',
    'шифр': '<circle cx="50" cy="50" r="19"/><circle cx="50" cy="50" r="11"/><path d="M50 31v8M50 61v8M31 50h8M61 50h8M37 37l6 6M63 37l-6 6M37 63l6-6M63 63l-6-6"/><circle cx="50" cy="50" r="2"/>',
    'шлем': '<path d="M34 58c0-15 8-24 16-24s16 9 16 24v8H34Z"/><path d="M34 58h32M44 58v8M56 58v8M42 47h16"/>',
    'шпиль': '<path d="M50 28l6 40H44Z"/><path d="M38 68h24M44 52h12M46 41h8"/>',
    'эгида': '<circle cx="50" cy="50" r="19"/><circle cx="50" cy="50" r="6"/><path d="M50 31v13M50 56v13M31 50h13M56 50h13"/>',
    'эхо': '<circle cx="42" cy="50" r="3"/><path d="M50 41a13 13 0 0 1 0 18M57 34a22 22 0 0 1 0 32M64 28a31 31 0 0 1 0 44"/>',
    'якорь': '<circle cx="50" cy="33" r="4"/><path d="M50 37v32M42 45h16M34 54c2 11 8 16 16 16s14-5 16-16M30 58l4-4 4 4M62 58l4-4 4 4"/>',
    'golda': '<circle cx="50" cy="50" r="19"/><path d="M61 42a12 12 0 1 0 0 16v-6H52"/>'
  };
  const icon = nm => IC[String(nm || '').split(/\s+/)[0].toLowerCase()] || '';
  /* Объёмный предмет на цветном фоне с узором из символов (модель, фон, символ — как у коллекционных подарков) */
  const BD = { 'аргентум': [212, 18], 'вечность': [262, 48], 'луна': [222, 30], 'обсидиан': [190, 32], 'оникс': [285, 24], 'солярис': [14, 62], 'спектр': [322, 52], 'янтарь': [38, 68], 'reserve': [150, 42], 'событий': [350, 48] };
  const MET = { common: ['#f7f9fc', '#b4bcc9', '#5f6877'], uncommon: ['#f0fbf6', '#a4d6bf', '#4f7f6d'], rare: ['#eef5ff', '#94baf0', '#415f96'], epic: ['#f8f1ff', '#c5a9f0', '#5f4096'], legendary: ['#fff8dc', '#ecc86e', '#8e6018'] };
  const SYMS = Object.keys(IC);
  const POS = [[14, 14], [50, 9], [86, 14], [9, 50], [91, 50], [14, 86], [50, 91], [86, 86], [31, 11], [69, 11], [31, 89], [69, 89], [11, 31], [11, 69], [89, 31], [89, 69]];
  const pal = g => { const w = String(g.name || '').split(/\s+/), k = (w[1] || '').toLowerCase(), p = BD[k] || [h32(w[1] || w[0] || 'x') % 360, 38]; return p; };
  const bgc = g => { const p = pal(g); return `hsl(${p[0]} ${p[1]}% 15%)`; };
  function colorize(mk, rar) {
    let ci = 0, open = '';
    const closed = mk.replace(/<(path|circle|ellipse|rect)\b([^>]*?)\/>/g, (m, tag, at) => {
      let isC = tag !== 'path';
      if (!isC) { const d = (at.match(/\bd="([^"]*)"/) || [])[1] || ''; const z = (d.match(/[zZ]/g) || []).length, mm = (d.match(/[Mm]/g) || []).length; isC = z > 0 && z === mm; }
      if (isC) return `<${tag}${at} fill="url(#${rar}${ci++ % 2 ? 'd' : 'l'})" stroke="#05080c" stroke-opacity=".55" stroke-width=".7"/>`;
      open += `<${tag}${at}/>`; return '';
    });
    return { closed, open };
  }
  function svg(g) {
    g = g || {}; const nm = String(g.name || ''), rar = MET[g.rarity] ? g.rarity : 'common', key = nm + '|' + rar; if (ART[key]) return ART[key];
    const w = nm.split(/\s+/), p = pal(g), mk = icon(nm), id = 'a' + h32(key).toString(36), m = MET[rar];
    const sym = SYMS[h32((w[1] || '') + nm) % SYMS.length], sk = IC[sym === (w[0] || '').toLowerCase() ? SYMS[(SYMS.indexOf(sym) + 7) % SYMS.length] : sym];
    const model = mk ? colorize(mk, id) : { closed: emblem(h32(nm)), open: '' };
    const pat = POS.map(q => `<use href="#${id}s" transform="translate(${q[0]} ${q[1]}) scale(.3) translate(-50 -50)"/>`).join('');
    const o = `<defs><radialGradient id="${id}b" cx=".5" cy=".36" r=".8"><stop offset="0" stop-color="hsl(${p[0]} ${p[1]}% 46%)"/><stop offset=".6" stop-color="hsl(${p[0]} ${p[1]}% 27%)"/><stop offset="1" stop-color="hsl(${p[0]} ${p[1]}% 13%)"/></radialGradient>
<linearGradient id="${id}l" gradientUnits="userSpaceOnUse" x1="32" y1="30" x2="68" y2="72"><stop offset="0" stop-color="${m[0]}"/><stop offset=".5" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></linearGradient>
<linearGradient id="${id}d" gradientUnits="userSpaceOnUse" x1="68" y1="30" x2="32" y2="72"><stop offset="0" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></linearGradient>
<radialGradient id="${id}g" cx=".35" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<g id="${id}s" fill="none" stroke="#fff" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round">${sk || ''}</g></defs>
<rect width="100" height="100" fill="url(#${id}b)"/><g opacity=".15">${pat}</g>
<ellipse cx="50" cy="79" rx="21" ry="3.400" fill="#000" opacity=".32"/>
<g transform="translate(50 49) scale(1.5) translate(-50 -50)" stroke-linecap="round" stroke-linejoin="round">${model.closed}${model.open ? `<g fill="none"><g stroke="#05080c" stroke-opacity=".5" stroke-width="3.400">${model.open}</g><g stroke="url(#${id}l)" stroke-width="2.200">${model.open}</g></g>` : ''}</g>
<rect width="100" height="100" fill="url(#${id}g)"/>`;
    return (ART[key] = `<svg class="ga" viewBox="0 0 100 100" aria-hidden="true">${o}</svg>`);
  }
  window.GoldaArt = { svg, h32, bg: bgc };
  /* старый набор мультяшных значков больше не нужен */
  window.giftSVG = n => svg({ name: n, rarity: 'rare' });

  /* ================= Очистка интерфейса от эмодзи (только элементы интерфейса, не переписка) ================= */
  const EMO = /(?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*|\uFE0F)/gu;
  const KEEP = new Set(['\u2714', '\u2715', '\u2716', '\u2709', '\u2022']);
  const SUB = { '\u2705': '\u2714', '\u274C': '\u2715', '\u2757': '', '\u2753': '' };
  const DENY = '.gs-who,.u-name,.uname,.prof-name,.mx-u span,.mx-pk b,.ci-name,.m-name,.chat-title,#chName,#uName,#uAbout,.about-t,.m-text,.rx,.rxc,.ci-prev,.ci-name,.m-name,textarea,input,[contenteditable],.stk,.emoji-grid,.emo-grid,.emoji-pick,.ep-grid,.ae-fb,.story-text,.rx-burst,.emo-pk,.react-pick,.rpick,.rp-bar,script,style,.bubble>.m-text';
  const ALLOW = 'button,.toast,.xo-title,.xo-top,.gs-t,.gs-k,.gs-hide,.gs-more,.gs-v,.gs-sell,.gs-del,.gs-ow,.sh-tabs,.sh-hint,.sh-sel,.sh-bal,.sg,.gf,.gm,.s2sh,.s2lbl,.mx,.tg-sec-h,.tg-lbl,.menu-i,.gf-empty,.tr-card,.g3,.f2m,.bm-sheet,.tix-card,.yp-big,.side-tabs,.g3-toast,.xo-empty,.settings-label,.s2empty,.empty-note';
  const ICON = {};
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
  const REAS = { launch: 'Подарок к запуску', welcome: 'Приветственный бонус', swap_in: 'Обмен gold на TIX', exchange: 'Обмен gold на TIX', send: 'Перевод', receive: 'Перевод получен', transfer_in: 'Перевод получен', transfer_out: 'Перевод отправлен', market_buy: 'Покупка на рынке', market_sell: 'Продажа на рынке', gift_buy: 'Покупка подарка', gift_sell: 'Продажа подарка', auction_bid: 'Ставка на аукционе', auction_sale: 'Продажа на аукционе', streak: 'Награда за серию', grant: 'Начисление', owner_grant: 'Начисление от создателя', owner_take: 'Списание создателем', owner_take_prime: 'Списание создателем' };
  const dtf = t => { const d = new Date(t); return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ''); };
  const ago = t => { const s = (Date.now() - new Date(t)) / 1000; return s < 60 ? 'сейчас' : s < 3600 ? Math.floor(s / 60) + ' мин назад' : s < 86400 ? Math.floor(s / 3600) + ' ч назад' : dtf(t); };
  const bgOf = g => bgc(g || {});
  const sheet = (h, f) => PG().sheet(h, f);
  const digits = el => { el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 12); }); };

  function wallet() {
    PG().open('tix', {
      title: 'TIX', big: 1, sub: 'Внутренняя валюта GOLDA', tab: 'set', async render(body) {
        const paint = async () => {
          const r = await rpc('tix_state'); const d = r.data;
          if (!d) { body.innerHTML = '<div class="s2empty">Не удалось загрузить кошелёк</div>'; return; }
          body.innerHTML = `<div class="mx mx-card"><div class="mx-bg">${svg({ name: 'Эгида Спектр', rarity: 'legendary' })}</div><div class="mx-l">Баланс</div><div class="mx-b">${fm(d.tix)}<span>TIX</span></div><div class="mx-s">${fm(d.gold)} gold · курс 1500 gold = 1 TIX</div></div>
            <div class="mx mx-act"><button data-a="swap">Купить TIX</button><button data-a="send">Перевод</button><button data-a="mkt">Рынок</button></div>${OWN() ? '<div class="mx mx-act one"><button data-a="own">Управление TIX (создатель)</button></div>' : ''}
            <div class="s2lbl">История</div>` + ((d.log || []).length ? d.log.map(x => `<div class="mx mx-lg"><div><b>${E(REAS[x.r] || 'Операция')}</b><small>${E(x.o || '')}${x.o ? ' · ' : ''}${E(dtf(x.t))}</small></div><span class="${num(x.d) < 0 ? 'neg' : 'pos'}">${num(x.d) > 0 ? '+' : ''}${fm(x.d)}</span></div>`).join('') : '<div class="s2empty">Операций пока нет</div>');
          body.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'swap') swapSheet(d, paint); else if (b.dataset.a === 'send') sendSheet(null, paint); else if (b.dataset.a === 'own') ownerTix(null, paint); else market(); };
        };
        await paint();
      }
    });
  }
  function swapSheet(st, done) {
    sheet(`<h3>Купить TIX за gold</h3><div class="mx mx-hint">Курс: 1500 gold = 1 TIX. Укажите, сколько TIX вы хотите получить.</div><input class="s2in" id="mxA" inputmode="numeric" placeholder="Сколько TIX" autocomplete="off"><div class="mx mx-hint" id="mxH"></div><button class="go" id="mxGo">Обменять</button>`, (ov, close) => {
      const a = Q('#mxA', ov), h = Q('#mxH', ov); digits(a);
      const upd = () => { const v = num(a.value); h.textContent = `К списанию: ${fm(v * 1500)} gold. Доступно: ${fm(st.gold)} gold.`; };
      a.oninput = () => { a.value = a.value.replace(/\D/g, '').slice(0, 9); upd(); }; upd();
      Q('#mxGo', ov).onclick = async () => {
        const v = num(a.value); if (v < 1) return tst('Введите количество', 'red'); const b = Q('#mxGo', ov); b.disabled = true;
        const r = await rpc('tix_swap', { p_dir: 'buy', p_amount: v }); b.disabled = false;
        if (r.data && r.data.ok) { tst('Получено ' + fm(v) + ' TIX'); close(); done && done(); } else tst(r.data && r.data.error === 'no_gold' ? 'Не хватает gold: нужно ' + fm(v * 1500) : eMsg(r), 'red');
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


  /* ================= Подарки и NFT в профиле ================= */
  async function gifts(el, uid) {
    if (!el) return; el.innerHTML = '<div class="s2empty">Загрузка…</div>';
    const own = uid === G(() => ME.id);
    const r = await sb.from('user_gifts').select('id,serial,msg,anon,hidden,locked,created_at,from_id,owner_id,gifts(name,emoji,kind,supply,rarity,bg1,bg2,price,image_url,collection)').eq('owner_id', uid).order('created_at', { ascending: false });
    if (r.error || !r.data) { el.innerHTML = '<div class="s2empty">Не удалось загрузить</div>'; return; }
    const all = (own || OWN()) ? r.data : r.data.filter(x => !x.hidden); let shown = 60;
    const nft = all.filter(x => x.gifts && x.gifts.kind === 'nft').length;
    const draw = () => {
      if (!all.length) { el.innerHTML = '<div class="s2empty">Подарков и NFT пока нет</div>'; return; }
      el.innerHTML = `<div class="mx mx-hint" style="margin:0 4px 8px">NFT: ${nft} · подарков: ${all.length - nft}</div><div class="mx mx-grid g3">${all.slice(0, shown).map(x => { const g = x.gifts || {}; return `<button type="button" class="mx-n" data-ug="${E(x.id)}">${art(g, x.serial)}<div class="mx-nm">${E(g.name)}</div>${x.locked ? '<div class="mx-pr mut">На рынке</div>' : ''}</button>`; }).join('')}</div>${all.length > shown ? '<button type="button" class="go mx-ghost" id="mxMore" style="margin-top:10px">Показать ещё</button>' : ''}`;
      const m = Q('#mxMore', el); if (m) m.onclick = () => { shown += 60; draw(); };
    };
    el.onclick = e => { const b = e.target.closest('[data-ug]'); if (!b) return; const ug = all.find(x => x.id === b.dataset.ug); if (ug && window.showGiftSheet) window.showGiftSheet(ug, () => gifts(el, uid)); };
    draw();
  }
  async function listNft(ug, done) {
    const r = await rpc('market_mine'); const it = (r.data || []).find(x => x.ug === ug.id);
    if (!it) { tst('NFT нельзя выставить: оно занято или не является NFT', 'red'); return; }
    mySheet(it, () => { done && done(); });
  }

  /* ================= Создатель: выдать и забрать TIX ================= */
  function ownerTix(uid, done) {
    if (!OWN()) return tst('Доступно только создателю', 'red');
    const users = (G(() => USERS) || []).filter(u => u && u.id && !BOTID.test(u.id));
    const me = G(() => ME); if (me && !users.some(u => u.id === me.id)) users.unshift(me);
    let pick = uid ? (users.find(u => u.id === uid) || G(() => PROFILES[uid]) || { id: uid }) : null;
    sheet(`<h3>Управление TIX</h3><div id="mxP"></div><input class="s2in" id="mxQ" placeholder="Поиск пользователя" autocomplete="off"><div class="mx mx-us" id="mxU"></div><input class="s2in" id="mxA" inputmode="numeric" placeholder="Количество TIX" autocomplete="off"><div class="mx mx-tm"><button class="go" id="mxGive">Выдать</button><button class="go mx-ghost" id="mxTake">Забрать</button></div><button class="go mx-ghost" id="mxSet" style="margin-top:8px">Установить баланс (0 — обнулить)</button>`, (ov, close) => {
      const P = Q('#mxP', ov), U = Q('#mxU', ov), qi = Q('#mxQ', ov), a = Q('#mxA', ov); a.addEventListener('input', () => { a.value = a.value.replace(/\D/g, '').slice(0, 15); });
      const nm = u => (u.id === (me && me.id) ? 'Я · ' : '') + (u.display_name || u.username || 'Пользователь');
      const drawP = () => { P.innerHTML = pick ? `<div class="mx mx-pk">${G(() => avatarHTML(pick, 's')) || ''}<b>${E(nm(pick))}</b><button type="button" id="mxX">Изменить</button></div>` : ''; U.style.display = pick ? 'none' : ''; qi.style.display = pick ? 'none' : ''; const x = Q('#mxX', ov); if (x) x.onclick = () => { pick = null; drawP(); drawU(); }; };
      const drawU = () => { const q = qi.value.trim().toLowerCase(); U.innerHTML = users.filter(u => !q || nm(u).toLowerCase().includes(q) || String(u.username || '').toLowerCase().includes(q)).slice(0, 40).map(u => `<button type="button" class="mx-u" data-u="${E(u.id)}">${G(() => avatarHTML(u, 's')) || ''}<span>${E(nm(u))}<small>@${E(u.username || '')}</small></span></button>`).join('') || '<div class="s2empty">Никого не найдено</div>'; };
      U.onclick = e => { const b = e.target.closest('[data-u]'); if (!b) return; pick = users.find(u => u.id === b.dataset.u); drawP(); }; qi.oninput = drawU; drawP(); drawU();
      const go = async (fn, okMsg) => { if (!pick) return tst('Выберите пользователя', 'red'); const v = num(a.value); if (v < 1) return tst('Введите количество', 'red'); const r = await rpc(fn, { p_user: pick.id, p_amount: v }); if (r.data && r.data.ok) { tst(okMsg(r.data, v)); close(); done && done(); } else tst(eMsg(r), 'red'); };
      Q('#mxSet', ov).onclick = async () => { if (!pick) return tst('Выберите пользователя', 'red'); if (a.value === '') return tst('Введите число (0 — обнулить)', 'red'); const r = await rpc('owner_set_tix', { p_user: pick.id, p_amount: num(a.value) }); if (r.data && r.data.ok) { tst('Баланс установлен: ' + fm(r.data.balance) + ' TIX'); close(); done && done(); } else tst(eMsg(r), 'red'); };
      Q('#mxGive', ov).onclick = () => go('owner_grant_tix', (d, v) => 'Выдано ' + fm(v) + ' TIX');
      Q('#mxTake', ov).onclick = () => go('owner_take_tix', d => 'Забрано ' + fm(d.taken) + ' TIX');
    });
  }


  /* ================= Верх профиля: балансы, магазин подарков, управление TIX ================= */
  async function balances(el) {
    if (!el) return; const r = await rpc('tix_state'); const d = r.data || {};
    el.innerHTML = `<div class="mx mx-card" style="padding:18px 20px"><div class="mx-l">Баланс</div><div class="mx-b" style="font-size:34px">${fm(d.tix)}<span>TIX</span></div><div class="mx-s">${fm(d.gold)} gold · курс 1500 gold = 1 TIX</div></div>
      <div class="mx mx-act"><button data-b="shop">Магазин подарков</button><button data-b="swap">Купить TIX</button><button data-b="wal">Кошелёк</button></div>${OWN() ? '<div class="mx mx-act" style="grid-template-columns:1fr 1fr"><button data-b="own">Выдать TIX себе</button><button data-b="own">Убрать TIX у себя</button></div>' : ''}`;
    el.onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; const k = b.dataset.b; if (k === 'shop') G(() => window.openGiftShop(ME.id)); else if (k === 'swap') swapSheet(d, () => balances(el)); else if (k === 'wal') wallet(); else if (k === 'own') ownerTix(G(() => ME.id), () => balances(el)); };
  }


  /* ================= Бан на время ================= */
  function tempBan(uid, name, done) {
    let unit = 60, val = '';
    sheet(`<h3>Бан на время</h3><div class="mx mx-hint">Пользователь @${E(name || '')} потеряет доступ на указанный срок и будет разблокирован автоматически.</div><div class="mx mx-seg"><button data-u="1">Минуты</button><button data-u="60" class="on">Часы</button><button data-u="1440">Дни</button></div><input class="s2in" id="mxA" inputmode="numeric" placeholder="На сколько" autocomplete="off"><div class="mx mx-hint" id="mxH"></div><div class="mx mx-ch"><button data-p="60">1 час</button><button data-p="1440">1 день</button><button data-p="10080">7 дней</button><button data-p="43200">30 дней</button></div><button class="go" id="mxGo">Забанить</button><button class="go mx-ghost" id="mxPerm" style="margin-top:8px">Забанить навсегда</button>`, (ov, close) => {
      const a = Q('#mxA', ov), h = Q('#mxH', ov);
      const mins = () => num(a.value) * unit;
      const upd = () => { const m = mins(); h.textContent = m > 0 ? 'До ' + new Date(Date.now() + m * 60000).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''; };
      a.oninput = () => { a.value = a.value.replace(/\D/g, '').slice(0, 6); upd(); };
      ov.addEventListener('click', e => {
        const u = e.target.closest('[data-u]'); if (u) { unit = +u.dataset.u; QA('[data-u]', ov).forEach(x => x.classList.toggle('on', x === u)); upd(); return; }
        const p = e.target.closest('[data-p]'); if (p) { const m = +p.dataset.p; if (m % 1440 === 0) { unit = 1440; a.value = m / 1440; } else { unit = 60; a.value = m / 60; } QA('[data-u]', ov).forEach(x => x.classList.toggle('on', +x.dataset.u === unit)); upd(); }
      });
      const go = async m => { const r = await rpc('admin_ban', { p_user: uid, p_minutes: m }); if (r.data && r.data.ok) { tst('Готово'); close(); done && done(); } else tst(r.data && r.data.error === 'protected' ? 'Этого пользователя банить нельзя' : eMsg(r), 'red'); };
      Q('#mxGo', ov).onclick = () => { const m = mins(); if (m < 1) return tst('Укажите срок', 'red'); go(m); };
      Q('#mxPerm', ov).onclick = () => go(0);
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
    o.innerHTML = `<div class="mx-lc"><div class="mx-lart">${svg({ name: 'Маяк Янтарь', rarity: 'legendary' })}</div><div class="mx-lk">GOLDA 2.1</div><h2>Мессенджер вышел из беты</h2><p>Спасибо, что были с нами с самого начала. Теперь GOLDA работает в полную силу.</p><div class="mx-li">${items.map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div><button class="go" id="mxLgo">Получить 100 TIX</button><small>Приветственный бонус начисляется один раз.</small></div>`;
    document.body.appendChild(o);
    Q('#mxLgo', o).onclick = async () => {
      const b = Q('#mxLgo', o); b.disabled = true; b.textContent = 'Начисляем…';
      const r = await rpc('launch_claim');
      if (r.data && (r.data.ok || r.data.error === 'already')) { LS.s('golda_rel1_' + me.id, '1'); G(() => { ME.flags = Object.assign({}, ME.flags, { rel1: '1' }); }); o.remove(); launchBusy = false; if (r.data.ok) tst('На ваш счёт зачислено 100 TIX'); }
      else { b.disabled = false; b.textContent = 'Получить 100 TIX'; tst('Нет соединения, попробуйте ещё раз', 'red'); }
    };
  }
  let tries = 0; (function wait() { if (ME_() && ME_().id && Q('#app,.app,.side')) { setTimeout(launch, 1800); } else if (tries++ < 400) setTimeout(wait, 800); })();

  try { const so = sb.auth.signOut.bind(sb.auth); sb.auth.signOut = function () { try { localStorage.removeItem('golda_sess_bak'); } catch (e) { } return so.apply(null, arguments); }; } catch (e) { }
  /* резервная копия сессии: если браузер потерял основной ключ, вход восстановится */
  setInterval(() => { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) { const v = localStorage.getItem(k); if (v && v.length > 50) localStorage.setItem('golda_sess_bak', JSON.stringify({ k, v })); return; } } } catch (e) { } }, 15000);
  window.GoldaMint = { tempBan, wallet, market, tools, gifts, balances, listNft, ownerTix, send: uid => sendSheet(uid), launch, sweep: () => sweep(document.body) };
  function start() { sweep(document.body); mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
