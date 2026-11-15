/* YZITK Chats: голосовые комнаты до 4 человек и совместный просмотр видео */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tst = (m, k) => { try { toast(m, k || ''); } catch (e) { } };
  const MAX = 4;
  const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }] };

  /* ---------- карточка комнаты в чате ---------- */
  const _pm = window.parseMedia, _mh = window.mediaHTML, _pv = window.previewOf;
  window.parseMedia = function (c) { const m = String(c == null ? '' : c).match(/^\[\[room\|([0-9a-f-]{36})\]\]/); return m ? { kind: 'room', id: m[1], cap: '' } : _pm(c); };
  window.mediaHTML = function (md) { return md && md.kind === 'room' ? `<div class="rm-card" data-room="${E(md.id)}"><div class="rm-i">🎙</div><div><div class="rm-t">Голосовая комната</div><div class="rm-s">Нажмите, чтобы зайти</div></div></div>` : _mh(md); };
  window.previewOf = function (lm, chat) { const md = window.parseMedia(lm.content); return md && md.kind === 'room' ? (lm.sender_id === G(() => ME.id) ? 'Вы: ' : '') + '🎙 Голосовая комната' : _pv(lm, chat); };

  const css = document.createElement('style');
  css.textContent = `
.rm-card{display:flex;gap:12px;align-items:center;min-width:230px;padding:12px 14px;border-radius:16px;background:linear-gradient(140deg,#1f6f5c,#17404a);cursor:pointer;color:#fff}
.rm-i{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:20px}
.rm-t{font:700 15px var(--font,inherit)}.rm-s{font:500 13px var(--font,inherit);opacity:.7;margin-top:2px}
#rmUI{position:fixed;inset:0;z-index:9000;background:var(--bg,#0e1116);color:var(--tx,#fff);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px calc(env(safe-area-inset-bottom,0px) + 14px)}
#rmUI .rm-top{display:flex;align-items:center;justify-content:space-between;padding:6px 2px 10px}
#rmUI .rm-h{font:700 18px var(--font,inherit)}#rmUI .rm-n{font:500 13px var(--font,inherit);color:var(--mut,#999)}
.rm-vid{position:relative;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:16/9;margin-bottom:12px}
.rm-vid video,.rm-vid iframe,.rm-vid #rmYT{position:absolute;inset:0;width:100%;height:100%;border:0}
.rm-grid{flex:1;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;align-content:center;justify-items:center;overflow:auto}
.rm-p{display:flex;flex-direction:column;align-items:center;gap:8px;font:600 14px var(--font,inherit);max-width:100%}
.rm-av{width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:var(--p2,#222);font:700 32px var(--font,inherit);transition:box-shadow .15s}
.rm-av.on{box-shadow:0 0 0 4px var(--ac,#7aa2ff)}.rm-av img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.rm-bar{display:flex;gap:10px;justify-content:center;padding-top:10px}
.rm-b{border:0;border-radius:99px;padding:14px 20px;background:var(--p1,#1b1f27);color:var(--tx,#fff);font:700 15px var(--font,inherit);cursor:pointer}
.rm-b.red{background:#e5484d;color:#fff}.rm-b.off{background:#fff;color:#000}`;
  document.head.appendChild(css);

  /* ---------- сама комната ---------- */
  let R = null;     // { chat, ch, peers:{id:{pc,audio,cand[]}}, stream, ui, muted, vid }
  const meId = () => G(() => ME.id), meName = () => G(() => ME.display_name || ME.username) || 'Я';
  const send = p => { try { R.ch.send({ type: 'broadcast', event: 'sig', payload: Object.assign({ from: meId() }, p) }); } catch (e) { } };

  function mk(id) {
    const pc = new RTCPeerConnection(ICE), peer = { pc, cand: [] };
    const aud = new Audio(); aud.autoplay = true; aud.playsInline = true; peer.audio = aud;
    R.stream.getTracks().forEach(t => pc.addTrack(t, R.stream));
    pc.onicecandidate = e => { if (e.candidate) send({ to: id, t: 'ice', c: e.candidate }); };
    pc.ontrack = e => { aud.srcObject = e.streams[0]; aud.play().catch(() => { }); watch(id, e.streams[0]); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) drop(id); };
    R.peers[id] = peer; return peer;
  }
  function drop(id) { const p = R && R.peers[id]; if (!p) return; try { p.pc.close(); } catch (e) { } try { p.audio.srcObject = null; } catch (e) { } delete R.peers[id]; paint(); }
  function watch(id, stream) {   // индикатор «говорит»
    try {
      const ac = R.ac || (R.ac = new (window.AudioContext || window.webkitAudioContext)()), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 256; src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount); R.lv[id] = () => { an.getByteFrequencyData(buf); let s = 0; for (const v of buf) s += v; return s / buf.length > 14; };
    } catch (e) { }
  }
  async function onSig(m) {
    if (!R || m.from === meId() || (m.to && m.to !== meId())) return;
    const id = m.from;
    if (m.t === 'hello') { return; }                              // новичок сам позвонит нам
    if (m.t === 'offer') {
      if (Object.keys(R.peers).length >= MAX - 1 && !R.peers[id]) return;
      const p = R.peers[id] || mk(id);
      await p.pc.setRemoteDescription(m.sdp); p.cand.splice(0).forEach(c => p.pc.addIceCandidate(c).catch(() => { }));
      const a = await p.pc.createAnswer(); await p.pc.setLocalDescription(a); send({ to: id, t: 'answer', sdp: p.pc.localDescription });
    } else if (m.t === 'answer') { const p = R.peers[id]; if (p) { await p.pc.setRemoteDescription(m.sdp); p.cand.splice(0).forEach(c => p.pc.addIceCandidate(c).catch(() => { })); } }
    else if (m.t === 'ice') { const p = R.peers[id]; if (!p) return; if (p.pc.remoteDescription) p.pc.addIceCandidate(m.c).catch(() => { }); else p.cand.push(m.c); }
    else if (m.t === 'vid') { showVideo(m.v, false); }
    else if (m.t === 'ctl') { ctl(m); }
    else if (m.t === 'ask' && R.vid) { send({ to: id, t: 'vid', v: Object.assign({}, R.vid, { at: curTime(), playing: isPlaying() }) }); }
  }
  async function callPeer(id) {
    if (R.peers[id]) return; const p = mk(id);
    const o = await p.pc.createOffer(); await p.pc.setLocalDescription(o); send({ to: id, t: 'offer', sdp: p.pc.localDescription });
  }

  async function join(chatId) {
    if (R) return tst('Вы уже в комнате');
    const chat = G(() => CHATS.find(c => c.id === chatId)); if (!chat) return tst('Чат не найден', 'red');
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { return tst('Нет доступа к микрофону. Разрешите в настройках.', 'red'); }
    R = { chat, peers: {}, stream, muted: false, lv: {}, names: {}, vid: null };
    R.ch = sb.channel('room-' + chatId, { config: { broadcast: { self: false }, presence: { key: meId() } } });
    R.ch.on('broadcast', { event: 'sig' }, ({ payload }) => onSig(payload));
    R.ch.on('presence', { event: 'sync' }, () => {
      const st = R.ch.presenceState(); R.names = {}; R.ts = R.ts || {}; Object.keys(st).forEach(k => { R.names[k] = (st[k][0] || {}).name || 'Участник'; R.ts[k] = (st[k][0] || {}).ts || 0; });
      /* звонит тот, кто зашёл позже; так пара соединяется ровно один раз */
      Object.keys(R.names).forEach(k => { if (k !== meId() && !R.peers[k] && R.joined && (R.ts[meId()] > R.ts[k] || (R.ts[meId()] === R.ts[k] && meId() > k))) callPeer(k).catch(() => { }); });
      Object.keys(R.peers).forEach(id => { if (!R.names[id]) drop(id); }); paint();
    });
    R.ch.on('presence', { event: 'join' }, ({ key }) => { /* звонит всегда новичок */ });
    await new Promise(res => R.ch.subscribe(async s => {
      if (s !== 'SUBSCRIBED') return;
      const cur = Object.keys(R.ch.presenceState()).filter(k => k !== meId());
      if (cur.length >= MAX) { tst('В комнате уже ' + MAX + ' человека', 'red'); res(); return leave(true); }
      R.joined = true; await R.ch.track({ name: meName(), ts: Date.now() }); res();
      send({ t: 'ask' });
    }));
    if (R) ui();
  }
  function leave(quiet) {
    if (!R) return; const r = R; R = null;
    try { Object.keys(r.peers).forEach(id => { r.peers[id].pc.close(); }); } catch (e) { }
    try { r.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
    try { r.ch.untrack(); sb.removeChannel(r.ch); } catch (e) { }
    try { r.ac && r.ac.close(); } catch (e) { }
    clearInterval(r.tick); if (r.ui) r.ui.remove(); if (r.yt && r.yt.destroy) try { r.yt.destroy(); } catch (e) { }
  }

  /* ---------- интерфейс ---------- */
  function ui() {
    const o = document.createElement('div'); o.id = 'rmUI';
    o.innerHTML = `<div class="rm-top"><div><div class="rm-h">${E(G(() => titleOf(R.chat)) || 'Комната')}</div><div class="rm-n" id="rmN"></div></div></div><div id="rmV"></div><div class="rm-grid" id="rmG"></div>
      <div class="rm-bar"><button class="rm-b" id="rmM">Микрофон</button><button class="rm-b" id="rmW">Смотреть вместе</button><button class="rm-b red" id="rmL">Выйти</button></div>`;
    document.body.appendChild(o); R.ui = o;
    o.querySelector('#rmL').onclick = () => leave();
    o.querySelector('#rmM').onclick = e => { R.muted = !R.muted; R.stream.getAudioTracks().forEach(t => t.enabled = !R.muted); e.target.classList.toggle('off', R.muted); e.target.textContent = R.muted ? 'Микрофон выключен' : 'Микрофон'; };
    o.querySelector('#rmW').onclick = () => { const u = prompt('Ссылка на видео (YouTube или прямая ссылка на mp4/webm)'); if (!u) return; const v = parseVid(u.trim()); if (!v) return tst('Не получилось распознать ссылку', 'red'); showVideo(v, true); send({ t: 'vid', v }); };
    R.tick = setInterval(paint, 300); paint();
  }
  function paint() {
    if (!R || !R.ui) return; const g = R.ui.querySelector('#rmG'); const ids = Object.keys(R.names).length ? Object.keys(R.names) : [meId()];
    R.ui.querySelector('#rmN').textContent = ids.length + ' из ' + MAX + ' · говорите, вас слышат';
    g.innerHTML = ids.map(id => { const nm = id === meId() ? meName() : R.names[id]; const u = G(() => PROFILES[id]) || {};
      const on = id === meId() ? (!R.muted && R.lv.me && R.lv.me()) : (R.lv[id] && R.lv[id]());
      const av = u.avatar_url ? `<img src="${E(u.avatar_url)}" alt="">` : E((nm || '?')[0].toUpperCase());
      return `<div class="rm-p"><div class="rm-av${on ? ' on' : ''}">${av}</div>${E(nm)}${id === meId() ? ' (вы)' : ''}</div>`; }).join('');
    if (!R.lv.me && R.stream) watch('me', new MediaStream(R.stream.getAudioTracks()));
  }

  /* ---------- совместный просмотр ---------- */
  function parseVid(u) {
    let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/); if (m) return { k: 'yt', id: m[1] };
    if (/^https:\/\/\S+\.(mp4|webm|m4v|mov)(\?\S*)?$/i.test(u)) return { k: 'mp4', url: u };
    return null;
  }
  let ytLoading = null;
  function ytApi() { if (window.YT && YT.Player) return Promise.resolve(); if (ytLoading) return ytLoading; return ytLoading = new Promise(res => { const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; window.onYouTubeIframeAPIReady = res; document.head.appendChild(s); setTimeout(res, 8000); }); }
  const curTime = () => G(() => R.vid.k === 'yt' ? R.yt.getCurrentTime() : R.vel.currentTime) || 0;
  const isPlaying = () => G(() => R.vid.k === 'yt' ? R.yt.getPlayerState() === 1 : !R.vel.paused) || false;
  let applying = false;
  async function showVideo(v, mine) {
    if (!R) return; const box = R.ui.querySelector('#rmV'); R.vid = v; R.yt && G(() => R.yt.destroy()); R.yt = null; R.vel = null;
    box.innerHTML = '<div class="rm-vid"><div id="rmYT"></div></div>';
    if (v.k === 'mp4') {
      const el = document.createElement('video'); el.src = v.url; el.controls = true; el.playsInline = true; box.querySelector('.rm-vid').replaceChildren(el); R.vel = el;
      el.onplay = () => !applying && send({ t: 'ctl', a: 'play', at: el.currentTime }); el.onpause = () => !applying && send({ t: 'ctl', a: 'pause', at: el.currentTime }); el.onseeked = () => !applying && send({ t: 'ctl', a: 'seek', at: el.currentTime });
      if (v.at) el.currentTime = v.at; if (v.playing) el.play().catch(() => { });
    } else {
      await ytApi(); if (!window.YT || !YT.Player || !R) return tst('YouTube недоступен', 'red');
      R.yt = new YT.Player('rmYT', { videoId: v.id, width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0 }, events: {
        onReady: () => { if (v.at) R.yt.seekTo(v.at, true); if (v.playing) R.yt.playVideo(); },
        onStateChange: e => { if (applying) return; if (e.data === 1) send({ t: 'ctl', a: 'play', at: R.yt.getCurrentTime() }); else if (e.data === 2) send({ t: 'ctl', a: 'pause', at: R.yt.getCurrentTime() }); } } });
    }
    if (mine) tst('Все в комнате видят ваше видео');
  }
  function ctl(m) {
    if (!R || !R.vid) return; applying = true;
    try {
      if (R.vid.k === 'yt' && R.yt && R.yt.seekTo) { if (Math.abs(R.yt.getCurrentTime() - m.at) > 1.5) R.yt.seekTo(m.at, true); m.a === 'play' ? R.yt.playVideo() : m.a === 'pause' ? R.yt.pauseVideo() : 0; }
      else if (R.vel) { if (Math.abs(R.vel.currentTime - m.at) > 1.5) R.vel.currentTime = m.at; m.a === 'play' ? R.vel.play().catch(() => { }) : m.a === 'pause' ? R.vel.pause() : 0; }
    } catch (e) { }
    setTimeout(() => applying = false, 700);
  }

  /* ---------- вход: карточка в чате и пункт меню ---------- */
  document.addEventListener('click', e => { const c = e.target.closest('.rm-card'); if (c) join(c.dataset.room); });
  async function open() {
    const id = G(() => CURRENT); if (!id) return; if (R) return tst('Вы уже в комнате');
    const ok = window.V3 && V3.sendContent ? await V3.sendContent('[[room|' + id + ']]') : null;
    if (ok === false) return tst('Не удалось создать комнату', 'red');
    join(id);
  }
  const f = window.renderChatHeader;
  if (typeof f === 'function' && !f._rm) {
    const w = function () { const r = f.apply(this, arguments); try { const m = document.getElementById('chatMenu'); if (m && !m.querySelector('[data-act=room]')) { const b = document.createElement('button'); b.className = 'menu-i'; b.dataset.act = 'room'; b.textContent = '🎙 Голосовая комната'; m.insertBefore(b, m.firstChild); } } catch (e) { } return r; };
    w._rm = 1; window.renderChatHeader = w;
  }
  document.addEventListener('click', e => { const b = e.target.closest('#chatMenu [data-act=room]'); if (!b) return; e.stopPropagation(); const m = document.getElementById('chatMenu'); m && m.classList.remove('open'); open(); }, true);
  window.GoldaRoom = { join, leave, open, _s: () => R && Object.keys(R.peers).map(k => R.peers[k].pc.connectionState + '/' + (R.peers[k].audio.srcObject ? 'track' : 'notrack')) };
})();
