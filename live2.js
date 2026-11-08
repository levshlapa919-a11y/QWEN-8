/* live2.js — меню чата по долгому нажатию, архив, «без звука», черновики, поиск в чате */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const LS = { g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }, r: k => { try { localStorage.removeItem(k); } catch (e) { } } };
  const list = k => { try { return JSON.parse(LS.g(k, '[]')); } catch (e) { return []; } };
  const save = (k, a) => LS.s(k, JSON.stringify(a));
  const svg = d => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = { pin: '<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>', mute: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a2 2 0 0 0 3.4 0M3 3l18 18"/>', arch: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>', read: '<path d="M4 12l5 5L20 6"/>', del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>' };

  /* ---------- «без звука» ---------- */
  let muteUntil = 0;
  const muted = () => list('golda_muted');
  const wrap = (name, fn) => { const o = window[name]; if (typeof o === 'function' && !o.__lv) { const n = function () { return fn(o, this, arguments); }; n.__lv = 1; window[name] = n; } };
  wrap('sendNotif', (o, t, a) => { const m = a[0]; if (m && muted().includes(m.chat_id)) { muteUntil = Date.now() + 150; return; } return o.apply(t, a); });
  wrap('playNotifSound', (o, t, a) => { if (Date.now() < muteUntil) return; return o.apply(t, a); });
  const ov = navigator.vibrate && navigator.vibrate.bind(navigator);
  if (ov) navigator.vibrate = p => (Date.now() < muteUntil ? false : ov(p));

  /* ---------- архив и оформление строк ---------- */
  function decorate() {
    const cl = Q('#chatList'); if (!cl) return; const mu = muted(), ar = list('golda_arch'), showArch = document.body.classList.contains('lv-arch-on');
    let cnt = 0;
    QA('.chat-item', cl).forEach(it => {
      const id = it.dataset.id, a = ar.includes(id); if (a) cnt++;
      it.classList.toggle('lv-mute', mu.includes(id)); it.classList.toggle('lv-arch', a);
      it.style.display = (showArch ? !a : a) ? 'none' : '';
      const pv = Q('.ci-prev', it);
      if (pv) { const d = LS.g('golda_draft_' + id); const has = !!d && CURRENT !== id; if (has && !pv.dataset.lvd) { pv.dataset.lvd = pv.innerHTML; pv.innerHTML = '<span class="lv-draft">Черновик:</span> ' + d.replace(/[<>&]/g, '').slice(0, 60); } else if (!has && pv.dataset.lvd) { pv.innerHTML = pv.dataset.lvd; delete pv.dataset.lvd; } }
    });
    let row = Q('#lvArch');
    if (!ar.length) { row && row.remove(); document.body.classList.remove('lv-arch-on'); return; }
    if (!row) { row = document.createElement('button'); row.id = 'lvArch'; row.type = 'button'; cl.parentNode.insertBefore(row, cl); row.onclick = () => { document.body.classList.toggle('lv-arch-on'); decorate(); }; }
    row.innerHTML = svg(IC.arch) + '<span>' + (showArch ? 'Назад к чатам' : 'Архив · ' + cnt) + '</span>';
  }

  /* ---------- меню по долгому нажатию ---------- */
  let pop = null;
  const closePop = () => { if (pop) { pop.remove(); pop = null; } };
  function openPop(it, x, y) {
    closePop(); const id = it.dataset.id; if (!id) return;
    const pins = list('golda_pins'), mu = muted().includes(id), ar = list('golda_arch').includes(id), un = typeof UNREAD !== 'undefined' && UNREAD[id];
    const items = [['pin', pins.includes(id) ? 'Открепить' : 'Закрепить', 'pin'], ['mute', mu ? 'Включить звук' : 'Без звука', 'mute'], ['arch', ar ? 'Вернуть из архива' : 'В архив', 'arch'], un ? ['read', 'Прочитано', 'read'] : null, ['del', 'Удалить чат', 'del', 1]].filter(Boolean);
    pop = document.createElement('div'); pop.id = 'lvPop'; pop.innerHTML = items.map(i => `<button type="button" data-k="${i[2]}" class="${i[3] ? 'danger' : ''}"><span class="cl-i">${svg(IC[i[0]])}</span>${i[1]}</button>`).join('');
    document.body.appendChild(pop); const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px'; pop.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + 'px';
    pop.onclick = async e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; closePop();
      if (k === 'pin') { let p = pins; if (p.includes(id)) p = p.filter(x => x !== id); else { if (p.length >= 5) { try { toast('Можно закрепить до 5 чатов', 'red'); } catch (er) { } return; } p.unshift(id); } save('golda_pins', p); }
      if (k === 'mute') save('golda_muted', mu ? muted().filter(x => x !== id) : muted().concat(id));
      if (k === 'arch') save('golda_arch', ar ? list('golda_arch').filter(x => x !== id) : list('golda_arch').concat(id));
      if (k === 'read') { UNREAD[id] = 0; try { renderChatList(); } catch (er) { } }
      if (k === 'del') { try { await openChat(id); setTimeout(() => { const d = QA('#chatMenu .menu-i').find(x => /Удалить/.test(x.textContent)); if (d) d.click(); else { try { toast('Удаление доступно в меню чата ⋮', 'red'); } catch (er) { } } }, 200); } catch (er) { } }
      decorate(); try { window.dispatchEvent(new Event('lv-pins')); } catch (er) { }
    };
  }
  let lpT = null, lpPos = null, swallow = null;
  document.addEventListener('touchstart', e => { const it = e.target.closest && e.target.closest('.chat-item'); if (!it) return; const t = e.touches[0]; lpPos = [t.clientX, t.clientY]; clearTimeout(lpT); lpT = setTimeout(() => { swallow = it; try { navigator.vibrate && navigator.vibrate(15); } catch (er) { } openPop(it, lpPos[0], lpPos[1]); }, 480); }, { passive: true });
  document.addEventListener('touchmove', e => { if (!lpPos) return; const t = e.touches[0]; if (Math.abs(t.clientX - lpPos[0]) > 10 || Math.abs(t.clientY - lpPos[1]) > 10) clearTimeout(lpT); }, { passive: true });
  ['touchend', 'touchcancel'].forEach(n => document.addEventListener(n, () => clearTimeout(lpT), { passive: true }));
  document.addEventListener('contextmenu', e => { const it = e.target.closest('.chat-item'); if (it) { e.preventDefault(); openPop(it, e.clientX, e.clientY); } });
  document.addEventListener('click', e => { if (swallow && e.target.closest('.chat-item') === swallow) { e.stopImmediatePropagation(); e.preventDefault(); swallow = null; return; } if (pop && !e.target.closest('#lvPop')) closePop(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); closeSearch(); } });

  /* ---------- черновики ---------- */
  let lastChat = null;
  setInterval(() => {
    const inp = Q('#msgInput'); if (!inp || typeof CURRENT === 'undefined') return;
    if (CURRENT !== lastChat) { lastChat = CURRENT; if (CURRENT) { const d = LS.g('golda_draft_' + CURRENT); if (d && !inp.value) { inp.value = d; inp.dispatchEvent(new Event('input', { bubbles: true })); } } decorate(); closeSearch(); }
  }, 250);
  document.addEventListener('input', e => { if (e.target.id !== 'msgInput' || typeof CURRENT === 'undefined' || !CURRENT) return; const v = e.target.value; if (v.trim()) LS.s('golda_draft_' + CURRENT, v); else LS.r('golda_draft_' + CURRENT); });
  const clearDraft = () => { if (typeof CURRENT !== 'undefined' && CURRENT) { LS.r('golda_draft_' + CURRENT); setTimeout(decorate, 300); } };
  document.addEventListener('click', e => { if (e.target.closest('#sendBtn')) clearDraft(); }, true);
  document.addEventListener('keydown', e => { if (e.target.id === 'msgInput' && e.key === 'Enter' && !e.shiftKey) clearDraft(); }, true);

  /* ---------- поиск в чате ---------- */
  let hits = [], hi = -1, bar = null;
  function closeSearch() { if (bar) { bar.remove(); bar = null; } QA('.msg.lv-hit,.msg.lv-cur').forEach(m => m.classList.remove('lv-hit', 'lv-cur')); hits = []; hi = -1; }
  function openSearch() {
    closeSearch(); const head = Q('.chat-head'); if (!head) return;
    bar = document.createElement('div'); bar.id = 'lvFind';
    bar.innerHTML = `${svg(IC.search)}<input type="text" placeholder="Поиск в этом чате" autocomplete="off"><span class="n"></span><button type="button" data-d="-1">${svg(IC.up)}</button><button type="button" data-d="1">${svg(IC.down)}</button><button type="button" data-x>${svg(IC.x)}</button>`;
    head.insertAdjacentElement('afterend', bar); const inp = Q('input', bar), n = Q('.n', bar);
    const go = d => { if (!hits.length) return; if (hi >= 0) hits[hi].classList.remove('lv-cur'); hi = (hi + d + hits.length) % hits.length; hits[hi].classList.add('lv-cur'); hits[hi].scrollIntoView({ block: 'center', behavior: 'smooth' }); n.textContent = (hi + 1) + ' / ' + hits.length; };
    const run = () => { QA('.msg.lv-hit,.msg.lv-cur').forEach(m => m.classList.remove('lv-hit', 'lv-cur')); const q = inp.value.trim().toLowerCase(); hits = []; hi = -1; if (q.length < 1) { n.textContent = ''; return; } hits = QA('#messages .msg').filter(m => (Q('.m-text', m) || {}).textContent && Q('.m-text', m).textContent.toLowerCase().includes(q)); hits.forEach(m => m.classList.add('lv-hit')); n.textContent = hits.length ? '' : 'Не найдено'; if (hits.length) { hi = -1; go(1); } };
    inp.oninput = run; inp.onkeydown = e => { if (e.key === 'Enter') go(e.shiftKey ? -1 : 1); };
    bar.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-x')) closeSearch(); else go(+b.dataset.d); };
    inp.focus();
  }
  function menuItem() {
    const m = Q('#chatMenu'); if (!m || !m.children.length || Q('[data-lv="find"]', m)) return;
    const b = document.createElement('button'); b.className = 'menu-i'; b.dataset.lv = 'find'; b.innerHTML = `<span class="cl-i">${svg(IC.search)}</span>Поиск в чате`; m.insertBefore(b, m.firstChild);
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-lv="find"]')) { e.stopPropagation(); const m = Q('#chatMenu'); m && m.classList.remove('open'); openSearch(); } }, true);

  let t = null; new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { decorate(); menuItem(); }, 90); }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('lv-pins', () => { try { renderChatList(); } catch (e) { } });
  decorate();
})();
