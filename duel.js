/* Дуэли на gold: /duel 100 в любом чате; соперник нажимает «Принять», бросок 1–100 решает */
(function () {
  'use strict';
  const Q = s => document.querySelector(s), QA = s => [...document.querySelectorAll(s)];
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = v => String(v == null ? 0 : v).split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const rpc = (n, a) => sb.rpc(n, a);
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf;
  window.parseMedia = function (c) { const m = String(c == null ? '' : c).match(/^\[\[duel\|([0-9a-f-]{36})\]\]/); return m ? { kind: 'duel', id: m[1], cap: '' } : _pm(c); };
  window.mediaHTML = function (md) { return md && md.kind === 'duel' ? `<div class="du-card" data-duel="${E(md.id)}"><div class="du-h">Дуэль…</div></div>` : _mh(md); };
  window.previewOf = function (lm, chat) { const md = window.parseMedia(lm.content); return md && md.kind === 'duel' ? (lm.sender_id === ME.id ? 'Вы: ' : '') + 'Дуэль на gold' : _pv(lm, chat); };

  const STATE = {};
  function paint(card, s) {
    if (!s) { card.innerHTML = '<div class="du-h">Дуэль недоступна</div>'; return; }
    const key = JSON.stringify(s); if (card.dataset.h === key) return; card.dataset.h = key;
    const bet = fmt(s.bet);
    let body = '', st = '';
    if (s.status === 'open') { st = s.mine ? 'Ждём соперника' : 'Вызов брошен'; body = s.can_accept ? `<button class="du-b" data-a="acc">Принять · ${bet} gold</button>` : (s.mine ? `<button class="du-b alt" data-a="can">Отменить</button>` : ''); }
    else if (s.status === 'cancelled') st = 'Отменена';
    else {
      const draw = s.status === 'draw';
      st = draw ? 'Ничья, ставки возвращены' : 'Победил ' + E(s.winner);
      body = `<div class="du-roll"><div class="${!draw && s.winner === s.creator ? 'w' : ''}"><i>${s.roll_c}</i><span>${E(s.creator)}</span></div><b>vs</b><div class="${!draw && s.winner === s.opponent ? 'w' : ''}"><i>${s.roll_o}</i><span>${E(s.opponent)}</span></div></div>`;
    }
    card.innerHTML = `<div class="du-h"><span>Дуэль на золото</span><b>${bet}</b></div><div class="du-s">${st}</div>${body}`;
    if (s.status === 'done' || s.status === 'draw') { const was = STATE[card.dataset.duel]; if (was === 'open') { card.classList.add('du-new'); if (s.won && window.LIVE) window.LIVE.confetti(80); } }
    STATE[card.dataset.duel] = s.status;
  }
  async function load(card) { const r = await rpc('duel_state', { p_id: card.dataset.duel }); paint(card, r.data); }
  function scan() { QA('.du-card:not([data-ld])').forEach(c => { c.dataset.ld = '1'; load(c); }); }
  let t = null; new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 80); }).observe(document.body, { childList: true, subtree: true });
  setInterval(() => { QA('.du-card').forEach(c => { const s = STATE[c.dataset.duel]; if (s === 'open' || !s) load(c); }); }, 3000);
  document.addEventListener('click', async e => {
    const b = e.target.closest('.du-b'); if (!b) return; const card = b.closest('.du-card'); b.disabled = true;
    const r = await rpc(b.dataset.a === 'acc' ? 'duel_accept' : 'duel_cancel', { p_id: card.dataset.duel });
    if (!(r.data && r.data.ok)) { try { toast({ no_money: 'Не хватает gold', closed: 'Дуэль уже закрыта' }[r.data && r.data.error] || 'Не получилось', 'red'); } catch (er) { } }
    load(card);
  });
  /* команда /duel N */
  function cmd() {
    const i = Q('#msgInput'); if (!i) return false; const m = i.value.trim().match(/^\/(?:duel|дуэль)\s+(\d{1,12})$/i); if (!m) return false;
    i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true }));
    rpc('duel_create', { p_chat: CURRENT, p_bet: +m[1] }).then(r => { const d = r.data; if (!(d && d.ok)) try { toast({ no_money: 'Не хватает gold', bet: 'Неверная ставка' }[d && d.error] || 'Не получилось', 'red'); } catch (er) { } });
    return true;
  }
  document.addEventListener('keydown', e => { if (e.target.id === 'msgInput' && e.key === 'Enter' && !e.shiftKey && !e.isComposing && cmd()) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('click', e => { if (e.target.closest('#sendBtn') && cmd()) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  scan();
})();
