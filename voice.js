/* Голосовые: аккуратный плеер с волной и скоростью вместо стандартного <audio> */
(function () {
  'use strict';
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fmt = s => { if (!isFinite(s)) return '0:00'; s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const PLAY = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>';
  const PAUSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>';
  let current = null;
  function build(a) {
    if (a.dataset.vp) return; a.dataset.vp = '1'; a.style.display = 'none';
    const lab = a.previousElementSibling; if (lab && lab.classList.contains('m-voice')) lab.style.display = 'none';
    const N = 34, seed = hash(a.src || ''); let bars = '';
    for (let i = 0; i < N; i++) { const v = Math.abs(Math.sin(seed % 97 + i * 1.7) * Math.cos((seed >> 3) % 31 + i * .6)); bars += `<i style="height:${Math.round(18 + v * 82)}%"></i>`; }
    const el = document.createElement('div'); el.className = 'vp';
    el.innerHTML = `<button type="button" class="vp-b" aria-label="Воспроизвести">${PLAY}</button><div class="vp-m"><div class="vp-bars">${bars}</div><div class="vp-t">0:00</div></div><button type="button" class="vp-s">1×</button>`;
    a.parentNode.insertBefore(el, a);
    const b = el.querySelector('.vp-b'), bs = el.querySelectorAll('.vp-bars i'), t = el.querySelector('.vp-t'), sp = el.querySelector('.vp-s'), wrap = el.querySelector('.vp-bars');
    const paint = () => { const d = a.duration; const p = isFinite(d) && d > 0 ? a.currentTime / d : 0; const k = Math.floor(p * N); bs.forEach((x, i) => x.classList.toggle('on', i < k)); t.textContent = isFinite(d) && d > 0 ? (a.paused && a.currentTime === 0 ? fmt(d) : fmt(a.currentTime)) : '0:00'; };
    a.addEventListener('loadedmetadata', () => { if (a.duration === Infinity) { a.currentTime = 1e101; a.addEventListener('timeupdate', function f() { a.removeEventListener('timeupdate', f); a.currentTime = 0; paint(); }); } else paint(); });
    a.addEventListener('timeupdate', paint); a.addEventListener('durationchange', paint);
    a.addEventListener('play', () => { b.innerHTML = PAUSE; el.classList.add('pl'); if (current && current !== a) current.pause(); current = a; });
    a.addEventListener('pause', () => { b.innerHTML = PLAY; el.classList.remove('pl'); });
    a.addEventListener('ended', () => { a.currentTime = 0; paint(); });
    b.onclick = () => { a.paused ? a.play().catch(() => { }) : a.pause(); };
    wrap.onclick = e => { const r = wrap.getBoundingClientRect(), d = a.duration; if (isFinite(d)) { a.currentTime = d * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); paint(); } };
    const S = [1, 1.5, 2]; let si = 0; sp.onclick = () => { si = (si + 1) % 3; a.playbackRate = S[si]; sp.textContent = S[si] + '×'; };
    a.preload = 'metadata'; a.load && a.load();
  }
  const scan = () => document.querySelectorAll('audio.m-audio:not([data-vp])').forEach(build);
  let tm = null; new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(scan, 80); }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
