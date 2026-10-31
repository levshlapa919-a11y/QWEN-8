/* golda-mesenger: экран бана — долгий громкий жуткий звук (WebAudio) + вылетающее лицо.
   Звук собран на лету (бесплатно, без внешних файлов). Громкость ограничена компрессором/лимитером,
   максимум — это максимум громкости самого телефона. Вспышки редкие (без стробоскопа). */
(function () {
  'use strict';
  const Q = s => document.querySelector(s);
  const DUR = 32;                 // секунд звука
  let ctx = null, master = null, started = false, stopTimer = 0, nodes = [];

  function curve(k) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28; comp.knee.value = 8; comp.ratio.value = 20; comp.attack.value = 0.002; comp.release.value = 0.15;
    master = ctx.createGain(); master.gain.value = 0.95;
    const dist = ctx.createWaveShaper(); dist.curve = curve(60); dist.oversample = '4x';
    dist.connect(comp); comp.connect(master); master.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.05;
    const keep = n => { nodes.push(n); return n; };

    // 1) низкий гул, который растёт (две расстроенные пилы + суб)
    [38, 38.9, 57].forEach((f, i) => {
      const o = keep(ctx.createOscillator()); o.type = i === 2 ? 'square' : 'sawtooth'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 6); g.gain.setValueAtTime(0.5, t0 + DUR - 4); g.gain.linearRampToValueAtTime(0.0001, t0 + DUR);
      const lfo = keep(ctx.createOscillator()); lfo.frequency.value = 0.3 + i * 0.17; const lg = ctx.createGain(); lg.gain.value = 3; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t0);
      o.connect(g); g.connect(dist); o.start(t0); o.stop(t0 + DUR);
    });

    // 2) визжащий «крик»: частота скользит вверх/вниз, много вибрато и дисторшн
    const scr = (start, len, f1, f2, vol) => {
      const o = keep(ctx.createOscillator()); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f1, t0 + start);
      o.frequency.exponentialRampToValueAtTime(f2, t0 + start + len * 0.45); o.frequency.exponentialRampToValueAtTime(f1 * 0.8, t0 + start + len);
      const v = keep(ctx.createOscillator()); v.frequency.value = 9 + Math.random() * 7; const vg = ctx.createGain(); vg.gain.value = f1 * 0.06; v.connect(vg); vg.connect(o.frequency);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.4;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0 + start); g.gain.linearRampToValueAtTime(vol, t0 + start + 0.05); g.gain.setValueAtTime(vol, t0 + start + len - 0.25); g.gain.linearRampToValueAtTime(0.0001, t0 + start + len);
      o.connect(bp); bp.connect(g); g.connect(dist); v.start(t0 + start); o.start(t0 + start); o.stop(t0 + start + len + 0.1); v.stop(t0 + start + len + 0.1);
    };
    scr(0.2, 2.6, 620, 2300, 0.9);            // первый удар сразу
    scr(4.5, 3.2, 540, 2600, 0.8);
    scr(9, 3.6, 700, 3000, 0.85);
    scr(14.5, 4, 480, 2800, 0.9);
    scr(20, 4.5, 650, 3300, 0.95);
    scr(26, 5.5, 520, 3600, 1);

    // 3) шум-удары (как «ррраз») в случайные моменты
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const hit = (t, len, vol) => {
      const s = keep(ctx.createBufferSource()); s.buffer = nb; s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 500;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0 + t); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + len);
      s.connect(f); f.connect(g); g.connect(dist); s.start(t0 + t); s.stop(t0 + t + len + 0.05);
    };
    hit(0.1, 0.9, 1); hit(3.3, 0.5, 0.7); hit(8.2, 0.6, 0.8); hit(13.4, 0.7, 0.8); hit(19.2, 0.8, 0.9); hit(25.4, 1, 1); hit(30, 1.2, 1);
    for (let i = 0; i < 14; i++) hit(2 + Math.random() * 28, 0.12 + Math.random() * 0.2, 0.5);

    // 4) тревожный писк на фоне (диссонанс)
    [1760, 1864, 2489].forEach((f, i) => {
      const o = keep(ctx.createOscillator()); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0 + 1); g.gain.linearRampToValueAtTime(0.12, t0 + 12); g.gain.linearRampToValueAtTime(0.0001, t0 + DUR);
      o.connect(g); g.connect(comp); o.start(t0 + 1 + i * 0.2); o.stop(t0 + DUR);
    });
    return true;
  }

  function vibrate() { try { navigator.vibrate && navigator.vibrate([400, 100, 400, 100, 900, 150, 400, 100, 1400, 200, 2000]); } catch (e) { } }

  function pop() {
    const sc = Q('#banScreen'), img = Q('#screamImgEl'); if (!sc || !img) return;
    let fl = Q('#bsFlash'); if (!fl) { fl = document.createElement('div'); fl.id = 'bsFlash'; fl.className = 'bs-flash'; sc.appendChild(fl); const v = document.createElement('div'); v.className = 'bs-vig'; sc.appendChild(v); }
    const go = () => { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop'); sc.classList.add('shown'); vibrate(); };
    go();
    // лицо вылетает ещё несколько раз, редко (не чаще раза в ~4 сек)
    [5, 10, 15.5, 21, 27].forEach(s => setTimeout(() => { if (!sc.classList.contains('hidden')) go(); }, s * 1000));
  }

  function start() {
    if (started) return; started = true;
    let ok = false; try { ok = build(); } catch (e) { }
    if (ok) { try { ctx.resume(); } catch (e) { } stopTimer = setTimeout(() => { try { ctx.close(); } catch (e) { } started = false; ctx = null; }, (DUR + 1) * 1000); }
    pop();
  }

  function stop() {
    clearTimeout(stopTimer); started = false;
    try { nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) { } }); } catch (e) { } nodes = [];
    try { ctx && ctx.close(); } catch (e) { } ctx = null;
    try { navigator.vibrate && navigator.vibrate(0); } catch (e) { }
  }

  function arm() {
    const sc = Q('#banScreen'); if (!sc) return;
    sc.classList.add('live');
    // браузер разрешает звук только после касания: ждём первого касания/клавиши, но пробуем и сразу
    const once = () => { ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(e => document.removeEventListener(e, once, true)); start(); };
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(e => document.addEventListener(e, once, true));
    try {
      const probe = new (window.AudioContext || window.webkitAudioContext)();
      probe.resume().then(() => { if (probe.state === 'running') { probe.close(); once(); } else probe.close(); }).catch(() => { try { probe.close(); } catch (e) { } });
    } catch (e) { }
  }

  // подменяем показ экрана бана
  window.showBanScreen = function () {
    const sc = Q('#banScreen'), img = Q('#screamImgEl'); if (!sc) return;
    if (img) img.src = 'scream.jpg';
    sc.classList.remove('hidden', 'shown'); started = false; arm();
  };
  // выход прекращает звук
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#bsLogoutReal')) stop(); }, true);
  // пользователь разбанен -> звук стоп
  new MutationObserver(() => { const sc = Q('#banScreen'); if (sc && sc.classList.contains('hidden')) stop(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();
