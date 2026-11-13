/* Восстановление пароля: «Забыли пароль?» → письмо со ссылкой → ввод нового пароля */
(function () {
  'use strict';
  const Q = s => document.querySelector(s), SITE = 'https://levshlapa919-a11y.github.io/QWEN-8/';
  const form = Q('#authForm'); if (!form || typeof sb === 'undefined') return;
  const tst = (m, k) => { try { toast(m, k); } catch (e) { } };
  const ru = m => /rate limit|too many|seconds/i.test(m || '') ? 'Слишком часто. Подожди минуту и попробуй снова.' : /invalid.*email|valid email/i.test(m || '') ? 'Проверь адрес почты' : (m || 'Ошибка');

  const a = document.createElement('button'); a.type = 'button'; a.id = 'aForgot'; a.textContent = 'Забыли пароль?';
  a.style.cssText = 'background:none;border:0;color:var(--ac,#7aa2ff);font:inherit;font-size:14px;padding:10px 0 2px;cursor:pointer;display:block;margin:0 auto';
  const btn = Q('#authSubmit'); btn.parentNode.insertBefore(a, btn.nextSibling);
  const sync = () => { const reg = !Q('#unameWrap').classList.contains('hidden'); a.style.display = reg ? 'none' : 'block'; };
  new MutationObserver(sync).observe(Q('#unameWrap'), { attributes: true, attributeFilter: ['class'] }); sync();

  function sheet(html) {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px';
    o.innerHTML = '<div style="width:100%;max-width:380px;background:var(--p1,#171a21);color:var(--tx,#fff);border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.5)">' + html + '</div>';
    document.body.appendChild(o); return o;
  }
  const field = 'width:100%;box-sizing:border-box;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:var(--p2,#20242d);color:inherit;font:inherit;font-size:16px;margin-top:10px';
  const bt = 'width:100%;padding:13px;border-radius:12px;border:0;background:var(--ac,#7aa2ff);color:var(--on-ac,#000);font:inherit;font-weight:700;font-size:16px;margin-top:14px';

  a.onclick = () => {
    const o = sheet('<div style="font-size:20px;font-weight:700">Восстановление пароля</div><div style="opacity:.7;margin-top:6px;font-size:14px">Укажи почту аккаунта — пришлём ссылку для нового пароля.</div><input id="rsE" type="email" autocomplete="email" placeholder="Почта" style="' + field + '"><button id="rsGo" style="' + bt + '">Отправить ссылку</button><button id="rsX" style="width:100%;margin-top:8px;padding:10px;background:none;border:0;color:inherit;opacity:.7;font:inherit">Отмена</button><div id="rsM" style="margin-top:8px;font-size:14px;min-height:18px"></div>');
    const E = o.querySelector('#rsE'); E.value = (Q('#authEmail').value || '').trim();
    o.querySelector('#rsX').onclick = () => o.remove();
    o.querySelector('#rsGo').onclick = async () => {
      const em = E.value.trim(), m = o.querySelector('#rsM'), b = o.querySelector('#rsGo');
      if (!/^\S+@\S+\.\S+$/.test(em)) { m.textContent = 'Введи почту полностью'; return; }
      b.disabled = true; b.textContent = 'Отправляю…';
      try {
        const { error } = await sb.auth.resetPasswordForEmail(em, { redirectTo: SITE });
        if (error) throw error;
        m.style.color = '#6fd98a'; m.textContent = 'Готово. Если такой аккаунт есть, письмо уже в пути. Проверь и «Спам».'; b.textContent = 'Отправлено';
      } catch (e) { m.style.color = '#ff7a7a'; m.textContent = ru(e.message); b.disabled = false; b.textContent = 'Отправить ссылку'; }
    };
  };

  function newPass() {
    if (document.getElementById('rsNew')) return;
    const o = sheet('<div id="rsNew" style="font-size:20px;font-weight:700">Новый пароль</div><input id="rsP1" type="password" autocomplete="new-password" placeholder="Новый пароль (мин. 6)" style="' + field + '"><input id="rsP2" type="password" autocomplete="new-password" placeholder="Повтори пароль" style="' + field + '"><button id="rsSave" style="' + bt + '">Сохранить</button><div id="rsM" style="margin-top:8px;font-size:14px;min-height:18px;color:#ff7a7a"></div>');
    o.querySelector('#rsSave').onclick = async () => {
      const p1 = o.querySelector('#rsP1').value, p2 = o.querySelector('#rsP2').value, m = o.querySelector('#rsM');
      if (p1.length < 6) { m.textContent = 'Минимум 6 символов'; return; }
      if (p1 !== p2) { m.textContent = 'Пароли не совпадают'; return; }
      const { error } = await sb.auth.updateUser({ password: p1 });
      if (error) { m.textContent = ru(error.message); return; }
      o.remove(); tst('Пароль изменён'); try { history.replaceState(null, '', location.pathname); } catch (e) { }
    };
  }
  try { sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') setTimeout(newPass, 300); }); } catch (e) { }
  if (/type=recovery/.test(location.hash)) setTimeout(newPass, 1500);
})();
