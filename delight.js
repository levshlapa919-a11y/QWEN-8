/* YZITK Chats: серии общения 🔥 и распаковка подарков */
(function () {
  'use strict';
  const G = f => { try { return f(); } catch (e) { return undefined; } };
  const LSg = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, LSs = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const css = document.createElement('style');
  css.textContent = `
.dl-st{display:inline-flex;align-items:center;gap:2px;margin-left:8px;padding:1px 8px 1px 6px;border-radius:99px;background:rgba(255,140,50,.16);color:#ffa15c;font:700 13px var(--font,inherit);vertical-align:middle}
.dl-st.dim{background:rgba(255,255,255,.07);color:var(--mut,#999)}
.dl-st svg{width:13px;height:13px;fill:currentColor}
.dl-wrap{position:relative;display:flex;align-items:center;gap:14px;padding:16px;min-width:230px;border-radius:18px;background:linear-gradient(140deg,#2b3560,#1a2040);cursor:pointer;overflow:hidden}
.dl-box{flex:none;width:58px;height:58px;position:relative;animation:dlBob 2.4s ease-in-out infinite}
.dl-box i{position:absolute;inset:14px 0 0;border-radius:8px;background:linear-gradient(#e0527a,#b52a55)}
.dl-box b{position:absolute;left:0;right:0;top:6px;height:14px;border-radius:6px;background:linear-gradient(#f06b92,#c93a64)}
.dl-box u{position:absolute;left:25px;top:6px;bottom:0;width:8px;background:#ffd36b}
.dl-t{font:700 15px var(--font,inherit);color:#fff}.dl-s{font:500 13px var(--font,inherit);color:rgba(255,255,255,.65);margin-top:2px}
.dl-open{animation:dlPop .6s cubic-bezier(.2,1.4,.4,1)}
.dl-wrap.go .dl-box{animation:dlShake .5s linear 1}
@keyframes dlBob{50%{transform:translateY(-4px) rotate(-3deg)}}
@keyframes dlShake{20%{transform:rotate(-12deg)}40%{transform:rotate(10deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(6deg)}}
@keyframes dlPop{0%{transform:scale(.7);opacity:0;filter:brightness(2.5)}100%{transform:none;opacity:1;filter:none}}`;
  document.head.appendChild(css);

  /* ---- серия ---- */
  const flame = '<svg viewBox="0 0 24 24"><path d="M13 3c1 4-3 5-3 9a3 3 0 0 0 6 0c0-2-1-3-1-4 3 1 5 4 5 7a7 7 0 0 1-14 0c0-6 5-7 7-12z"/></svg>';
  let lastChat = null;
  async function paintStreak() {
    const id = G(() => CURRENT); const t = document.getElementById('headTitle'); if (!t) return;
    let el = document.getElementById('dlStreak'); if (el) el.remove();
    const chat = G(() => CHATS.find(c => c.id === id)); if (!id || !chat || chat.type !== 'direct') return;
    const r = await sb.rpc('chat_streak', { p_chat: id }).then(x => x.data).catch(() => null);
    if (G(() => CURRENT) !== id || !r || !(r.streak >= 2 || (r.streak === 1 && false))) return;
    el = document.getElementById('dlStreak'); if (el) el.remove();
    el = document.createElement('span'); el.id = 'dlStreak'; el.className = 'dl-st' + (r.today ? '' : ' dim');
    el.title = r.today ? 'Серия общения' : 'Напишите сегодня, чтобы не потерять серию';
    el.innerHTML = flame + r.streak; t.insertAdjacentElement('afterend', el);
  }
  const wrapFn = (name, after) => { const f = window[name]; if (typeof f !== 'function' || f._dl) return; const w = function () { const r = f.apply(this, arguments); try { after(); } catch (e) { } return r; }; w._dl = 1; window[name] = w; };
  const hook = setInterval(() => {
    if (typeof window.renderChatHeader !== 'function') return; clearInterval(hook);
    wrapFn('renderChatHeader', () => { if (G(() => CURRENT) !== lastChat) { lastChat = G(() => CURRENT); } paintStreak(); });
  }, 500);
  /* после нового сообщения серия может вырасти */
  let tm = null; new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => { const cur = G(() => CURRENT); if (cur && document.getElementById('headTitle')) paintStreak(); }, 4000); }).observe(document.getElementById('messages') || document.body, { childList: true });

  /* ---- распаковка ---- */
  const key = id => 'dl_open_' + id;
  function wrapGift(el) {
    const ug = el._ug; if (!ug || el.dataset.dl) return; el.dataset.dl = '1';
    const me = G(() => ME.id);
    if (!me || ug.owner_id !== me || ug.from_id === me || LSg(key(ug.id))) return;
    if (Date.now() - Date.parse(ug.created_at) > 3 * 864e5) return;           // старые подарки не прячем
    const from = ug.anon ? 'Кто-то' : (G(() => PROFILES[ug.from_id].display_name) || 'Друг');
    const real = el.innerHTML;
    el.innerHTML = '<div class="dl-wrap"><div class="dl-box"><i></i><b></b><u></u></div><div><div class="dl-t">Вам подарок</div><div class="dl-s">От ' + from.replace(/[<>&]/g, '') + ' · нажмите, чтобы открыть</div></div></div>';
    el.dataset.wrapped = '1';
    el.addEventListener('click', function h(e) {
      if (el.dataset.wrapped !== '1') return;
      e.stopImmediatePropagation(); e.preventDefault();
      const w = el.querySelector('.dl-wrap'); w.classList.add('go'); el.dataset.wrapped = '0'; LSs(key(ug.id), '1');
      setTimeout(() => {
        el.innerHTML = real; el.firstElementChild && el.firstElementChild.classList.add('dl-open');
        const rar = G(() => ug.gifts.rarity);
        if (window.LIVE && window.LIVE.confetti) G(() => window.LIVE.confetti(rar === 'legendary' ? 160 : rar === 'epic' ? 90 : 40));
        try { navigator.vibrate && navigator.vibrate(rar === 'legendary' ? [30, 40, 60] : 25); } catch (x) { }
      }, 520);
    }, true);
  }
  const scan = () => document.querySelectorAll('.gift-msg').forEach(el => { if (el._ug) wrapGift(el); });
  let t2 = null; new MutationObserver(() => { clearTimeout(t2); t2 = setTimeout(scan, 120); }).observe(document.body, { childList: true, subtree: true });
})();
