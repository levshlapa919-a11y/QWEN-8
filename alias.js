/* YZITK Chats: переименовать контакт у себя (видно только вам) */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const rpc = async (n, a) => { try { const r = await sb.rpc(n, a || {}); return r.error ? { error: r.error } : { data: r.data }; } catch (e) { return { error: e }; } };
  let MAP = {};
  const real = new Map();            // id -> настоящее имя
  const setName = (p, id) => {
    if (!p) return;
    if (!real.has(id)) real.set(id, p.display_name);
    if (MAP[id]) { if (p.display_name !== MAP[id]) { real.set(id, p.display_name); p.display_name = MAP[id]; } }
    else if (real.has(id) && real.get(id) !== undefined && p.display_name !== real.get(id) && p._alias) { p.display_name = real.get(id); }
    p._alias = !!MAP[id];
  };
  function apply() {
    const ids = new Set(Object.keys(MAP));
    real.forEach((v, k) => ids.add(k));
    const P = G(() => PROFILES) || {};
    ids.forEach(id => {
      setName(P[id], id);
      (G(() => USERS) || []).forEach(u => { if (u && u.id === id) setName(u, id); });
      (G(() => CHATS) || []).forEach(c => (c.members || []).forEach(m => { if (m && m.id === id) setName(m, id); }));
    });
    G(() => renderChatList());
  }
  async function load() { const r = await rpc('alias_list'); if (r.data) { MAP = r.data || {}; apply(); } }
  async function edit(uid, cur) {
    const real0 = real.get(uid) || (G(() => PROFILES[uid].display_name)) || '';
    const v = prompt('Как называть этого человека у вас?\nПустое поле — вернуть настоящее имя.\n(Другие этого не увидят)', MAP[uid] || real0);
    if (v === null) return;
    const r = await rpc('alias_set', { p_about: uid, p_alias: v });
    if (r.data && r.data.ok) { if (r.data.alias) MAP[uid] = r.data.alias; else delete MAP[uid]; apply(); G(() => toast(r.data.alias ? 'Имя изменено только у вас' : 'Настоящее имя возвращено')); const n = document.getElementById('uName'); if (n && G(() => U_UID) === uid) n.textContent = MAP[uid] || real.get(uid) || n.textContent; }
    else G(() => toast('Не удалось сохранить', 'red'));
  }
  function hook() {
    const wrap = (name, after) => { const f = window[name]; if (typeof f !== 'function' || f._al) return; const w = function () { const r = f.apply(this, arguments); if (r && r.then) return r.then(x => { after(); return x; }); after(); return r; }; w._al = 1; window[name] = w; };
    wrap('fetchAllUsers', apply); wrap('loadChats', apply);
    const f = window.onProfileUpdate; if (typeof f === 'function' && !f._al) { const w = function (p) { const r = f.apply(this, arguments); if (p && p.id) { real.set(p.id, p.display_name); setName(G(() => PROFILES[p.id]), p.id); if (MAP[p.id]) G(() => renderChatList()); } return r; }; w._al = 1; window.onProfileUpdate = w; }
    const o = window.openUserModal;
    if (typeof o === 'function' && !o._al) {
      const w = function (u) {
        const r = o.apply(this, arguments);
        try {
          const id = u && u.id; const rn = real.get(id); if (rn && MAP[id]) { /* показываем алиас, оригинал в подписи */ }
          let b = document.getElementById('uAlias'); const wr = document.getElementById('uWrite');
          if (!b && wr) { b = document.createElement('button'); b.id = 'uAlias'; b.className = wr.className; b.type = 'button'; wr.insertAdjacentElement('afterend', b); }
          if (b) { b.style.display = id === G(() => ME.id) ? 'none' : ''; b.textContent = '✏️ Переименовать у себя'; b.onclick = () => edit(id); const n = document.getElementById('uName'); if (n && MAP[id]) n.textContent = MAP[id]; }
        } catch (e) { }
        return r;
      };
      w._al = 1; window.openUserModal = w;
    }
  }
  const t = setInterval(() => { if (G(() => ME) && typeof G(() => sb) === 'object') { clearInterval(t); hook(); load(); } }, 700);
  window.GoldaAlias = { load, apply, edit };
})();
