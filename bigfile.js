/* golda-mesenger: большие файлы (части по 40 МБ). Показ карточки, скачивание и просмотр видео. */
(function () {
  'use strict';
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const size = b => b < 1048576 ? (b / 1024).toFixed(0) + ' КБ' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' МБ' : (b / 1073741824).toFixed(2) + ' ГБ';
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf;
  window.parseMedia = function (c) {
    const m = String(c).match(/^\[\[big\|([^\]]+)\]\]([\s\S]*)$/);
    if (m) { const p = m[1].split('|'); let nm = p[2] || 'файл'; try { nm = decodeURIComponent(nm); } catch (e) { } return { kind: 'big', url: p[0], count: +p[1] || 1, name: nm, size: +p[3] || 0, mime: p[4] || 'application/octet-stream', cap: m[2].trim() }; }
    return _pm(c);
  };
  window.mediaHTML = function (md) {
    if (md && md.kind === 'big') {
      const vid = /^video\//.test(md.mime), ext = (md.name.split('.').pop() || '').slice(0, 4).toUpperCase();
      return `<div class="m-file big" data-url="${E(md.url)}" data-n="${md.count}" data-name="${E(md.name)}" data-mime="${E(md.mime)}"><span class="m-file-ico">${E(ext || 'FILE')}</span><span class="m-file-info"><b>${E(md.name)}</b><small class="bg-st">${size(md.size)} · ${md.count} ${md.count > 4 ? 'частей' : 'части'}</small><span class="bg-btns">${vid ? '<button type="button" data-a="play">▶ Смотреть</button>' : ''}<button type="button" data-a="dl">⬇ Скачать</button></span></span></div>`;
    }
    return _mh(md);
  };
  window.previewOf = function (lm, chat) {
    const md = window.parseMedia(lm.content);
    if (md && md.kind === 'big') { const who = lm.sender_id === ME.id ? 'Вы: ' : ''; return who + '📦 ' + E(md.name); }
    return _pv(lm, chat);
  };
  const BLOBS = {};
  async function fetchAll(card, st) {
    const url = card.dataset.url, n = +card.dataset.n, parts = [];
    for (let i = 0; i < n; i++) {
      st.textContent = `Скачиваем часть ${i + 1} из ${n}…`;
      let ok = false, buf = null;
      for (let k = 0; k < 3 && !ok; k++) { try { const r = await fetch(url + '/p' + String(i).padStart(3, '0')); if (!r.ok) throw 0; buf = await r.arrayBuffer(); ok = true; } catch (e) { } }
      if (!ok) throw new Error('part');
      parts.push(buf);
    }
    return new Blob(parts, { type: card.dataset.mime || 'application/octet-stream' });
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('.m-file.big [data-a]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    const card = b.closest('.m-file.big'), st = card.querySelector('.bg-st'), keep = st.textContent; if (card.dataset.busy) return;
    card.dataset.busy = 1;
    try {
      let blob = BLOBS[card.dataset.url]; if (!blob) { blob = await fetchAll(card, st); BLOBS[card.dataset.url] = blob; }
      const u = URL.createObjectURL(blob);
      if (b.dataset.a === 'play') { const v = document.createElement('video'); v.controls = true; v.autoplay = true; v.playsInline = true; v.src = u; v.style.cssText = 'width:100%;max-width:320px;border-radius:14px;display:block;margin-top:8px'; card.after(v); }
      else { const a = document.createElement('a'); a.href = u; a.download = card.dataset.name || 'file'; document.body.appendChild(a); a.click(); a.remove(); }
      st.textContent = keep;
    } catch (er) { st.textContent = 'Не удалось скачать, попробуй ещё раз'; setTimeout(() => st.textContent = keep, 3000); }
    delete card.dataset.busy;
  }, true);
})();
