/* Превью ссылок, форматирование текста, даты, крупные эмодзи, кнопка «вниз» */
(function () {
  'use strict';
  const Q = (s, r) => (r || document).querySelector(s), QA = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MEM = {};
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const SKIP = /\.(png|jpe?g|gif|webp|mp3|ogg|wav|m4a|mp4|webm|svg|pdf|zip)(\?|$)/i;

  /* --- форматирование: **жирный** _курсив_ ~~зачёркнутый~~ `код` ||спойлер|| --- */
  function fmt(t) {
    if (t.dataset.fm) return; t.dataset.fm = 1;
    if (!/(\*\*|__|~~|`|\|\|)/.test(t.textContent)) return;
    t.innerHTML = t.innerHTML.split(/(<[^>]+>)/).map((p, i) => {
      if (i % 2) return p;
      return p.replace(/`([^`\n]+)`/g, '<code class="fx-c">$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
        .replace(/__([^_\n]+)__/g, '<i>$1</i>')
        .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
        .replace(/\|\|([^|\n]+)\|\|/g, '<span class="fx-sp" tabindex="0">$1</span>');
    }).join('');
  }
  document.addEventListener('click', e => { const s = e.target.closest('.fx-sp'); if (s) s.classList.toggle('open'); });

  /* --- крупные эмодзи --- */
  const EMO = /^(?:\p{Extended_Pictographic}|‍|️|\s){1,12}$/u;
  function big(msg) {
    const t = Q('.m-text', msg); if (!t || msg.dataset.big) return; msg.dataset.big = 1;
    const x = t.textContent.trim();
    if (x && EMO.test(x) && [...x.replace(/\s/g, '')].length <= 3) msg.classList.add('big-emo');
  }

  /* --- превью ссылок --- */
  async function preview(msg) {
    if (msg.dataset.lp) return;
    const a = Q('.m-text a[href^="http"]', msg); if (!a) return;
    msg.dataset.lp = 1;
    const url = a.href; if (SKIP.test(url) || url.startsWith(location.origin)) return;
    const holder = document.createElement('a'); holder.className = 'lp'; holder.href = url; holder.target = '_blank'; holder.rel = 'noopener';
    for (let n = 0; n < 6; n++) {
      let r = MEM[url];
      if (!r) { try { const x = await sb.rpc('link_preview', { p_url: url }); r = x.data; } catch (e) { r = null; } }
      if (!r || r.status === 'bad' || r.status === 'fail') { if (r) MEM[url] = r; return; }
      if (r.status === 'done') {
        MEM[url] = r;
        holder.innerHTML = (r.image ? '<img src="' + esc(r.image) + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
          '<div class="lp-b"><small>' + esc(r.site || '') + '</small><b>' + esc(r.title || '') + '</b>' + (r.descr ? '<span>' + esc(r.descr) + '</span>' : '') + '</div>';
        const t = Q('.m-text', msg); if (t && msg.isConnected) { t.after(holder); }
        return;
      }
      await new Promise(r => setTimeout(r, 2500));
      if (!msg.isConnected) return;
    }
  }

  /* --- разделители дат --- */
  const dayName = d => {
    const n = new Date(), y = new Date(Date.now() - 864e5);
    if (d.toDateString() === n.toDateString()) return 'Сегодня';
    if (d.toDateString() === y.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: d.getFullYear() === n.getFullYear() ? undefined : 'numeric' });
  };
  function seps(box) {
    const want = [];
    QA('.msg', box).forEach(r => {
      const m = window.__MC && __MC[r.dataset.id]; if (!m || !m.created_at) return;
      const d = new Date(m.created_at), k = d.toDateString();
      if (k !== (want.length ? want[want.length - 1].k : '')) want.push({ k, d, r });
    });
    const cur = QA('.dsep', box);
    const same = cur.length === want.length && cur.every((x, i) => x.dataset.k === want[i].k && x.nextElementSibling === want[i].r);
    if (same) return;
    cur.forEach(x => x.remove());
    want.forEach(w => { const s = document.createElement('div'); s.className = 'dsep'; s.dataset.k = w.k; s.innerHTML = '<span>' + dayName(w.d) + '</span>'; w.r.before(s); });
  }

  let busy = false, timer = 0;
  function pass() {
    const box = Q('#messages'); if (!box) return;
    busy = true;
    QA('.msg', box).forEach(r => { const t = Q('.m-text', r); if (t) fmt(t); big(r); preview(r); });
    seps(box);
    busy = false; bar(); obs.takeRecords();
  }
  const obs = new MutationObserver(() => { if (busy) return; clearTimeout(timer); timer = setTimeout(pass, 60); });
  obs.observe(document.body, { childList: true, subtree: true });

  /* --- кнопка «вниз» --- */
  let btn = null;
  function bar() {
    const box = Q('#messages');
    if (!box || !G(() => CURRENT)) { if (btn) btn.classList.remove('on'); return; }
    if (!btn) {
      btn = document.createElement('button'); btn.className = 'dn-btn'; btn.setAttribute('aria-label', 'Вниз');
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
      btn.onclick = () => { const b = Q('#messages'); b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' }); };
      document.body.appendChild(btn);
    }
    const far = box.scrollHeight - box.scrollTop - box.clientHeight > 350;
    btn.classList.toggle('on', far);
  }
  document.addEventListener('scroll', e => { if (e.target && e.target.id === 'messages') bar(); }, true);
  setInterval(bar, 1500);
})();
