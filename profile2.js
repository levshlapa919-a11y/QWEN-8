/* golda-mesenger: профиль на весь экран как в Telegram, подарки и NFT, магазин подарков, меню ботов */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => String(Math.floor(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const GOLD = '00000000-0000-4000-8000-000000901d07', GOLDA = '00000000-0000-4000-8000-00000000b001', PRIME = '00000000-0000-4000-8000-00000000b002';
  const OWNER = '03d24548-56f1-4329-a7f0-466c18b8a8c9';
  const BOTS = { [GOLD]: 'gold', [GOLDA]: 'golda', [PRIME]: 'prime' };
  const RAR = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
  const meId = () => (typeof ME !== 'undefined' && ME) ? ME.id : null;
  const say = (t, k) => { try { toast(t, k); } catch (e) { } };

  /* ---------- подарки: карточки ---------- */
  function giftCard(ug) {
    const g = ug.gifts || {};
    return `<button type="button" class="gf ${g.kind === 'nft' ? 'nft' : ''} r-${E(g.rarity)}" data-ug="${E(ug.id)}" style="background:linear-gradient(160deg,${E(g.bg1)},${E(g.bg2)})"><span class="gf-e">${E(g.emoji)}</span><span class="gf-n">${E(g.name)}</span>${ug.serial ? `<span class="gf-s">#${ug.serial}</span>` : ''}</button>`;
  }
  async function loadGifts(uid, box, cnt) {
    box.innerHTML = '<div class="gf-empty">Загрузка…</div>';
    const { data, error } = await sb.from('user_gifts').select('id,serial,msg,anon,created_at,from_id,gifts(name,emoji,kind,supply,rarity,bg1,bg2)').eq('owner_id', uid).order('created_at', { ascending: false });
    if (error || !data) { box.innerHTML = '<div class="gf-empty">Не удалось загрузить</div>'; return; }
    box._d = data; if (cnt) cnt.textContent = data.length ? data.length : '';
    box.innerHTML = data.length ? data.map(giftCard).join('') : '<div class="gf-empty">Подарков пока нет 🎁</div>';
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.gf[data-ug]'); if (!b) return;
    const box = b.closest('.gift-grid'), ug = (box._d || []).find(x => x.id === b.dataset.ug); if (!ug) return;
    const g = ug.gifts, from = ug.anon ? null : (PROFILES[ug.from_id] || (typeof USERS !== 'undefined' ? USERS.find(u => u.id === ug.from_id) : null));
    const o = document.createElement('div'); o.className = 'gd-ov';
    o.innerHTML = `<div class="gd" style="background:linear-gradient(160deg,${E(g.bg1)},${E(g.bg2)})"><button class="gd-x" type="button">✕</button><div class="gd-e">${E(g.emoji)}</div><div class="gd-n">${E(g.name)}</div><div class="gd-r">${g.kind === 'nft' ? 'NFT · ' : ''}${RAR[g.rarity] || ''}${ug.serial ? ` · #${ug.serial} из ${g.supply}` : ''}</div><div class="gd-i">${ug.anon ? 'От: скрыто' : 'От: ' + E(from ? (from.display_name || from.username) : '—')}</div>${ug.msg ? `<div class="gd-m">${E(ug.msg)}</div>` : ''}<div class="gd-d">${new Date(ug.created_at).toLocaleDateString('ru-RU')}</div></div>`;
    o.onclick = ev => { if (ev.target === o || ev.target.closest('.gd-x')) o.remove(); };
    document.body.appendChild(o);
  });

  /* ---------- магазин подарков ---------- */
  async function openShop(uid) {
    const u = (typeof PROFILES !== 'undefined' && PROFILES[uid]) || (typeof USERS !== 'undefined' && USERS.find(x => x.id === uid)) || {};
    const [gr, wr] = await Promise.all([sb.from('gifts').select('*').order('price'), sb.from('prime_wallets').select('balance').maybeSingle()]);
    const gifts = gr.data || []; let bal = (wr.data && wr.data.balance) || 0, tab = 'gift', sel = null;
    const o = document.createElement('div'); o.className = 'xo shop';
    o.innerHTML = `<div class="xo-top"><button class="icon-btn x" type="button" data-x>✕</button><div class="xo-title">Подарок для ${E(u.display_name || u.username || '')}</div><div class="sh-bal" id="shBal"></div></div>
      <div class="sh-tabs"><button data-t="gift" class="on">🎁 Подарки</button><button data-t="nft">💎 NFT</button></div>
      <div class="sh-grid" id="shGrid"></div>
      <div class="sh-buy" id="shBuy"></div>`;
    document.body.appendChild(o);
    const paintBal = () => o.querySelector('#shBal').textContent = '💎 ' + fmt(bal);
    function grid() {
      o.querySelector('#shGrid').innerHTML = gifts.filter(g => g.kind === tab).map(g => {
        const left = g.supply ? g.supply - g.sold : null, out = left !== null && left <= 0;
        return `<button type="button" class="sg ${out ? 'out' : ''} ${sel && sel.id === g.id ? 'sel' : ''}" data-id="${g.id}" style="background:linear-gradient(160deg,${E(g.bg1)},${E(g.bg2)})"><span class="gf-e">${E(g.emoji)}</span><span class="gf-n">${E(g.name)}</span><span class="sg-p">💎 ${fmt(g.price)}</span>${left !== null ? `<span class="gf-s">${out ? 'распродано' : 'осталось ' + left}</span>` : ''}</button>`;
      }).join('');
    }
    function buy() {
      const b = o.querySelector('#shBuy');
      if (!sel) { b.innerHTML = '<div class="sh-hint">Выбери подарок</div>'; return; }
      b.innerHTML = `<div class="sh-sel">${E(sel.emoji)} <b>${E(sel.name)}</b> — 💎 ${fmt(sel.price)}</div><input class="inp" id="shMsg" maxlength="200" placeholder="Добавить сообщение (необязательно)"><label class="sh-anon"><input type="checkbox" id="shAnon"> Скрыть, что это от меня</label><button class="btn primary" id="shGo" type="button">Подарить за 💎 ${fmt(sel.price)}</button>`;
      b.querySelector('#shGo').onclick = async () => {
        const go = b.querySelector('#shGo'); go.disabled = true; go.textContent = 'Отправляем…';
        const { data, error } = await sb.rpc('send_gift', { p_gift: sel.id, p_to: uid, p_msg: b.querySelector('#shMsg').value, p_anon: b.querySelector('#shAnon').checked });
        if (error || !data || !data.ok) {
          const er = data && data.error; go.disabled = false; go.textContent = 'Подарить за 💎 ' + fmt(sel.price);
          say(er === 'no_money' ? 'Не хватает праймиков 💎' : er === 'sold_out' ? 'Этот NFT распродан' : 'Не получилось отправить', 'red'); return;
        }
        say('Подарок отправлен 🎁'); o.remove();
        const box = $('#uGifts'); if (box && $('#userOverlay').classList.contains('open')) loadGifts(uid, box, $('#uGiftCnt'));
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
      } catch (e) { console.error(e); }
    };
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
    const owner = meId() === OWNER;
    if (kind === 'gold') return [
      ['💰 Баланс', () => sendText('баланс')], ['🎁 Бонус', () => sendText('бонус')], ['🏆 Топ', () => sendText('топ')], ['❓ Помощь', () => sendText('помощь')],
      ['🔴 Красное', () => sendText('рулетка ' + bet + ' к')], ['⚫ Чёрное', () => sendText('рулетка ' + bet + ' ч')], ['🟢 Зеро', () => sendText('рулетка ' + bet + ' з')], ['💣 Мины', () => sendText('мины ' + bet)],
      ['🪙 Орёл', () => sendText('монетка ' + bet + ' орёл')], ['🪙 Решка', () => sendText('монетка ' + bet + ' решка')], ['🎲 Кости', () => sendText('кости ' + bet)],
      ['💸 Перевод…', () => prefill('перевод @')]
    ].concat(owner ? [['✨ Выдать себе…', () => prefill('@megold ')]] : []);
    if (kind === 'prime') return [
      ['💎 Баланс', () => sendText('баланс')], ['🧾 История', () => sendText('история')], ['🎁 Подарки', () => sendText('подарки')], ['❓ Помощь', () => sendText('помощь')], ['💸 Перевод…', () => prefill('перевод @')]
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
