/* Главная: задания дня, вкладки-папки, люди, закреп */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const LS = { g(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const isBot = id => /^00000000-0000-4000-8000-/.test(id || '');
  const fmtG = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  let QS = [];

  /* ---------- карточка ---------- */
  async function loadQ() {
    try { const r = await sb.rpc('quests_state'); if (Array.isArray(r.data)) { QS = r.data; paintCard(); } } catch (e) { }
  }
  function paintCard() {
    const c = Q('#homeCard'); if (!c) return;
    const tasks = QS.filter(q => q.key !== 'all'), done = tasks.filter(q => q.claimed).length;
    const ready = QS.some(q => !q.claimed && q.have >= q.need && (q.key !== 'all' || done === tasks.length));
    const total = tasks.reduce((s, q) => s + (+q.gold), 0) + 1500;
    const left = tasks.reduce((s, q) => s + (q.claimed ? 0 : +q.gold), 0) + (QS.find(q => q.key === 'all')?.claimed ? 0 : 1500);
    Q('.hc-sub', c).textContent = !QS.length ? 'Загрузка…' : left === 0 ? 'Все награды получены. Завтра будут новые.' : ready ? 'Есть награда, нажмите чтобы забрать' : 'Выполнено ' + done + ' из ' + tasks.length + ' · осталось ' + fmtG(left) + ' gold';
    Q('.hc-bar i', c).style.width = (QS.length ? Math.round(done / tasks.length * 100) : 0) + '%';
    c.classList.toggle('ready', ready);
  }
  function place() {
    const list = Q('#chatList'); if (!list || !G(() => ME)) return;
    let card = Q('#homeCard');
    if (!card) {
      card = document.createElement('div'); card.id = 'homeCard';
      card.innerHTML = '<button class="hc-main" data-a="q"><div class="hc-t">Задания дня</div><div class="hc-sub">Загрузка…</div><div class="hc-bar"><i></i></div></button>';
      card.onclick = e => { if (e.target.closest('[data-a=q]')) openQuests(); };
    }
    if (card.nextElementSibling !== list) list.before(card);
  }
  const obs = new MutationObserver(() => { place(); obs.takeRecords(); });
  obs.observe(document.body, { childList: true, subtree: true });

  /* ---------- задания ---------- */
  function openQuests() {
    const ov = document.createElement('div'); ov.className = 'ms-ov hq-ov';
    const draw = () => {
      const tasks = QS.filter(q => q.key !== 'all'), done = tasks.filter(q => q.claimed).length;
      ov.innerHTML = '<div class="ms-card hq"><div class="hq-h">Задания дня</div><div class="hq-s">Обновляются каждый день в 00:00 по Москве</div>' + QS.map(q => {
        const ok = q.have >= q.need, locked = q.key === 'all' && done < tasks.length;
        const btn = q.claimed ? '<span class="hq-d">Получено</span>' : ok && !locked ? '<button data-c="' + q.key + '">+' + fmtG(q.gold) + '</button>' : '<span class="hq-g">+' + fmtG(q.gold) + '</span>';
        return '<div class="hq-r' + (q.claimed ? ' dn' : '') + '"><div class="hq-m"><b>' + esc(q.title) + '</b><div class="hq-b"><i style="width:' + Math.min(100, q.have / q.need * 100) + '%"></i></div><small>' + q.have + ' / ' + q.need + '</small></div>' + btn + '</div>';
      }).join('') + '<button class="hq-x" data-x>Закрыть</button></div>';
    };
    document.body.appendChild(ov); draw(); loadQ().then(draw);
    ov.onclick = async e => {
      if (e.target === ov || e.target.closest('[data-x]')) return ov.remove();
      const b = e.target.closest('[data-c]'); if (!b) return; b.disabled = true;
      const r = await sb.rpc('quest_claim', { p_key: b.dataset.c });
      if (r.data && r.data.ok) tst('Награда: ' + fmtG(r.data.gold) + ' gold'); else tst('Пока не выполнено', 'red');
      await loadQ(); draw();
    };
  }

  /* ---------- люди ---------- */
  async function openPeople() {
    try { await fetchAllUsers(); } catch (e) { }
    const ov = document.createElement('div'); ov.className = 'ms-ov hq-ov';
    ov.innerHTML = '<div class="ms-card hq"><div class="hq-h">Люди</div><input class="hp-s" placeholder="Поиск по имени или нику"><div class="hp-l"></div><button class="hq-x" data-x>Закрыть</button></div>';
    document.body.appendChild(ov);
    const draw = q => {
      q = (q || '').toLowerCase();
      const list = (G(() => USERS) || []).filter(u => u.id !== ME.id && !isBot(u.id) && ((u.display_name || '') + ' ' + (u.username || '')).toLowerCase().includes(q))
        .sort((a, b) => (isOnline(b) - isOnline(a)) || String(b.last_seen || '').localeCompare(String(a.last_seen || '')));
      Q('.hp-l', ov).innerHTML = list.map(u => '<button class="hp-r" data-u="' + u.id + '">' + avatarHTML(u, 'm') + '<div><b>' + esc(u.display_name || u.username) + '</b><small>' + (isOnline(u) ? '<em>в сети</em>' : esc(fmtLastSeen(u.last_seen))) + ' · @' + esc(u.username) + '</small></div></button>').join('') || '<div class="empty-note">Никого не найдено</div>';
    };
    draw(''); Q('.hp-s', ov).oninput = e => draw(e.target.value);
    ov.onclick = async e => {
      if (e.target === ov || e.target.closest('[data-x]')) return ov.remove();
      const b = e.target.closest('[data-u]'); if (!b) return; ov.remove(); await openDirectWith(b.dataset.u);
    };
  }

  /* ---------- закреп ---------- */
  let pinFor = null;
  async function loadPin(id) {
    pinFor = id; let bar = Q('#pinBar');
    const head = Q('#chatView .chat-head'); if (!head) return;
    if (!bar) { bar = document.createElement('div'); bar.id = 'pinBar'; head.after(bar);
      bar.onclick = e => {
        if (e.target.closest('[data-un]')) { sb.rpc('unpin_message', { p_chat: pinFor }).then(() => { bar.hidden = true; tst('Откреплено'); }); return; }
        const m = Q('#messages .msg[data-id="' + bar.dataset.m + '"]'); if (m) { m.scrollIntoView({ block: 'center', behavior: 'smooth' }); m.classList.add('flash'); setTimeout(() => m.classList.remove('flash'), 1400); }
      };
    }
    bar.hidden = true;
    try {
      const r = await sb.rpc('chat_pin_get', { p_chat: id }); if (pinFor !== id) return;
      const p = r.data && r.data[0]; if (!p) return;
      bar.dataset.m = p.message_id;
      let t = String(p.content || '').replace(/\[\[[^\]]*\]\]/g, 'Вложение').replace(/\*\*/g, '');
      bar.innerHTML = '<i></i><div><small>Закреплённое сообщение</small><span>' + esc(t.slice(0, 120)) + '</span></div><button data-un aria-label="Открепить">✕</button>';
      bar.hidden = false;
    } catch (e) { }
  }
  window.GoldaPin = async id => {
    const r = await sb.rpc('pin_message', { p_msg: id });
    if (r.error) return tst('Не удалось закрепить', 'red');
    tst('Закреплено'); if (G(() => CURRENT)) loadPin(CURRENT);
  };
  const _oc = window.openChat;
  if (typeof _oc === 'function') window.openChat = async function (id) { const r = await _oc.apply(this, arguments); loadPin(id); return r; };
  setInterval(() => { if (G(() => CURRENT)) loadPin(CURRENT); }, 25000);

  setTimeout(loadQ, 2500); setInterval(loadQ, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadQ(); });
})();
