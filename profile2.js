/* golda-mesenger: профиль на весь экран как в Telegram, подарки и NFT, магазин подарков, меню ботов */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => String(Math.floor(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const GOLD = '00000000-0000-4000-8000-000000901d07', GOLDA = '00000000-0000-4000-8000-00000000b001', PRIME = '00000000-0000-4000-8000-00000000b002';
  const OWNERS = ['03d24548-56f1-4329-a7f0-466c18b8a8c9', '6c02c4d5-c674-432d-9a5c-86e31c465790'];
  const isOwner = () => OWNERS.includes(meId());
  const BOTS = { [GOLD]: 'gold', [GOLDA]: 'golda', [PRIME]: 'prime' };
  const RAR = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
  const meId = () => (typeof ME !== 'undefined' && ME) ? ME.id : null;
  /* анимированные эмодзи (Noto Animated Emoji); если анимации нет — обычный эмодзи с лёгким покачиванием */
  const ae = e => { const cp = [...String(e)].map(c => c.codePointAt(0).toString(16)).join('_'); return `<img class="ae" alt="${E(e)}" data-e="${E(e)}" data-t="0" src="https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/512.webp" loading="lazy">`; };
  document.addEventListener('error', ev => {
    const im = ev.target; if (!im || im.tagName !== 'IMG' || !im.classList.contains('ae')) return;
    const e = im.dataset.e; if (im.dataset.t === '0' && /fe0f/.test(im.src)) { im.dataset.t = '1'; im.src = im.src.replace(/_fe0f/g, ''); return; }
    const sp = document.createElement('span'); sp.className = 'ae-fb'; sp.textContent = e; im.replaceWith(sp);
  }, true);
  const gi = g => g.image_url ? `<img class="ae gi" alt="${E(g.name)}" src="${E(g.image_url)}" loading="lazy">` : ae(g.emoji);
  const say = (t, k) => { try { toast(t, k); } catch (e) { } };

  /* ---------- подарки: карточки ---------- */
  function giftCard(ug) {
    const g = ug.gifts || {};
    return `<button type="button" class="gf ${g.kind === 'nft' ? 'nft' : ''} r-${E(g.rarity)}" data-ug="${E(ug.id)}" style="background:linear-gradient(160deg,${E(g.bg1)},${E(g.bg2)})"><span class="gf-e">${gi(g)}</span><span class="gf-n">${E(g.name)}</span>${ug.serial ? `<span class="gf-s">#${ug.serial}</span>` : ''}</button>`;
  }
  async function loadGifts(uid, box, cnt) {
    box.innerHTML = '<div class="gf-empty">Загрузка…</div>';
    const { data, error } = await sb.from('user_gifts').select('id,serial,msg,anon,hidden,created_at,from_id,owner_id,gifts(name,emoji,kind,supply,rarity,bg1,bg2,price,image_url)').eq('owner_id', uid).order('created_at', { ascending: false });
    if (error || !data) { box.innerHTML = '<div class="gf-empty">Не удалось загрузить</div>'; return; }
    const list = uid === meId() ? data.slice() : data.filter(x => !x.hidden); box._d = list; if (cnt) cnt.textContent = list.length ? list.length : '';
    box.innerHTML = list.length ? list.map(giftCard).join('') : '<div class="gf-empty">Подарков пока нет 🎁</div>';
  }
  const who = id => (typeof PROFILES !== 'undefined' && PROFILES[id]) || (typeof USERS !== 'undefined' && USERS.find(u => u.id === id)) || null;
  const dt = d => new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' в');
  function showGift(ug, onChange) {
    const g = ug.gifts, mine = ug.owner_id === meId(), from = ug.anon ? null : who(ug.from_id), to = who(ug.owner_id);
    const o = document.createElement('div'); o.className = 'gs-ov';
    const rows = [['От', ug.anon ? '<span class="gs-mut">Скрыто</span>' : `<span class="gs-who">${from ? avatarHTML(from, 's') : ''}<b>${E(from ? (from.display_name || from.username) : '—')}</b></span>`]];
    if (!mine) rows.push(['Кому', `<span class="gs-who">${to ? avatarHTML(to, 's') : ''}<b>${E(to ? (to.display_name || to.username) : '—')}</b></span>`]);
    rows.push(['Дата', E(dt(ug.created_at))], ['Стоимость', '💎 ' + fmt(g.price)]);
    if (ug.serial) rows.push(['NFT', `#${ug.serial}${g.supply ? ' из ' + g.supply : ''} · ${RAR[g.rarity] || ''}`]);
    o.innerHTML = `<div class="gs" style="--g1:${E(g.bg1)};--g2:${E(g.bg2)}"><div class="gs-grab"></div><div class="gs-halo">${gi(g)}</div>
      <div class="gs-t">${mine ? 'Подарок Вам' : 'Подарок для ' + E(to ? (to.display_name || to.username) : '')}</div><div class="gs-n">${E(g.name)}</div>
      ${ug.msg ? `<div class="gs-m">${E(ug.msg)}</div>` : ''}
      <div class="gs-tab">${rows.map(r => `<div class="gs-r"><div class="gs-k">${r[0]}</div><div class="gs-v">${r[1]}</div></div>`).join('')}</div>
      ${mine ? `<div class="gs-hide">Подарок ${ug.hidden ? 'скрыт из' : 'виден в'} вашем профиле. <button type="button" id="gsHide">${ug.hidden ? 'Показать' : 'Скрыть'} ›</button></div>` : ''}
      <button class="gs-ok" type="button">OK</button>${mine ? '<button class="gs-del" type="button" id="gsDel">🗑 Удалить из профиля</button>' : ''}</div>`;
    o.onclick = async ev => {
      if (ev.target === o || ev.target.closest('.gs-ok')) return o.remove();
      if (ev.target.id === 'gsDel') { const b = ev.target; if (!b.dataset.s) { b.dataset.s = 1; b.textContent = 'Точно удалить? Нажми ещё раз'; return; } const { error } = await sb.rpc('delete_gift', { p_id: ug.id }); if (!error) { say('Подарок удалён'); o.remove(); if (onChange) onChange(); } else say('Не удалось удалить', 'red'); return; }
      if (ev.target.id === 'gsHide') { const h = !ug.hidden; const { error } = await sb.rpc('hide_gift', { p_id: ug.id, p_hide: h }); if (!error) { ug.hidden = h; say(h ? 'Подарок скрыт из профиля' : 'Подарок снова в профиле'); o.remove(); if (onChange) onChange(); } }
    };
    document.body.appendChild(o);
  }
  window.showGiftSheet = showGift;
  document.addEventListener('click', e => {
    const b = e.target.closest('.gf[data-ug]'); if (!b) return;
    const box = b.closest('.gift-grid'), ug = (box._d || []).find(x => x.id === b.dataset.ug); if (!ug) return;
    showGift(ug, () => { const id = box.id === 'mGifts' ? meId() : (lastUser && lastUser.id); if (id) loadGifts(id, box, box.id === 'mGifts' ? $('#mGiftCnt') : $('#uGiftCnt')); });
  });

  /* ---------- подарок в переписке ---------- */
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf, GC = {};
  window.parseMedia = function (c) { const m = String(c).match(/^\[\[gift\|([0-9a-f-]{36})\]\]([\s\S]*)$/); return m ? { kind: 'gift', id: m[1], cap: '' } : _pm(c); };
  function giftMsgBody(ug) {
    if (!ug) return '<div class="gm-load">🎁 Подарок…</div>';
    const g = ug.gifts, to = who(ug.owner_id), from = who(ug.from_id);
    return `<div class="gm" style="background:linear-gradient(160deg,${E(g.bg1)},${E(g.bg2)})"><div class="gm-e">${gi(g)}</div><div class="gm-i"><div class="gm-h">🎁 ${E(from ? (from.display_name || from.username) : '')} → ${E(to ? (to.display_name || to.username) : '')}</div><div class="gm-n">${E(g.name)}</div><div class="gm-s">${ug.serial ? `NFT #${ug.serial}${g.supply ? ' из ' + g.supply : ''} · ` : ''}💎 ${fmt(g.price)}</div>${ug.msg ? `<div class="gm-t">${E(ug.msg)}</div>` : ''}</div></div>`;
  }
  window.mediaHTML = function (md) { if (md && md.kind === 'gift') return `<div class="gift-msg" data-id="${E(md.id)}">${giftMsgBody(GC[md.id])}</div>`; return _mh(md); };
  window.previewOf = function (lm, chat) { const md = window.parseMedia(lm.content); if (md && md.kind === 'gift') return (lm.sender_id === meId() ? 'Вы: ' : '') + '🎁 Подарок'; return _pv(lm, chat); };
  async function hydrateGifts() {
    for (const el of document.querySelectorAll('.gift-msg')) {
      if (el.dataset.l) continue; el.dataset.l = 1;
      const { data } = await sb.from('user_gifts').select('id,serial,msg,anon,hidden,created_at,from_id,owner_id,gifts(name,emoji,kind,supply,rarity,bg1,bg2,price,image_url)').eq('id', el.dataset.id).maybeSingle();
      if (data) { GC[data.id] = data; el.innerHTML = giftMsgBody(data); el._ug = data; }
    }
  }
  new MutationObserver(hydrateGifts).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', e => { const el = e.target.closest('.gift-msg'); if (el && GC[el.dataset.id]) showGift(GC[el.dataset.id]); });

  /* ---------- магазин подарков ---------- */
  async function openShop(uid) {
    const u = (typeof PROFILES !== 'undefined' && PROFILES[uid]) || (typeof USERS !== 'undefined' && USERS.find(x => x.id === uid)) || {};
    const [gr, wr] = await Promise.all([sb.from('gifts').select('*').order('price', { ascending: false }), sb.from('prime_wallets').select('balance').maybeSingle()]);
    const gifts = gr.data || []; let bal = (wr.data && wr.data.balance) || 0, tab = 'gift', sel = null;
    const o = document.createElement('div'); o.className = 'xo shop';
    o.innerHTML = `<div class="xo-top"><button class="icon-btn x" type="button" data-x>✕</button><div class="xo-title">Подарок для ${E(u.display_name || u.username || '')}</div><div class="sh-bal" id="shBal"></div></div>
      <div class="sh-tabs"><button data-t="gift" class="on">🎁 Подарки</button><button data-t="nft">💎 NFT</button></div>
      <div class="sh-grid" id="shGrid"></div>
      <div class="sh-buy" id="shBuy"></div>`;
    document.body.appendChild(o);
    const paintBal = () => o.querySelector('#shBal').textContent = '💎 ' + fmt(bal);
    function grid() {
      o.querySelector('#shGrid').innerHTML = gifts.filter(g => g.kind === tab).sort((a, b) => tab === 'nft' ? b.price - a.price : a.price - b.price).map(g => {
        const left = g.supply ? g.supply - g.sold : null, out = left !== null && left <= 0;
        return `<button type="button" class="sg ${out ? 'out' : ''} ${sel && sel.id === g.id ? 'sel' : ''}" data-id="${g.id}" style="background:linear-gradient(160deg,${E(g.bg1)},${E(g.bg2)})"><span class="gf-e">${gi(g)}</span><span class="gf-n">${E(g.name)}</span><span class="sg-p">💎 ${fmt(g.price)}</span>${left !== null ? `<span class="gf-s">${out ? 'распродано' : 'осталось ' + left}</span>` : ''}</button>`;
      }).join('');
    }
    function buy() {
      const b = o.querySelector('#shBuy');
      if (!sel) { b.innerHTML = '<div class="sh-hint">Выбери подарок</div>'; return; }
      b.innerHTML = `<div class="sh-sel">${E(sel.emoji)} <b>${E(sel.name)}</b> — 💎 ${fmt(sel.price)}</div><input class="inp" id="shMsg" maxlength="200" placeholder="Добавить сообщение (необязательно)"><label class="sh-anon"><input type="checkbox" id="shAnon"> Скрыть, что это от меня</label><button class="btn primary" id="shGo" type="button">Подарить за 💎 ${fmt(sel.price)}</button>${isOwner() ? '<button class="btn ghost" id="shIcon" type="button" style="margin-top:8px;width:100%">🖼 Задать иконку подарка</button><input type="file" id="shIconIn" accept="image/*" class="hidden">' : ''}`;
      const ic = b.querySelector('#shIcon'); if (ic) { ic.onclick = () => b.querySelector('#shIconIn').click(); b.querySelector('#shIconIn').onchange = async ev => {
        const f = ev.target.files[0]; if (!f) return; ic.disabled = true; ic.textContent = 'Загружаем…';
        try { const path = 'gifts/' + sel.id + '_' + Date.now() + '.' + (f.name.split('.').pop() || 'png').toLowerCase(); const up = await sb.storage.from('avatars').upload(path, f, { upsert: true, contentType: f.type });
          if (up.error) throw up.error; const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
          const r = await sb.rpc('owner_set_gift_image', { p_gift: sel.id, p_url: url }); if (!r.data) throw 0; sel.image_url = url; say('Иконка сохранена'); grid(); buy();
        } catch (er) { ic.disabled = false; ic.textContent = '🖼 Задать иконку подарка'; say('Не удалось загрузить иконку', 'red'); } }; }
      b.querySelector('#shGo').onclick = async () => {
        const go = b.querySelector('#shGo'); go.disabled = true; go.textContent = 'Отправляем…';
        const { data, error } = await sb.rpc('send_gift', { p_gift: sel.id, p_to: uid, p_msg: b.querySelector('#shMsg').value, p_anon: b.querySelector('#shAnon').checked });
        if (error || !data || !data.ok) {
          const er = data && data.error; go.disabled = false; go.textContent = 'Подарить за 💎 ' + fmt(sel.price);
          say(er === 'no_money' ? 'Не хватает праймиков 💎' : er === 'sold_out' ? 'Этот NFT распродан' : 'Не получилось отправить', 'red'); return;
        }
        say('Подарок отправлен 🎁'); o.remove();
        const box = $('#uGifts'); if (box && $('#userOverlay').classList.contains('open')) loadGifts(uid, box, $('#uGiftCnt')); const mb = $('#mGifts'); if (mb && uid === meId()) loadGifts(uid, mb, $('#mGiftCnt'));
      };
    }
    o.onclick = e => {
      if (e.target.closest('[data-x]')) return o.remove();
      const t = e.target.closest('.sh-tabs button'); if (t) { tab = t.dataset.t; sel = null; o.querySelectorAll('.sh-tabs button').forEach(x => x.classList.toggle('on', x === t)); grid(); buy(); return; }
      const c = e.target.closest('.sg'); if (c && !c.classList.contains('out')) { sel = gifts.find(g => g.id === +c.dataset.id); grid(); buy(); }
    };
    paintBal(); grid(); buy();
  }
  window.openGiftShop = openShop;

  /* ---------- профиль другого пользователя (на весь экран) ---------- */
  let lastUser = null;
  function ensureUserUi() {
    const ov = $('#userOverlay'); if (!ov || ov.dataset.tg) return; ov.dataset.tg = 1; ov.classList.add('tg-prof');
    const modal = ov.querySelector('.modal'), about = $('#uAbout'), lbl = about && about.previousElementSibling;
    const act = document.createElement('div'); act.id = 'uActions'; act.className = 'tg-act';
    act.innerHTML = `<button type="button" data-a="write"><i>✉</i><span>Написать</span></button><button type="button" data-a="call"><i>📞</i><span>Звонок</span></button><button type="button" data-a="video"><i>🎥</i><span>Видео</span></button><button type="button" data-a="gift"><i>🎁</i><span>Подарить</span></button>`;
    modal.querySelector('.prof-row').after(act);
    const sec = document.createElement('div'); sec.className = 'tg-sec'; sec.id = 'uGiftSec';
    sec.innerHTML = '<div class="tg-sec-h">🎁 Подарки <span id="uGiftCnt" class="tg-cnt"></span></div><div class="gift-grid" id="uGifts"></div>';
    const rb = modal.querySelector('.row-btns'); rb.before(sec);
    if (lbl) lbl.classList.add('tg-lbl');
    act.onclick = async e => {
      const b = e.target.closest('button'); if (!b || !lastUser) return;
      const id = lastUser.id;
      if (b.dataset.a === 'write') { ov.classList.remove('open'); await openDirectWith(id); }
      else if (b.dataset.a === 'gift') openShop(id);
      else { ov.classList.remove('open'); await openDirectWith(id); setTimeout(() => { const x = $(b.dataset.a === 'call' ? '#callAudioBtn' : '#callVideoBtn'); if (x) x.click(); }, 500); }
    };
  }
  const _ou = window.openUserModal;
  if (typeof _ou === 'function') {
    window.openUserModal = function (u) {
      _ou(u); try {
        ensureUserUi(); lastUser = u;
        const isBot = !!BOTS[u.id], me = u.id === meId();
        $('#uActions').style.display = me ? 'none' : '';
        $('#uActions').querySelectorAll('[data-a=call],[data-a=video],[data-a=gift]').forEach(b => b.style.display = isBot ? 'none' : '');
        $('#uGiftSec').style.display = isBot ? 'none' : '';
        if (!isBot) loadGifts(u.id, $('#uGifts'), $('#uGiftCnt'));
        ownerTools(u, isBot || me);
      } catch (e) { console.error(e); }
    };
  }

  function ask(title, ph, val, cb) {
    const o = document.createElement('div'); o.className = 'gs-ov';
    o.innerHTML = `<div class="gs"><div class="gs-grab"></div><div class="gs-t" style="font-size:19px">${E(title)}</div><input class="inp" id="askIn" style="margin-top:14px;width:100%" placeholder="${E(ph)}" value="${E(val || '')}"><button class="gs-ok" type="button">Готово</button></div>`;
    o.onclick = ev => { if (ev.target === o) return o.remove(); if (ev.target.closest('.gs-ok')) { const v = o.querySelector('#askIn').value; o.remove(); cb(v); } };
    document.body.appendChild(o); setTimeout(() => o.querySelector('#askIn').focus(), 100);
  }
  function ownerTools(u, hide) {
    let box = $('#uOwner');
    if (!box) { box = document.createElement('div'); box.id = 'uOwner'; box.className = 'tg-sec'; $('#uGiftSec').after(box); }
    if (!isOwner() || hide) { box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = '<div class="tg-sec-h">👑 Создатель</div><div class="ow-b"><button type="button" id="owTake">💰 Забрать gold</button><button type="button" id="owName">✏️ Сменить юзернейм</button></div><div class="ow-i" id="owInfo"></div>';
    sb.from('gold_wallets').select('balance').eq('user_id', u.id).maybeSingle().then(r => { const i = $('#owInfo'); if (i) i.textContent = 'У пользователя: ' + fmt((r.data && r.data.balance) || 0) + ' gold'; });
    $('#owTake').onclick = () => ask('Сколько gold забрать у @' + u.username + '?', 'Например 500', '', async v => {
      const n = parseInt(String(v).replace(/\s/g, ''), 10); if (!(n > 0)) return say('Введи число больше нуля', 'red');
      const { data } = await sb.rpc('owner_take_gold', { p_user: u.id, p_amount: n });
      if (data && data.ok) { say('Забрано ' + fmt(data.taken) + ' gold'); $('#owInfo').textContent = 'У пользователя: ' + fmt(data.balance) + ' gold'; } else say('Не получилось', 'red');
    });
    $('#owName').onclick = () => ask('Новый юзернейм для @' + u.username, 'латиница, цифры, _ (3–20)', u.username, async v => {
      const { data } = await sb.rpc('owner_set_username', { p_user: u.id, p_name: v });
      if (data && data.ok) { u.username = data.username; if (typeof PROFILES !== 'undefined' && PROFILES[u.id]) PROFILES[u.id].username = data.username; $('#uUname').textContent = '@' + data.username; say('Юзернейм изменён'); }
      else say(data && data.error === 'taken' ? 'Этот юзернейм занят' : data && data.error === 'bad_name' ? 'Только латиница, цифры и _ (3–20)' : 'Не получилось', 'red');
    });
  }

  /* ---------- мой профиль: баланс праймиков и подарки ---------- */
  const _om = window.openMyProfile;
  if (typeof _om === 'function') {
    window.openMyProfile = function () {
      _om(); try {
        const ov = $('#profileOverlay'); ov.classList.add('tg-prof');
        const modal = ov.querySelector('.modal'); let sec = $('#mGiftSec');
        if (!sec) {
          sec = document.createElement('div'); sec.id = 'mGiftSec'; sec.className = 'tg-sec';
          sec.innerHTML = '<div class="tg-sec-h">💎 Праймики: <b id="mPrime">…</b></div><div class="tg-sec-h" style="margin-top:14px">🎁 Мои подарки <span id="mGiftCnt" class="tg-cnt"></span></div><div class="gift-grid" id="mGifts"></div>';
          modal.querySelector('.pf-ava').after(sec);
          const sg = document.createElement('button'); sg.type = 'button'; sg.className = 'btn ghost'; sg.id = 'mGiftSelf'; sg.style.cssText = 'margin-top:12px;width:100%';
          sg.textContent = '🎁 Подарить подарок себе'; sg.onclick = () => openShop(meId()); sec.appendChild(sg);
        }
        loadGifts(meId(), $('#mGifts'), $('#mGiftCnt'));
        sb.from('prime_wallets').select('balance').maybeSingle().then(r => { $('#mPrime').textContent = fmt((r.data && r.data.balance) || 0); });
      } catch (e) { console.error(e); }
    };
  }

  /* ---------- меню бота вместо кучи кнопок ---------- */
  function botNow() {
    if (typeof CHATS === 'undefined' || typeof CURRENT === 'undefined' || !CURRENT) return null;
    const chat = CHATS.find(c => c.id === CURRENT); if (!chat || chat.type !== 'direct') return null;
    const o = (chat.members || []).find(m => m.id !== meId()); return o && BOTS[o.id] ? { kind: BOTS[o.id], peer: o } : null;
  }
  function sendText(t) { const i = $('#msgInput'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); $('#sendBtn').click(); }
  function prefill(t) { const i = $('#msgInput'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); }
  let bet = 100;
  function menuItems(kind) {
    const owner = isOwner();
    if (kind === 'gold') return [
      ['💰 Баланс', () => sendText('баланс')], ['🎁 Бонус', () => sendText('бонус')], ['🏆 Топ', () => sendText('топ')], ['❓ Помощь', () => sendText('помощь')],
      ['🔴 Красное', () => sendText('рулетка ' + bet + ' к')], ['⚫ Чёрное', () => sendText('рулетка ' + bet + ' ч')], ['🟢 Зеро', () => sendText('рулетка ' + bet + ' з')], ['💣 Мины', () => sendText('мины ' + bet)],
      ['🪙 Орёл', () => sendText('монетка ' + bet + ' орёл')], ['🪙 Решка', () => sendText('монетка ' + bet + ' решка')], ['🎲 Кости', () => sendText('кости ' + bet)],
      ['💸 Перевод…', () => prefill('перевод @')]
    ].concat(owner ? [['✨ Выдать себе…', () => prefill('@megold ')]] : []);
    if (kind === 'prime') return [
      ['💎 Баланс', () => sendText('баланс')], ['🧾 История', () => sendText('история')], ['🎁 Подарки', () => sendText('подарки')], ['❓ Помощь', () => sendText('помощь')], ['🪙 Получить gold', () => sendText('купить')], ['💸 Перевод…', () => prefill('перевод @')]
    ].concat(owner ? [['✨ Выдать…', () => prefill('праймики @')]] : []);
    return [];
  }
  function openMenu(bot) {
    const o = document.createElement('div'); o.className = 'bm-ov';
    const chips = bot.kind === 'gold' ? `<div class="bm-bet">Ставка: ${[50, 100, 500, 1000].map(v => `<button type="button" data-b="${v}" class="${v === bet ? 'on' : ''}">${v}</button>`).join('')}</div>` : '';
    const items = menuItems(bot.kind);
    o.innerHTML = `<div class="bm-sheet"><div class="bm-grab"></div><div class="bm-title">${E(bot.peer.display_name || bot.peer.username)} · меню</div>${chips}<div class="bm-grid">${items.map((it, i) => `<button type="button" data-i="${i}">${it[0]}</button>`).join('')}</div></div>`;
    o.onclick = e => {
      if (e.target === o) return o.remove();
      const b = e.target.closest('[data-b]'); if (b) { bet = +b.dataset.b; o.querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', x === b)); return; }
      const c = e.target.closest('[data-i]'); if (c) { o.remove(); items[+c.dataset.i][1](); }
    };
    document.body.appendChild(o);
  }
  function tickBot() {
    const bot = botNow(), inner = $('.ib-inner'); document.body.classList.toggle('in-bot', !!bot); document.body.classList.toggle('bot-sys', !!bot && bot.kind === 'golda');
    if (!inner) return; let btn = $('#botMenuBtn');
    if (!btn) { btn = document.createElement('button'); btn.id = 'botMenuBtn'; btn.type = 'button'; btn.className = 'icon-btn'; btn.title = 'Меню бота'; btn.textContent = '☰'; btn.onclick = () => { const b = botNow(); if (b) openMenu(b); }; inner.prepend(btn); }
    btn.style.display = bot && bot.kind !== 'golda' ? '' : 'none';
    let note = $('#botSysNote'); const msgs = $('#messages');
    if (bot && bot.kind === 'golda') { if (!note && msgs) { note = document.createElement('div'); note.id = 'botSysNote'; note.textContent = 'Системный бот — отвечать ему не нужно'; $('#inputBar').after(note); } }
    else if (note) note.remove();
  }
  setInterval(tickBot, 500);
})();
