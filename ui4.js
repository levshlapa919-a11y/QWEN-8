/* Pulse: лента «истории» — недавние чаты кружками над списком */
(function () {
  'use strict';
  const on = () => document.documentElement.getAttribute('data-ui') === 'pulse';
  let t = null;
  function build() {
    const list = document.getElementById('chatList'); if (!list) return;
    let row = document.getElementById('plStories');
    if (!on()) { if (row) row.remove(); return; }
    if (!row) { row = document.createElement('div'); row.id = 'plStories'; list.parentNode.insertBefore(row, list); }
    const items = [...list.querySelectorAll('.chat-item')].slice(0, 12);
    row.style.display = items.length ? '' : 'none';
    row.innerHTML = '';
    items.forEach(it => {
      const nm = (it.querySelector('.ci-name') || {}).textContent || '';
      const av = it.querySelector('.ava'); if (!av) return;
      const d = document.createElement('button'); d.type = 'button'; d.className = 'pl-st' + (it.querySelector('.badge') ? ' un' : '') + (it.querySelector('.dot.on') ? ' on' : '');
      const w = document.createElement('span'); w.className = 'pl-ring'; w.appendChild(av.cloneNode(true));
      const n = document.createElement('i'); n.textContent = nm.replace(/^(\S{9}).*/, '$1…');
      d.appendChild(w); d.appendChild(n); d.onclick = () => it.click(); row.appendChild(d);
    });
  }
  const sched = () => { clearTimeout(t); t = setTimeout(build, 120); };
  function init() {
    const list = document.getElementById('chatList'); if (!list) return setTimeout(init, 500);
    new MutationObserver(sched).observe(list, { childList: true });
    new MutationObserver(sched).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui'] });
    build();
  }
  init();
})();
