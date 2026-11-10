/* Выбор нескольких сообщений + @упоминания */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const sel = new Set();
  let bar = null;

  function rows() { return QA('#messages .msg'); }
  function mark() {
    rows().forEach(r => r.classList.toggle('picked', sel.has(r.dataset.id)));
    if (!bar) return;
    Q('.sb-n', bar).textContent = sel.size ? 'Выбрано: ' + sel.size : 'Выберите сообщения';
    const mine = [...sel].every(id => { const m = window.__MC && __MC[id]; return m && (m.sender_id === ME.id || ME.is_admin); });
    Q('[data-a=del]', bar).disabled = !sel.size || !mine;
    Q('[data-a=fwd]', bar).disabled = !sel.size;
    Q('[data-a=copy]', bar).disabled = !sel.size;
  }
  function start(id) {
    if (bar) return;
    document.body.classList.add('sel-mode');
    bar = document.createElement('div'); bar.className = 'sel-bar';
    bar.innerHTML = '<button class="sb-x" data-a="x" aria-label="Отмена"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="sb-n"></div><button data-a="copy">Копировать</button><button data-a="fwd">Переслать</button><button data-a="del" class="dng">Удалить</button>';
    document.body.appendChild(bar);
    if (id) sel.add(id);
    mark();
  }
  function stop() {
    sel.clear(); document.body.classList.remove('sel-mode');
    if (bar) bar.remove(); bar = null; mark();
  }
  const ordered = () => rows().map(r => r.dataset.id).filter(id => sel.has(id)).map(id => __MC[id]).filter(Boolean);

  document.addEventListener('click', e => {
    if (!bar) return;
    const b = e.target.closest('.sel-bar [data-a]');
    if (b) { act(b.dataset.a); return; }
    const r = e.target.closest('#messages .msg');
    if (r) { e.preventDefault(); e.stopPropagation(); const id = r.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); mark(); }
  }, true);
  ['pointerdown', 'contextmenu', 'dblclick'].forEach(t => document.addEventListener(t, e => {
    if (bar && e.target.closest('#messages')) { e.stopPropagation(); if (t !== 'pointerdown') e.preventDefault(); }
  }, true));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && bar) stop(); });

  async function act(a) {
    const list = ordered();
    if (a === 'x') return stop();
    if (!list.length) return;
    if (a === 'copy') {
      const t = list.map(m => { const p = PROFILES[m.sender_id] || {}; return (p.display_name || p.username || '') + ': ' + (m.content || ''); }).join('\n');
      try { await navigator.clipboard.writeText(t); tst('Скопировано'); } catch (er) { tst('Не удалось скопировать', 'red'); }
      return stop();
    }
    if (a === 'del') {
      if (!confirm('Удалить сообщений: ' + list.length + '?')) return;
      let n = 0;
      for (const m of list) {
        const { error } = await sb.from('messages').delete().eq('id', m.id);
        if (!error) { n++; Q('#messages .msg[data-id="' + m.id + '"]')?.remove(); }
      }
      tst(n ? 'Удалено: ' + n : 'Не удалось удалить', n ? '' : 'red'); return stop();
    }
    if (a === 'fwd') {
      const picked = new Set();
      const ov = document.createElement('div'); ov.className = 'overlay open fw-ov'; ov.style.zIndex = 700;
      ov.innerHTML = '<div class="modal"><div class="m-head"><div class="m-title">Переслать: ' + list.length + '</div><button class="icon-btn x" data-x>✕</button></div><div class="pick-list">' +
        CHATS.map(c => '<div class="pick-row" data-c="' + c.id + '"><div style="flex:1;min-width:0;font-weight:600">' + esc(titleOf(c)) + '</div><span class="pk"></span></div>').join('') +
        '</div><button class="btn" id="fwGo2" style="width:100%;margin-top:12px" disabled>Отправить</button></div>';
      document.body.appendChild(ov);
      ov.onclick = async e => {
        if (e.target === ov || e.target.closest('[data-x]')) return ov.remove();
        const r = e.target.closest('.pick-row');
        if (r) { const id = r.dataset.c; if (picked.has(id)) { picked.delete(id); r.querySelector('.pk').textContent = ''; } else { picked.add(id); r.querySelector('.pk').innerHTML = '✓'; } Q('#fwGo2', ov).disabled = !picked.size; return; }
        if (!e.target.closest('#fwGo2')) return;
        if (restricted()) return;
        let n = 0;
        for (const cid of picked) for (const m of list) {
          const from = m.fwd_from || ((PROFILES[m.sender_id] || {}).display_name || (PROFILES[m.sender_id] || {}).username || '');
          const { data, error } = await sb.from('messages').insert({ chat_id: cid, sender_id: ME.id, content: m.content, fwd_from: from }).select().single();
          if (!error) { n++; const chat = CHATS.find(c => c.id === cid); if (chat && !MSG_IDS.has(data.id)) { MSG_IDS.add(data.id); chat.lastMsg = data; if (CURRENT === cid) { appendMsg(data, chat); } } }
        }
        ov.remove(); renderChatList(); tst(n ? 'Переслано: ' + n : 'Не удалось переслать', n ? '' : 'red'); stop();
      };
    }
  }
  window.GoldaSel = { start, stop };
  window.addEventListener('hashchange', stop);
  setInterval(() => { if (bar && !CURRENT) stop(); }, 1000);

  /* ---------- @упоминания ---------- */
  let pop = null, mStart = -1;
  function members() {
    const c = (G(() => CHATS) || []).find(c => c.id === CURRENT);
    if (!c || c.type !== 'group') return [];
    return (c.members || []).filter(m => m.id !== ME.id && m.username);
  }
  function closePop() { if (pop) pop.remove(); pop = null; mStart = -1; }
  function check(inp) {
    const pos = inp.selectionStart, txt = inp.value.slice(0, pos);
    const m = /(^|\s)@([A-Za-z0-9_]{0,20})$/.exec(txt);
    if (!m) return closePop();
    const q = m[2].toLowerCase();
    const list = members().filter(u => u.username.toLowerCase().startsWith(q) || (u.display_name || '').toLowerCase().startsWith(q)).slice(0, 6);
    if (!list.length) return closePop();
    mStart = pos - q.length - 1;
    if (!pop) { pop = document.createElement('div'); pop.className = 'mn-pop'; (Q('#inputBar') || inp.parentElement).appendChild(pop); }
    pop.innerHTML = list.map(u => '<button data-u="' + esc(u.username) + '"><b>' + esc(u.display_name || u.username) + '</b><span>@' + esc(u.username) + '</span></button>').join('');
  }
  document.addEventListener('input', e => { if (e.target.id === 'msgInput') check(e.target); });
  document.addEventListener('mousedown', e => {
    const b = e.target.closest('.mn-pop [data-u]'); if (!b) return;
    e.preventDefault();
    const inp = Q('#msgInput'), pos = inp.selectionStart;
    inp.value = inp.value.slice(0, mStart) + '@' + b.dataset.u + ' ' + inp.value.slice(pos);
    const np = mStart + b.dataset.u.length + 2; inp.setSelectionRange(np, np); inp.focus(); closePop();
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);
  document.addEventListener('touchstart', e => {
    const b = e.target.closest('.mn-pop [data-u]'); if (b) { e.preventDefault(); b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); }
  }, { capture: true, passive: false });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });

  // подсветка @ник в сообщениях
  function hl(root) {
    QA('.m-text:not([data-mn])', root).forEach(t => {
      t.dataset.mn = 1;
      if (!t.textContent.includes('@')) return;
      const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT), nodes = [];
      while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => {
        if (n.parentElement.closest('a') || !/@[A-Za-z0-9_]{3,20}/.test(n.nodeValue)) return;
        const f = document.createDocumentFragment(); let last = 0;
        n.nodeValue.replace(/@([A-Za-z0-9_]{3,20})/g, (m0, u, i) => {
          f.append(n.nodeValue.slice(last, i));
          const s = document.createElement('span'); s.className = 'mn'; s.textContent = m0; s.dataset.u = u.toLowerCase();
          if (ME && u.toLowerCase() === (ME.username || '').toLowerCase()) s.classList.add('me');
          f.append(s); last = i + m0.length;
        });
        f.append(n.nodeValue.slice(last)); n.replaceWith(f);
      });
    });
  }
  new MutationObserver(() => { const b = Q('#messages'); if (b) hl(b); }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const s = e.target.closest('.mn'); if (!s || bar) return;
    const u = (G(() => USERS) || []).find(x => (x.username || '').toLowerCase() === s.dataset.u);
    if (u && window.openUserModal) openUserModal(u);
  });
})();
