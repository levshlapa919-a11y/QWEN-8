/* golda-mesenger: экран бана. Звук scream.mp3 повторяется 3 раза, лицо на весь экран с инверсией.
   Громкость = максимум громкости телефона (+усиление с лимитером). Инверсия мигает ~2 раза в секунду. */
(function () {
  'use strict';
  const Q = s => document.querySelector(s);
  const REPEATS = 3, GAP = 0.6;
  let ctx = null, started = false, timers = [], srcs = [], fallback = null;

  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function vibrate() { try { navigator.vibrate && navigator.vibrate([500, 120, 500, 120, 900]); } catch (e) { } }

  function pop() {
    const sc = Q('#banScreen'), img = Q('#screamImgEl'); if (!sc || !img) return;
    let fl = Q('#bsFlash');
    if (!fl) { fl = document.createElement('div'); fl.id = 'bsFlash'; fl.className = 'bs-flash'; sc.appendChild(fl); const v = document.createElement('div'); v.className = 'bs-vig'; sc.appendChild(v); }
    fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop');
    sc.classList.add('shown'); vibrate();
  }

  async function start() {
    if (started) return; started = true;
    const sc = Q('#banScreen');
    let buf = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC(); try { await ctx.resume(); } catch (e) { }
      const r = await fetch('scream.mp3'); const ab = await r.arrayBuffer();
      buf = await new Promise((ok, no) => ctx.decodeAudioData(ab, ok, no));
    } catch (e) { buf = null; }

    const dur = buf ? buf.duration : 2.7;
    for (let i = 0; i < REPEATS; i++) {
      const at = i * (dur + GAP);
      timers.push(setTimeout(() => { if (sc && !sc.classList.contains('hidden')) pop(); }, at * 1000));
    }
    if (buf && ctx) {
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 0; comp.ratio.value = 20; comp.attack.value = 0.001; comp.release.value = 0.1;
      const g = ctx.createGain(); g.gain.value = 2.2; g.connect(comp); comp.connect(ctx.destination);
      const t0 = ctx.currentTime + 0.05;
      for (let i = 0; i < REPEATS; i++) {
        const s = ctx.createBufferSource(); s.buffer = buf; s.connect(g); s.start(t0 + i * (dur + GAP)); srcs.push(s);
      }
    } else {
      // запасной вариант: обычный <audio>
      let n = 0; fallback = new Audio('scream.mp3'); fallback.volume = 1;
      fallback.onended = () => { if (++n < REPEATS) setTimeout(() => fallback && fallback.play().catch(() => { }), GAP * 1000); };
      fallback.play().catch(() => { });
    }
  }

  function stop() {
    clearTimers(); started = false;
    srcs.forEach(s => { try { s.stop(); } catch (e) { } }); srcs = [];
    try { ctx && ctx.close(); } catch (e) { } ctx = null;
    try { fallback && fallback.pause(); } catch (e) { } fallback = null;
    try { navigator.vibrate && navigator.vibrate(0); } catch (e) { }
  }

  function arm() {
    const sc = Q('#banScreen'); if (!sc) return;
    sc.classList.add('live');
    const once = () => { ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(e => document.removeEventListener(e, once, true)); start(); };
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(e => document.addEventListener(e, once, true));
    try {
      const probe = new (window.AudioContext || window.webkitAudioContext)();
      probe.resume().then(() => { const ok = probe.state === 'running'; probe.close(); if (ok) once(); }).catch(() => { try { probe.close(); } catch (e) { } });
    } catch (e) { }
  }

  window.showBanScreen = function () {
    const sc = Q('#banScreen'), img = Q('#screamImgEl'); if (!sc) return;
    if (img) img.src = 'scream.jpg';
    sc.classList.remove('hidden', 'shown'); started = false; arm();
  };
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#bsLogoutReal')) stop(); }, true);
  new MutationObserver(() => { const sc = Q('#banScreen'); if (sc && sc.classList.contains('hidden')) stop(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();
