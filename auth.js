/* golda-mesenger: приветственный экран, заголовки, частицы для входа/регистрации */
(function () {
  'use strict';
  const Q = s => document.querySelector(s), authEl = Q('#authScreen'), setupEl = Q('#setupScreen');
  if (!authEl) return;

  // шрифт Nunito
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap'; document.head.appendChild(l);

  // частицы
  const pr = document.createElement('div'); pr.id = 'aParticles';
  for (let i = 0; i < 34; i++) {
    const e = document.createElement('i'), s = 6 + Math.random() * 22;
    e.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${(Math.random() * 60 - 30).toFixed(0)}px;animation-duration:${14 + Math.random() * 22}s;animation-delay:-${Math.random() * 30}s;opacity:${(.1 + Math.random() * .25).toFixed(2)}`;
    pr.appendChild(e);
  }
  document.body.appendChild(pr);

  // заголовки
  const card = authEl.querySelector('.auth-card'), form = Q('#authForm');
  const top = document.createElement('div'); top.className = 'a-top'; top.innerHTML = '<button type="button" id="aBack" aria-label="Назад">‹</button>';
  const hd = document.createElement('div'); hd.innerHTML = '<h1 class="a-title" id="aTitle">Вход</h1><p class="a-sub" id="aSub"></p>';
  card.insertBefore(hd, form); card.insertBefore(top, hd);
  const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'auth-alt'; alt.id = 'aAlt'; form.appendChild(alt);
  Q('#authEmail').placeholder = 'Почта'; Q('#authPass').placeholder = 'Пароль'; Q('#authUsername').placeholder = 'Имя пользователя';

  function texts(m) {
    Q('#aTitle').textContent = m === 'reg' ? 'Регистрация' : 'Вход';
    Q('#aSub').textContent = m === 'reg' ? 'Почта, юзернейм и пароль — и ты в golda' : 'Войди по почте и паролю';
    alt.textContent = m === 'reg' ? 'Уже есть аккаунт? Войти' : 'Регистрация';
    Q('#authSubmit').textContent = m === 'reg' ? 'Создать аккаунт' : 'Продолжить';
  }
  const orig = window.setMode;
  let cur = 'login';
  window.setMode = function (m) { cur = m; orig(m); texts(m); };
  alt.onclick = () => window.setMode(cur === 'reg' ? 'login' : 'reg');
  texts('login');

  // welcome
  const w = document.createElement('div'); w.id = 'welcome'; w.className = 'hidden';
  w.innerHTML = '<div class="w-logo"><div class="w-blob"></div><div class="w-ring"></div></div>' +
    '<div class="w-name"><b>golda</b>-mesenger</div><div class="w-sub">Общайся красиво</div>' +
    '<div class="w-btns"><button class="a-btn main" id="wReg" type="button">Создать аккаунт</button><button class="a-btn sec" id="wLogin" type="button">Войти</button></div>';
  document.body.appendChild(w);
  let shown = false;
  const hideW = m => { w.classList.add('out'); setTimeout(() => w.classList.add('hidden'), 350); window.setMode(m); };
  Q('#wReg').onclick = () => hideW('reg'); Q('#wLogin').onclick = () => hideW('login');
  Q('#aBack').onclick = () => { w.classList.remove('hidden'); void w.offsetWidth; w.classList.remove('out'); };

  function sync() {
    const authOn = !authEl.classList.contains('hidden'), setOn = setupEl && !setupEl.classList.contains('hidden');
    document.body.classList.toggle('auth-off', !(authOn || setOn));
    if (authOn && !shown) { shown = true; w.classList.remove('hidden', 'out'); }
    if (!authOn) { shown = false; w.classList.add('hidden'); }
  }
  new MutationObserver(sync).observe(authEl, { attributes: true, attributeFilter: ['class'] });
  if (setupEl) new MutationObserver(sync).observe(setupEl, { attributes: true, attributeFilter: ['class'] });
  sync();

  // «Последний шаг»
  if (setupEl) {
    const sc = setupEl.querySelector('.auth-card'), sf = Q('#setupForm');
    const h = document.createElement('div'); h.innerHTML = '<h1 class="a-title">Последний шаг</h1><p class="a-sub">Придумай юзернейм и имя — по ним тебя найдут</p>';
    sc.insertBefore(h, sf);
    const inps = sf.querySelectorAll('.inp'); if (inps[0]) inps[0].placeholder = 'Имя пользователя'; if (inps[1]) inps[1].placeholder = 'Имя';
  }
})();
