/* ui3: мелкая «механика» интерфейса Nova — ripple, анимация новых сообщений, поле ввода, каскад чатов */
(function () {
  'use strict';
  const on = () => document.documentElement.getAttribute('data-ui') === 'nova' || document.documentElement.getAttribute('data-ui') === 'pulse' || document.documentElement.getAttribute('data-ui') === 'clean';
  const Q = (s, r) => (r || document).querySelector(s);

  /* ripple на кнопках */
  document.addEventListener('pointerdown', e => {
    if (!on()) return;
    const b = e.target.closest && e.target.closest('.btn,.icon-btn,.f2-btn,.f2-chip,.f2-opt,.f4-t,.f6-chip,.menu-i,.send');
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, d = document.createElement('span');
    d.className = 'nv-rip'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    const cs = getComputedStyle(b); if (cs.position === 'static') b.style.position = 'relative'; b.style.overflow = 'hidden';
    b.appendChild(d); setTimeout(() => d.remove(), 650);
  }, { passive: true });

  /* пустое поле → кнопка отправки сворачивается */
  function bindInput() {
    const inp = Q('#msgInput'), box = Q('.ib-inner'); if (!inp || !box) return setTimeout(bindInput, 700);
    const upd = () => box.classList.toggle('nv-empty', !inp.value.trim());
    inp.addEventListener('input', upd); new MutationObserver(upd).observe(inp, { attributes: true });
    setInterval(upd, 600); upd();
  }
  bindInput();

  /* новые сообщения: «вылетают», старые при открытии чата — без шума */
  function watchMessages() {
    const box = Q('#messages'); if (!box) return setTimeout(watchMessages, 700);
    new MutationObserver(ms => {
      if (!on()) return;
      for (const m of ms) {
        const added = [].filter.call(m.addedNodes, n => n.nodeType === 1 && n.classList.contains('msg'));
        if (added.length && added.length <= 3) added.forEach(n => { n.classList.add('nv-in'); n.classList.add('pl-in'); });
      }
    }).observe(box, { childList: true });
  }
  watchMessages();

  /* каскад в списке чатов */
  function watchList() {
    const list = Q('#chatList'); if (!list) return setTimeout(watchList, 700);
    let done = false;
    const stag = () => { if (!on() || done || !list.children.length) return; done = true; [].forEach.call(list.children, (el, i) => el.style.setProperty('--i', Math.min(i, 14))); list.classList.add('nv-first'); setTimeout(() => list.classList.remove('nv-first'), 1400); };
    new MutationObserver(stag).observe(list, { childList: true }); stag();
  }
  watchList();
})();
