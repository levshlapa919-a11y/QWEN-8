/* golda-mesenger: аудио/видео звонки (WebRTC). Бесплатно: сигналы через Supabase Realtime,
   голос и видео идут напрямую между телефонами. Подключается ПОСЛЕ основного скрипта. */
(function () {
  'use strict';

  const ICE = {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
      // бесплатный публичный TURN — помогает, когда телефоны в разных сетях
      { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443?transport=tcp'],
        username: 'openrelayproject', credential: 'openrelayproject' }
    ]
  };
  const RING_MS = 45000;
  let call = null;           // активный звонок
  let rtChan = null, rtFor = null;

  const $q = s => document.querySelector(s);
  const T = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  const me = () => (typeof ME !== 'undefined' ? ME : null);
  const sbc = () => (typeof sb !== 'undefined' ? sb : null);
  const say = (m, k) => { try { toast(m, k); } catch (_) {} };

  // ===== Стили и разметка =====
  const css = document.createElement('style');
  css.textContent = `
  #callUi{position:fixed;inset:0;z-index:9000;display:none;flex-direction:column;align-items:center;justify-content:space-between;
    background:radial-gradient(900px 600px at 50% -10%,rgba(61,255,133,.22),transparent 60%),linear-gradient(180deg,#07130b,#030805);color:#eafff1;
    padding:calc(env(safe-area-inset-top,0px) + 40px) 20px calc(env(safe-area-inset-bottom,0px) + 34px);overflow:hidden}
  #callUi.show{display:flex;animation:callIn .3s ease}
  @keyframes callIn{from{opacity:0;transform:scale(1.03)}}
  #callRemote{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;display:none}
  #callUi.has-video #callRemote{display:block}
  #callUi.has-video::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),transparent 28%,transparent 60%,rgba(0,0,0,.65));pointer-events:none}
  #callLocal{position:absolute;right:16px;top:calc(env(safe-area-inset-top,0px) + 16px);width:104px;height:148px;object-fit:cover;border-radius:16px;
    border:2px solid rgba(61,255,133,.5);background:#000;display:none;z-index:3;transform:scaleX(-1);box-shadow:0 8px 26px rgba(0,0,0,.5)}
  #callUi.has-local #callLocal{display:block}
  .call-top{position:relative;z-index:2;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:6vh}
  #callUi.has-video .call-top{margin-top:0;align-self:flex-start;align-items:flex-start;text-align:left}
  #callUi.has-video #callAva{display:none}
  #callAva .ava{width:132px;height:132px;font-size:48px;box-shadow:0 0 0 6px rgba(61,255,133,.12),0 0 50px rgba(61,255,133,.35)}
  #callUi.ringing #callAva .ava{animation:callPulse 1.6s ease-in-out infinite}
  @keyframes callPulse{50%{box-shadow:0 0 0 18px rgba(61,255,133,.08),0 0 70px rgba(61,255,133,.55)}}
  #callName{font:800 26px var(--disp,sans-serif);text-shadow:0 2px 14px rgba(0,0,0,.6)}
  #callStatus{font:500 15px var(--mono,monospace);color:#9fe6b9;text-shadow:0 2px 10px rgba(0,0,0,.6)}
  .call-btns{position:relative;z-index:2;display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}
  .cbtn{width:64px;height:64px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;color:#fff;background:rgba(255,255,255,.14);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:transform .12s,background .2s;font-size:0}
  .cbtn:active{transform:scale(.9)}
  .cbtn.off{background:#fff;color:#111}
  .cbtn.end{background:#ff3b4f;box-shadow:0 0 28px rgba(255,59,79,.6);width:72px;height:72px}
  .cbtn.accept{background:#2ee66b;box-shadow:0 0 28px rgba(46,230,107,.7);width:72px;height:72px;animation:callShake 1.2s ease-in-out infinite}
  @keyframes callShake{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}
  .cbtn svg{width:28px;height:28px}
  .hide{display:none!important}
  `;
  document.head.appendChild(css);

  const ui = document.createElement('div');
  ui.id = 'callUi';
  ui.innerHTML = `
    <video id="callRemote" autoplay playsinline></video>
    <video id="callLocal" autoplay playsinline muted></video>
    <div class="call-top"><div id="callAva"></div><div id="callName">…</div><div id="callStatus">…</div></div>
    <div class="call-btns" id="callBtnsIn">
      <button class="cbtn end" id="cbDecline" aria-label="Отклонить"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.99.99 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg></button>
      <button class="cbtn accept" id="cbAccept" aria-label="Ответить"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"/></svg></button>
    </div>
    <div class="call-btns hide" id="callBtnsActive">
      <button class="cbtn" id="cbMute" aria-label="Микрофон"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/><path id="cbMuteSlash" class="hide" d="M3 3l18 18"/></svg></button>
      <button class="cbtn hide" id="cbCam" aria-label="Камера"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/><path id="cbCamSlash" class="hide" d="M2 2l20 20"/></svg></button>
      <button class="cbtn hide" id="cbFlip" aria-label="Перевернуть камеру"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-15.5-6.2L3 8M3 3v5h5M3 12a9 9 0 0 0 15.5 6.2L21 16M21 21v-5h-5"/></svg></button>
      <button class="cbtn end" id="cbHang" aria-label="Завершить"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.99.99 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg></button>
    </div>`;
  document.body.appendChild(ui);
  const remoteEl = $q('#callRemote'), localEl = $q('#callLocal');

  // ===== Рингтон (WebAudio) и вибрация =====
  let actx = null, ringTimer = null;
  function unlockAudio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (_) {}
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev => addEventListener(ev, unlockAudio, { passive: true }));

  function beep(freq, t0, dur, vol, type) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function incomingMelody() {
    if (!actx || actx.state !== 'running') return;
    const t = actx.currentTime + 0.05;
    [[880, 0], [1175, 0.16], [880, 0.32], [1175, 0.48], [1319, 0.80], [1175, 0.96], [880, 1.12]].forEach(([f, d]) => beep(f, t + d, 0.22, 0.28, 'triangle'));
  }
  function ringback() {
    if (!actx || actx.state !== 'running') return;
    const t = actx.currentTime + 0.05;
    beep(425, t, 1.0, 0.16); beep(440, t, 1.0, 0.12);
  }
  function startRing(kind) {
    stopRing();
    const tick = () => {
      if (kind === 'in') {
        incomingMelody();
        if (navigator.vibrate) navigator.vibrate([500, 250, 500]);
      } else ringback();
    };
    tick();
    ringTimer = setInterval(tick, kind === 'in' ? 2600 : 3500);
  }
  function stopRing() {
    if (ringTimer) { clearInterval(ringTimer); ringTimer = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // ===== UI =====
  function showUi(opts) {
    ui.classList.add('show');
    ui.classList.toggle('ringing', !!opts.ringing);
    $q('#callAva').innerHTML = opts.avaHtml || '';
    T('callName', opts.name || '');
    T('callStatus', opts.status || '');
    $q('#callBtnsIn').classList.toggle('hide', !opts.incoming);
    $q('#callBtnsActive').classList.toggle('hide', !!opts.incoming);
    $q('#cbDecline').classList.toggle('hide', !opts.incoming);
  }
  function setStatus(t) { T('callStatus', t); }
  function hideUi() {
    ui.classList.remove('show', 'has-video', 'has-local', 'ringing');
    remoteEl.srcObject = null; localEl.srcObject = null;
  }

  let timerId = null, t0 = 0;
  function startTimer() {
    if (timerId) return;
    t0 = Date.now();
    timerId = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      setStatus(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
    }, 500);
  }

  // ===== Медиа =====
  async function getMedia(kind, facing) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Браузер не поддерживает звонки');
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: kind === 'video' ? { facingMode: facing || 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false
    });
  }
  function mediaError(e) {
    const n = e && e.name;
    if (n === 'NotAllowedError') return 'Нет доступа к микрофону/камере. Разреши в настройках.';
    if (n === 'NotFoundError') return 'Микрофон или камера не найдены.';
    return 'Не удалось включить микрофон/камеру: ' + (e.message || e);
  }

  async function wakeLock() { try { if (navigator.wakeLock) call.wl = await navigator.wakeLock.request('screen'); } catch (_) {} }

  // ===== Соединение =====
  function send(msg) { try { call.chan.send({ type: 'broadcast', event: 'sig', payload: msg }); } catch (_) {} }

  function makePC() {
    const pc = new RTCPeerConnection(ICE);
    call.pc = pc;
    call.pendingIce = [];
    call.localStream.getTracks().forEach(t => pc.addTrack(t, call.localStream));
    pc.onicecandidate = e => { if (e.candidate) send({ t: 'ice', c: e.candidate }); };
    pc.ontrack = e => {
      const st = e.streams[0] || new MediaStream([e.track]);
      remoteEl.srcObject = st;
      remoteEl.play && remoteEl.play().catch(() => {});
      if (st.getVideoTracks().length) ui.classList.add('has-video');
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') {
        call.state = 'connected'; stopRing(); ui.classList.remove('ringing'); startTimer();
        if (call.kind === 'video' && call.localStream.getVideoTracks().length) ui.classList.add('has-local');
      } else if (s === 'failed') {
        endCall({ reason: 'Не удалось соединиться. Попробуйте позже.', db: 'ended' });
      } else if (s === 'disconnected') {
        clearTimeout(call.discT);
        call.discT = setTimeout(() => { if (call && call.pc && call.pc.connectionState !== 'connected') endCall({ reason: 'Связь потеряна', db: 'ended' }); }, 8000);
      }
    };
    return pc;
  }

  async function flushIce() {
    while (call && call.pendingIce.length) {
      try { await call.pc.addIceCandidate(call.pendingIce.shift()); } catch (_) {}
    }
  }

  async function onSignal(p) {
    if (!call || !p) return;
    try {
      if (p.t === 'ready' && call.role === 'caller' && !call.offered) {
        call.offered = true;
        setStatus('Соединяем…');
        const offer = await call.pc.createOffer();
        await call.pc.setLocalDescription(offer);
        send({ t: 'offer', sdp: call.pc.localDescription });
      } else if (p.t === 'offer' && call.role === 'callee') {
        await call.pc.setRemoteDescription(p.sdp);
        await flushIce();
        const ans = await call.pc.createAnswer();
        await call.pc.setLocalDescription(ans);
        send({ t: 'answer', sdp: call.pc.localDescription });
      } else if (p.t === 'answer' && call.role === 'caller') {
        await call.pc.setRemoteDescription(p.sdp);
        await flushIce();
      } else if (p.t === 'ice') {
        if (call.pc.remoteDescription) await call.pc.addIceCandidate(p.c).catch(() => {});
        else call.pendingIce.push(p.c);
      } else if (p.t === 'hangup') {
        endCall({ reason: 'Звонок завершён', notify: false });
      }
    } catch (e) { console.error('signal error', e); }
  }

  function joinChannel(id, onSubscribed) {
    call.chan = sbc().channel('call-' + id, { config: { broadcast: { self: false } } });
    call.chan.on('broadcast', { event: 'sig' }, ({ payload }) => onSignal(payload)).subscribe(status => {
      if (status === 'SUBSCRIBED' && onSubscribed) onSubscribed();
    });
  }

  function peerOf(chat) { return (chat.members || []).find(m => m.id !== me().id) || {}; }

  // ===== Исходящий =====
  async function startCall(kind) {
    if (call) return say('Уже идёт звонок');
    const m = me(); if (!m) return;
    if (m.is_banned) return say('Аккаунт заблокирован', 'red');
    const chat = CHATS.find(c => c.id === CURRENT);
    if (!chat || chat.type !== 'direct') return say('Звонки доступны в личных чатах');
    const peer = peerOf(chat);
    if (BLOCKED.includes(peer.id)) return say('Сначала разблокируй пользователя');
    unlockAudio();

    let stream;
    try { stream = await getMedia(kind); } catch (e) { return say(mediaError(e), 'red'); }

    const id = (crypto.randomUUID && crypto.randomUUID()) || ('c' + Date.now() + Math.random().toString(16).slice(2));
    call = { id, chatId: chat.id, peerId: peer.id, kind, role: 'caller', localStream: stream, state: 'ringing', facing: 'user' };
    localEl.srcObject = stream; if (kind === 'video') ui.classList.add('has-local');
    showUi({ name: peer.display_name || peer.username || 'Собеседник', avaHtml: avatarHTML(peer, 'l'), status: 'Звоним…', ringing: true, incoming: false });
    setActiveButtons(kind);
    makePC();
    joinChannel(id);
    startRing('out');
    wakeLock();

    const { error } = await sbc().from('calls').insert({ id, chat_id: chat.id, caller_id: m.id, kind });
    if (error) { endCall({ reason: 'Не удалось позвонить', db: null, silent: true }); return say('Ошибка: ' + error.message, 'red'); }
    sbc().rpc('call_reachability', { p_chat: chat.id }).then(({ data }) => {
      if (!data || !call || call.id !== id || call.state !== 'ringing') return;
      if (!data.online && !data.push) setStatus('Не в сети, уведомления у него выключены — звонок может не дойти');
      else if (!data.online) setStatus('Звоним… (приложение закрыто, придёт уведомление)');
    }).catch(() => {});
    call.timeoutT = setTimeout(() => {
      if (call && call.state === 'ringing') endCall({ reason: 'Нет ответа', db: 'missed' });
    }, RING_MS);
  }

  // ===== Входящий =====
  let incoming = null; // {row, timer}
  function onIncoming(row, ageSec) {
    const m = me(); if (!m || !row || row.caller_id === m.id || row.status !== 'ringing') return;
    if (ageSec != null && ageSec > RING_MS / 1000) return; // возраст считает сервер
    if (typeof BLOCKED !== 'undefined' && BLOCKED.includes(row.caller_id)) return;
    if (m.is_banned) return;
    if (call || incoming) {
      if ((call && call.id === row.id) || (incoming && incoming.row.id === row.id)) return;
      sbc().from('calls').update({ status: 'declined', ended_at: new Date().toISOString() }).eq('id', row.id).eq('status', 'ringing'); // занято
      return;
    }
    const chat = (typeof CHATS !== 'undefined' ? CHATS : []).find(c => c.id === row.chat_id);
    const caller = (typeof PROFILES !== 'undefined' && PROFILES[row.caller_id]) || (chat && chat.members.find(x => x.id === row.caller_id)) || {};
    incoming = { row, timer: setTimeout(dismissIncoming, Math.max(8000, RING_MS - (ageSec || 0) * 1000)) };
    showUi({ name: caller.display_name || caller.username || 'Звонок', avaHtml: avatarHTML(caller, 'l'),
      status: row.kind === 'video' ? '📹 Видеозвонок…' : '📞 Входящий звонок…', ringing: true, incoming: true });
    startRing('in');
  }
  function dismissIncoming(reason) {
    if (!incoming) return;
    clearTimeout(incoming.timer); incoming = null;
    stopRing(); hideUi();
    if (typeof reason === 'string') say(reason);
  }

  async function acceptIncoming() {
    if (!incoming) return;
    unlockAudio();
    const row = incoming.row;
    let stream;
    try { stream = await getMedia(row.kind); } catch (e) {
      say(mediaError(e), 'red');
      await declineIncoming(); return;
    }
    const { data, error } = await sbc().from('calls').update({ status: 'accepted', answered_at: new Date().toISOString() })
      .eq('id', row.id).eq('status', 'ringing').select();
    if (error || !data || !data.length) { stream.getTracks().forEach(t => t.stop()); dismissIncoming('Звонок уже завершён'); return; }
    clearTimeout(incoming.timer); incoming = null; stopRing();
    call = { id: row.id, chatId: row.chat_id, peerId: row.caller_id, kind: row.kind, role: 'callee', localStream: stream, state: 'connecting', facing: 'user' };
    localEl.srcObject = stream; if (row.kind === 'video') ui.classList.add('has-local');
    $q('#callBtnsIn').classList.add('hide'); $q('#callBtnsActive').classList.remove('hide');
    ui.classList.remove('ringing');
    setStatus('Соединяем…'); setActiveButtons(row.kind);
    makePC();
    joinChannel(row.id, () => send({ t: 'ready' }));
    wakeLock();
  }
  async function declineIncoming() {
    if (!incoming) return;
    const row = incoming.row;
    dismissIncoming();
    await sbc().from('calls').update({ status: 'declined', ended_at: new Date().toISOString() }).eq('id', row.id).eq('status', 'ringing');
  }

  // ===== Завершение =====
  function endCall(o) {
    o = o || {};
    if (!call) return;
    const c = call; call = null;
    clearTimeout(c.timeoutT); clearTimeout(c.discT);
    stopRing();
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (o.notify !== false && c.chan) { try { c.chan.send({ type: 'broadcast', event: 'sig', payload: { t: 'hangup' } }); } catch (_) {} }
    if (o.db !== null && o.db !== undefined && sbc()) {
      const upd = { status: o.db, ended_at: new Date().toISOString() };
      let q = sbc().from('calls').update(upd).eq('id', c.id);
      q = o.db === 'missed' ? q.eq('status', 'ringing') : q.in('status', ['ringing', 'accepted']);
      q.then(() => {}, () => {});
    }
    try { c.pc && c.pc.close(); } catch (_) {}
    try { c.localStream && c.localStream.getTracks().forEach(t => t.stop()); } catch (_) {}
    try { c.wl && c.wl.release(); } catch (_) {}
    setTimeout(() => { try { c.chan && sbc().removeChannel(c.chan); } catch (_) {} }, 500);
    if (!o.silent) { setStatus(o.reason || 'Звонок завершён'); ui.classList.remove('ringing'); setTimeout(() => { if (!call && !incoming) hideUi(); }, 1100); }
    else hideUi();
  }
  function hangup() {
    if (!call) return;
    endCall({ reason: 'Звонок завершён', db: call.state === 'ringing' ? 'missed' : 'ended' });
  }

  // ===== Кнопки управления =====
  function setActiveButtons(kind) {
    $q('#cbCam').classList.toggle('hide', kind !== 'video');
    $q('#cbFlip').classList.toggle('hide', kind !== 'video');
    $q('#cbMute').classList.remove('off'); $q('#cbCam').classList.remove('off');
    $q('#cbMuteSlash').classList.add('hide'); $q('#cbCamSlash').classList.add('hide');
  }
  $q('#cbAccept').onclick = acceptIncoming;
  $q('#cbDecline').onclick = declineIncoming;
  $q('#cbHang').onclick = hangup;
  $q('#cbMute').onclick = () => {
    if (!call) return;
    const t = call.localStream.getAudioTracks()[0]; if (!t) return;
    t.enabled = !t.enabled;
    $q('#cbMute').classList.toggle('off', !t.enabled); $q('#cbMuteSlash').classList.toggle('hide', t.enabled);
  };
  $q('#cbCam').onclick = () => {
    if (!call) return;
    const t = call.localStream.getVideoTracks()[0]; if (!t) return;
    t.enabled = !t.enabled;
    $q('#cbCam').classList.toggle('off', !t.enabled); $q('#cbCamSlash').classList.toggle('hide', t.enabled);
  };
  $q('#cbFlip').onclick = async () => {
    if (!call || call.kind !== 'video') return;
    try {
      const next = call.facing === 'user' ? 'environment' : 'user';
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next } });
      const nt = s.getVideoTracks()[0];
      const sender = call.pc.getSenders().find(x => x.track && x.track.kind === 'video');
      if (sender) await sender.replaceTrack(nt);
      call.localStream.getVideoTracks().forEach(t => { t.stop(); call.localStream.removeTrack(t); });
      call.localStream.addTrack(nt);
      localEl.srcObject = call.localStream;
      call.facing = next;
      localEl.style.transform = next === 'user' ? 'scaleX(-1)' : 'none';
    } catch (e) { say('Не удалось переключить камеру', 'red'); }
  };

  // ===== Realtime: следим за таблицей calls =====
  function onCallRow(row) {
    if (!row) return;
    if (call && call.id === row.id) {
      if (row.status === 'accepted' && call.role === 'caller') { stopRing(); ui.classList.remove('ringing'); setStatus('Соединяем…'); call.state = 'connecting'; clearTimeout(call.timeoutT); }
      else if (row.status === 'declined') endCall({ reason: 'Звонок отклонён', notify: false });
      else if ((row.status === 'ended' || row.status === 'missed') && call.state !== 'ended') endCall({ reason: 'Звонок завершён', notify: false });
    }
    if (incoming && incoming.row.id === row.id && row.status !== 'ringing') {
      dismissIncoming(row.status === 'missed' ? 'Пропущенный звонок' : undefined);
    }
  }
  async function checkPending() {
    const m = me(); if (!m || call || incoming) return;
    const { data } = await sbc().rpc('pending_calls');
    if (data && data[0]) onIncoming(data[0], 0);
  }
  function ensureRealtime() {
    const m = me();
    if (!m || !sbc()) {
      if (rtChan) { try { sbc().removeChannel(rtChan); } catch (_) {} rtChan = null; rtFor = null; }
      return;
    }
    if (rtFor === m.id) return;
    if (rtChan) { try { sbc().removeChannel(rtChan); } catch (_) {} }
    rtFor = m.id;
    rtChan = sbc().channel('golda-calls')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls' }, e => onIncoming(e.new, 0))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, e => onCallRow(e.new))
      .subscribe(s => { if (s === 'SUBSCRIBED') checkPending(); });
  }
  setInterval(ensureRealtime, 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkPending(); });
  setInterval(() => { if (document.visibilityState === 'visible') checkPending(); }, 3000);

  // ===== Кнопки звонка в шапке чата =====
  function injectHeaderButtons() {
    const dots = $q('#dotsBtn');
    if (!dots || $q('#callAudioBtn')) return;
    const mk = (id, title, svg, kind) => {
      const b = document.createElement('button');
      b.className = 'icon-btn hide'; b.id = id; b.title = title; b.type = 'button'; b.innerHTML = svg;
      b.onclick = () => startCall(kind);
      dots.parentNode.insertBefore(b, dots);
    };
    mk('callAudioBtn', 'Позвонить', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', 'audio');
    mk('callVideoBtn', 'Видеозвонок', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>', 'video');
  }
  function refreshHeaderButtons() {
    injectHeaderButtons();
    const a = $q('#callAudioBtn'), v = $q('#callVideoBtn'); if (!a || !v) return;
    let show = false;
    try {
      const chat = CURRENT && CHATS.find(c => c.id === CURRENT);
      const modOpen = typeof IMPERSONATE_USER !== 'undefined' && IMPERSONATE_USER;
      show = !!(me() && chat && chat.type === 'direct' && !me().is_banned && !modOpen && !(peerOf(chat).is_banned) && !BLOCKED.includes(peerOf(chat).id));
    } catch (_) {}
    a.classList.toggle('hide', !show); v.classList.toggle('hide', !show);
  }
  setInterval(refreshHeaderButtons, 600);

  // ===== Открытие из push (тап по уведомлению) =====
  async function openCallById(id) {
    if (!id || !me() || !sbc()) return;
    const { data } = await sbc().from('calls').select('*').eq('id', id).maybeSingle();
    if (!data) return;
    if (data.status === 'ringing') onIncoming(data, 0);
    else if (data.status === 'missed') say('Пропущенный звонок');
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data && e.data.type === 'open-call') { const go = () => me() ? openCallById(e.data.callId) : setTimeout(go, 700); go(); }
    });
  }
  const qs = new URLSearchParams(location.search);
  if (qs.get('call')) {
    const id = qs.get('call');
    const go = (n) => { if (me()) openCallById(id); else if (n < 20) setTimeout(() => go(n + 1), 700); };
    go(0);
    history.replaceState(null, '', location.pathname);
  }

  window.addEventListener('beforeunload', () => { if (call) { try { call.chan.send({ type: 'broadcast', event: 'sig', payload: { t: 'hangup' } }); } catch (_) {} } });
})();
