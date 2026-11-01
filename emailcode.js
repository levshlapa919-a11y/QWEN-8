/* Регистрация с подтверждением почты кодом (Edge Function auth-code).
   Если почта не настроена или отправка не удалась — работает прежняя регистрация. */
(function(){
  var form=document.getElementById('authForm'); if(!form||typeof sb==='undefined')return;
  var skip=false, panel=null, pending=null;
  var ERR={bad_email:'Проверь адрес почты',bad_username:'Юзернейм: 3–20 символов, латиница/цифры/_',username_taken:'Этот юзернейм уже занят',email_taken:'Эта почта уже зарегистрирована',too_fast:'Подожди минуту перед повторной отправкой',too_many:'Слишком много писем, попробуй через час',bad_code:'Введи 6 цифр',wrong_code:'Неверный код',expired:'Код устарел — запроси новый',too_many_attempts:'Слишком много попыток — запроси новый код',no_code:'Сначала запроси код',weak_password:'Пароль минимум 6 символов',create_failed:'Не удалось создать аккаунт',profile_failed:'Не удалось создать профиль',server_error:'Ошибка сервера, попробуй позже'};
  var FALLBACK={mail_not_configured:1,mail_failed:1};
  function msg(t,ok){var el=document.getElementById('authMsg');if(el){el.textContent=t;el.classList.toggle('ok',!!ok);}}
  function call(body){return sb.functions.invoke('auth-code',{body:body}).then(function(r){
    if(r.data&&typeof r.data==='object')return r.data;
    return {ok:false,error:'net'};
  });}
  function showPanel(){
    Array.prototype.forEach.call(form.children,function(c){if(c.id!=='authMsg')c.dataset.ecHide=c.style.display||'',c.style.display='none';});
    panel=document.createElement('div');panel.id='ecPanel';
    panel.innerHTML='<label class="lbl">Код из письма</label><div style="font-size:13px;opacity:.7;margin-bottom:8px">Мы отправили 6 цифр на <b></b></div>'+
      '<input class="inp" id="ecCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" style="text-align:center;font-size:26px;letter-spacing:8px">'+
      '<button class="btn primary" id="ecOk" type="button">Подтвердить</button>'+
      '<button class="btn" id="ecResend" type="button" style="margin-top:8px">Отправить код ещё раз</button>'+
      '<button class="btn" id="ecBack" type="button" style="margin-top:8px">Назад</button>';
    panel.querySelector('b').textContent=pending.email;
    form.insertBefore(panel,document.getElementById('authMsg'));
    var inp=panel.querySelector('#ecCode');inp.focus();
    inp.addEventListener('input',function(){inp.value=inp.value.replace(/\D/g,'').slice(0,6);if(inp.value.length===6)verify();});
    panel.querySelector('#ecOk').onclick=verify;
    panel.querySelector('#ecBack').onclick=hidePanel;
    panel.querySelector('#ecResend').onclick=function(){send(true);};
  }
  function hidePanel(){
    if(panel){panel.remove();panel=null;}
    Array.prototype.forEach.call(form.children,function(c){if('ecHide' in c.dataset){c.style.display=c.dataset.ecHide;delete c.dataset.ecHide;}});
    msg('');
  }
  function send(again){
    msg('Отправляю код…',true);
    return call({action:'send',email:pending.email,username:pending.username,display_name:pending.username}).then(function(r){
      if(r.ok){if(!again)showPanel();msg('Код отправлен на почту ✔ (проверь «Спам»)',true);return;}
      if(FALLBACK[r.error]||r.error==='net'){ if(again){msg('Не удалось отправить письмо, попробуй позже');return;} skip=true;msg('');form.requestSubmit();return;}
      msg(ERR[r.error]||'Ошибка: '+r.error);
    });
  }
  function verify(){
    var code=panel.querySelector('#ecCode').value;
    if(code.length!==6){msg(ERR.bad_code);return;}
    msg('Проверяю…',true);
    call({action:'verify',email:pending.email,code:code,password:pending.password}).then(function(r){
      if(!r.ok){msg(ERR[r.error]||'Ошибка: '+r.error);return;}
      return sb.auth.signInWithPassword({email:pending.email,password:pending.password}).then(function(x){
        if(x.error){msg('Аккаунт создан, войди с почтой и паролем ✔',true);hidePanel();if(typeof setMode==='function')setMode('login');return;}
        return enterApp();
      });
    }).catch(function(e){msg('Ошибка: '+(e&&e.message||e));});
  }
  form.addEventListener('submit',function(e){
    if(typeof mode==='undefined'||mode!=='reg')return;
    if(skip){skip=false;return;}
    if(panel)return e.preventDefault(),e.stopImmediatePropagation();
    e.preventDefault();e.stopImmediatePropagation();
    var email=document.getElementById('authEmail').value.trim().toLowerCase();
    var uname=(document.getElementById('authUsername').value||'').trim().toLowerCase().replace(/^@/,'');
    var pass=document.getElementById('authPass').value;
    if(!/^[a-z0-9_]{3,20}$/.test(uname)){msg(ERR.bad_username);return;}
    if(pass.length<6){msg(ERR.weak_password);return;}
    pending={email:email,username:uname,password:pass};
    var b=document.getElementById('authSubmit');b.disabled=true;
    send(false).then(function(){b.disabled=false;},function(){b.disabled=false;msg('Ошибка сети');});
  },true);
})();
