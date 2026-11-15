/* YZITK Chats: вход и регистрация по коду из письма */
(function () {
  'use strict';
  const Q = s => document.querySelector(s);
  const form = Q('#authForm'); if (!form || typeof sb === 'undefined') return;
  const ru = m => /rate limit|too many|seconds|after/i.test(m || '') ? 'Слишком часто. Подожди минуту и попробуй снова.'
    : /invalid.*email|valid email/i.test(m || '') ? 'Проверь адрес почты'
    : /expired|invalid|token/i.test(m || '') ? 'Код неверный или устарел. Запроси новый.'
    : /signups? not allowed|disabled/i.test(m || '') ? 'Вход по коду отключён на сервере' : (m || 'Ошибка');
  const a = document.createElement('button'); a.type = 'button'; a.id = 'aOtp'; a.textContent = 'Войти или зарегистрироваться по коду';
  a.style.cssText = 'background:none;border:0;color:var(--ac,#7aa2ff);font:inherit;font-size:14px;padding:10px 0 2px;cursor:pointer;display:block;margin:0 auto';
  const anchor = Q('#aForgot') || Q('#authSubmit'); anchor.parentNode.insertBefore(a, anchor.nextSibling);

  const field = 'width:100%;box-sizing:border-box;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:var(--p2,#20242d);color:inherit;font:inherit;font-size:16px;margin-top:10px';
  const bt = 'width:100%;padding:13px;border-radius:12px;border:0;background:var(--ac,#7aa2ff);color:var(--on-ac,#000);font:inherit;font-weight:700;font-size:16px;margin-top:14px';
  const ghost = 'background:none;border:0;color:var(--ac,#7aa2ff);font:inherit;font-size:14px;padding:10px 0 0;cursor:pointer';

  a.onclick = () => {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px';
    o.innerHTML = '<div style="width:100%;max-width:380px;background:var(--p1,#171a21);color:var(--tx,#fff);border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
      + '<div style="font-size:20px;font-weight:700">Вход по коду</div>'
      + '<div id="otD" style="opacity:.7;margin-top:6px;font-size:14px">Укажи почту, пришлём код. Если аккаунта ещё нет, он создастся.</div>'
      + '<input id="otE" type="email" autocomplete="email" placeholder="you@mail.com" style="' + field + '">'
      + '<input id="otC" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Код из письма" style="' + field + ';display:none;letter-spacing:4px;text-align:center;font-size:22px">'
      + '<div id="otM" style="min-height:18px;font-size:13px;margin-top:8px;color:#ff7a7a"></div>'
      + '<button id="otGo" type="button" style="' + bt + '">Получить код</button>'
      + '<div style="display:flex;justify-content:space-between"><button id="otBack" type="button" style="' + ghost + ';display:none">Другая почта</button><button id="otX" type="button" style="' + ghost + ';margin-left:auto;color:var(--mut,#9aa)">Закрыть</button></div></div>';
    document.body.appendChild(o);
    const $ = s => o.querySelector(s), E = $('#otE'), C = $('#otC'), M = $('#otM'), B = $('#otGo');
    let step = 1, left = 0, tm = null;
    E.value = (Q('#authEmail').value || '').trim();
    const say = (t, ok) => { M.style.color = ok ? '#6fd98a' : '#ff7a7a'; M.textContent = t || ''; };
    const tick = () => { if (step !== 2) return; if (left > 0) { B.disabled = false; B.textContent = 'Войти'; $('#otRe').textContent = 'Выслать код снова через ' + left + ' с'; $('#otRe').disabled = true; left--; tm = setTimeout(tick, 1000); } else { $('#otRe').textContent = 'Выслать код снова'; $('#otRe').disabled = false; } };
    const send = async () => {
      const em = E.value.trim(); if (!/^\S+@\S+\.\S+$/.test(em)) return say('Введи почту полностью');
      B.disabled = true; B.textContent = 'Отправляю…'; say('');
      try {
        const { error } = await sb.auth.signInWithOtp({ email: em, options: { shouldCreateUser: true } });
        if (error) throw error;
        step = 2; E.style.display = 'none'; C.style.display = ''; C.value = ''; C.focus(); $('#otBack').style.display = '';
        $('#otD').textContent = 'Код отправили на ' + em + '. Проверь и «Спам».';
        if (!$('#otRe')) { const r = document.createElement('button'); r.id = 'otRe'; r.type = 'button'; r.style.cssText = ghost + ';display:block;margin:6px auto 0'; r.onclick = () => { send(); }; B.insertAdjacentElement('afterend', r); }
        left = 45; clearTimeout(tm); tick(); B.textContent = 'Войти'; B.disabled = false;
      } catch (e) { say(ru(e.message)); B.disabled = false; B.textContent = step === 1 ? 'Получить код' : 'Войти'; }
    };
    const check = async () => {
      const code = C.value.replace(/\D/g, ''); if (code.length < 6) return say('Введи код из письма');
      B.disabled = true; B.textContent = 'Проверяю…'; say('');
      try {
        const { error } = await sb.auth.verifyOtp({ email: E.value.trim(), token: code, type: 'email' });
        if (error) throw error;
        clearTimeout(tm); o.remove(); await enterApp();
      } catch (e) { say(ru(e.message)); B.disabled = false; B.textContent = 'Войти'; }
    };
    B.onclick = () => step === 1 ? send() : check();
    C.oninput = () => { C.value = C.value.replace(/\D/g, ''); };
    E.onkeydown = ev => { if (ev.key === 'Enter') send(); }; C.onkeydown = ev => { if (ev.key === 'Enter') check(); };
    $('#otBack').onclick = () => { step = 1; clearTimeout(tm); C.style.display = 'none'; E.style.display = ''; $('#otBack').style.display = 'none'; B.textContent = 'Получить код'; B.disabled = false; if ($('#otRe')) $('#otRe').remove(); $('#otD').textContent = 'Укажи почту, пришлём код. Если аккаунта ещё нет, он создастся.'; say(''); };
    $('#otX').onclick = () => { clearTimeout(tm); o.remove(); };
    setTimeout(() => (E.value ? E : E).focus(), 50);
  };
})();
