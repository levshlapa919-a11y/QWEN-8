/* golda-mesenger: игра «Мины» от Gold Bot (поле 5×5 прямо в чате) + кнопка «Добавить Gold Bot» в группу */
(function () {
  'use strict';
  const BOT = '00000000-0000-4000-8000-000000901d07';
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => { let s = String(n == null ? 0 : n).split('.')[0]; if (/^-?inf/i.test(s)) return s[0] === '-' ? '-∞' : '∞'; if (!/^-?\d+$/.test(s)) s = String(Math.floor(+n || 0)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  const CACHE = {};
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf;

  window.parseMedia = function (c) {
    const m = String(c).match(/^\[\[mines\|([0-9a-f-]{36})\]\]([\s\S]*)$/);
    if (m) return { kind: 'mines', id: m[1], cap: m[2].trim() };
    return _pm(c);
  };
  window.mediaHTML = function (md) {
    if (md && md.kind === 'mines') return `<div class="mines-card" data-g="${E(md.id)}">${body(CACHE[md.id])}</div>`;
    return _mh(md);
  };
  window.previewOf = function (lm, chat) {
    const md = window.parseMedia(lm.content);
    if (md && md.kind === 'mines') return '💣 Мины';
    return _pv(lm, chat);
  };

  function body(s) {
    if (!s) return '<div class="mn-head">💣 Минное поле…</div>';
    const mine = (typeof ME !== 'undefined' && ME && s.user_id === ME.id), act = s.status === 'active';
    const k = (s.opened.match(/1/g) || []).length;
    let head;
    if (act) head = `<b>${E(s.name)}</b>, игра «Минное поле»!<br>💰 Ставка: ${fmt(s.bet)} · 💣 ${s.bombs} · ×${s.mult}`;
    else if (s.status === 'won') head = `<b>${E(s.name)}</b> забрал выигрыш!<br>💰 Сумма: <b>${fmt(s.payout)}</b> (×${s.mult})`;
    else head = `<b>${E(s.name)}</b> подорвался 💥<br>💰 Потеряно: ${fmt(s.bet)}`;
    let g = '';
    for (let i = 0; i < 25; i++) {
      const op = s.opened[i] === '1', bomb = s.board && s.board[i] === '1';
      const cls = op ? 'ok' : bomb ? 'bomb' : act ? 'closed' : 'dim';
      g += `<button type="button" class="mn-c ${cls}" data-i="${i}" ${act && mine && !op ? '' : 'disabled'}>${op ? '💎' : bomb ? '💣' : act ? '❓' : ''}</button>`;
    }
    const btn = act ? `<button type="button" class="mn-cash" ${mine && k > 0 ? '' : 'disabled'}>${mine ? (k > 0 ? '✖ Забрать ' + fmt(s.next) : 'Открой клетку') : 'Играет ' + E(s.name)}</button>` : '';
    return `<div class="mn-head">${head}</div><div class="mn-grid">${g}</div>${btn}`;
  }
  function paint(card, s) {
    CACHE[card.dataset.g] = s;
    const html = body(s);
    if (card.dataset.h !== html) { card.dataset.h = html; card.innerHTML = html; }
  }
  async function load(card) {
    try {
      const { data } = await sb.rpc('mines_state', { p_id: card.dataset.g });
      if (data) paint(card, data);
    } catch (e) { }
  }
  function scan() {
    document.querySelectorAll('.mines-card').forEach(c => { if (!c.dataset.l) { c.dataset.l = 1; load(c); } });
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  setInterval(() => {
    document.querySelectorAll('.mines-card').forEach(c => {
      const s = CACHE[c.dataset.g];
      if (!s || s.status === 'active') load(c);
    });
  }, 2500);

  document.addEventListener('click', async e => {
    const card = e.target.closest('.mines-card'); if (!card) return;
    const cell = e.target.closest('.mn-c'), cash = e.target.closest('.mn-cash');
    if (!cell && !cash) return;
    e.preventDefault(); e.stopPropagation();
    if (card.dataset.busy) return; card.dataset.busy = 1;
    try {
      const r = cell ? await sb.rpc('mines_open', { p_id: card.dataset.g, p_cell: +cell.dataset.i })
                     : await sb.rpc('mines_cashout', { p_id: card.dataset.g });
      if (r.data) paint(card, r.data);
    } catch (er) { }
    delete card.dataset.busy;
  }, true);

  /* кнопка «Добавить Gold Bot» в списке участников группы */
  const _og = window.openGroupInfo;
  if (typeof _og === 'function') {
    window.openGroupInfo = function (chat) {
      _og(chat);
      try {
        const list = document.getElementById('giList'); if (!list) return;
        document.querySelectorAll('.giAddBot').forEach(x => x.remove());
        if (chat.type !== 'group') return;
        const PRIME = '00000000-0000-4000-8000-00000000b002';
        [[BOT, '🪙 Добавить Gold Bot в группу'], [PRIME, '💎 Добавить Праймики в группу']].forEach(([id, label]) => {
          if (chat.members.some(m => m.id === id)) return;
          const b = document.createElement('button');
          b.className = 'btn primary giAddBot'; b.type = 'button'; b.style.margin = '10px 0 0'; b.style.width = '100%';
          b.textContent = label;
          b.onclick = async () => {
            b.disabled = true;
            const { error } = await sb.rpc('add_chat_bot', { p_chat: chat.id, p_bot: id });
            if (error) { b.disabled = false; b.textContent = 'Не удалось, попробуй ещё раз'; return; }
            try { await loadChats(); } catch (e) { }
            document.getElementById('groupInfoOverlay').classList.remove('open');
            if (typeof toast === 'function') toast('Бот добавлен! Напиши «помощь» 🪙');
          };
          list.after(b);
        });
      } catch (e) { }
    };
  }
})();
