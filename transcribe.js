/* Расшифровка голосовых сообщений: Whisper работает прямо в браузере, звук никуда не отправляется. */
(function () {
  'use strict';
  const LIB = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  const MODEL = 'Xenova/whisper-base';
  const LS = { g: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, s: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const key = u => 'golda_tr_' + String(u).split('/').slice(-2).join('/').slice(-60);
  let asr = null, loading = null, queue = Promise.resolve();

  async function getAsr(onProg) {
    if (asr) return asr;
    if (loading) return loading;
    loading = (async () => {
      const tf = await import(LIB);
      tf.env.allowLocalModels = false; tf.env.useBrowserCache = true;
      try { tf.env.backends.onnx.wasm.numThreads = 1; } catch (e) { }
      asr = await tf.pipeline('automatic-speech-recognition', MODEL, { progress_callback: p => { if (p && p.status === 'progress' && onProg) onProg(Math.round(p.progress || 0)); } });
      return asr;
    })();
    try { return await loading; } catch (e) { loading = null; throw e; }
  }
  async function pcm(url) {
    const buf = await (await fetch(url)).arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC();
    const dec = await new Promise((ok, no) => ctx.decodeAudioData(buf.slice(0), ok, no)); ctx.close && ctx.close();
    const len = Math.ceil(dec.duration * 16000); const off = new OfflineAudioContext(1, len, 16000);
    const src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
    return (await off.startRendering()).getChannelData(0);
  }
  function ui(a) {
    if (a.dataset.tr) return; a.dataset.tr = '1';
    const box = document.createElement('div'); box.className = 'tr-box';
    box.innerHTML = '<button type="button" class="tr-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h14"/></svg><span>Расшифровать</span></button><div class="tr-txt" hidden></div>';
    a.insertAdjacentElement('afterend', box);
    const btn = box.querySelector('.tr-btn'), txt = box.querySelector('.tr-txt'), lab = btn.querySelector('span');
    const show = t => { txt.hidden = false; txt.textContent = t || '(речь не распознана)'; btn.hidden = true; };
    const cached = LS.g(key(a.src)); if (cached) { show(cached); return; }
    btn.onclick = () => {
      if (btn.disabled) return;
      if (!asr && !LS.g('golda_tr_ok') && !confirm('Для расшифровки нужно один раз скачать модель распознавания (около 80 МБ). Дальше она работает без загрузки, а звук остаётся на твоём устройстве. Скачать?')) return;
      LS.s('golda_tr_ok', '1'); btn.disabled = true; lab.textContent = 'Подготовка…';
      queue = queue.then(async () => {
        try {
          const m = await getAsr(p => { lab.textContent = 'Загрузка модели ' + p + '%'; });
          lab.textContent = 'Расшифровываю…';
          const data = await pcm(a.src);
          const r = await m(data, { language: 'russian', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
          const t = (r && r.text || '').trim(); if (t) LS.s(key(a.src), t); show(t);
        } catch (e) { console.error(e); btn.disabled = false; lab.textContent = 'Не вышло, повторить'; }
      });
    };
  }
  const scan = () => document.querySelectorAll('audio.m-audio:not([data-tr])').forEach(ui);
  let t = null; new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 120); }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
