// ===== push.js: push-уведомления через Supabase Edge Function =====
(function(){
  const PUSH_FN = SUPABASE_URL + '/functions/v1/hyper-service';
  let subReady = false;

  function b64ToUint8(s){
    const padding = '='.repeat((4 - s.length % 4) % 4);
    const b64 = (s + padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
    return out;
  }

  async function doSubscribe(){
    try{
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if(!sub){
        const r = await fetch(PUSH_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'keys'})});
        const { publicKey } = await r.json();
        sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64ToUint8(publicKey)});
      }
      const j = sub.toJSON();
      await sb.from('push_subscriptions').upsert({user_id:ME.id, endpoint:j.endpoint, subscription:j},{onConflict:'user_id'});
      subReady = true;
      console.log('push subscribed');
    }catch(e){ console.log('push subscribe error:', e); }
  }

  async function ensure(){
    if(subReady) return;
    if(typeof ME === 'undefined' || !ME) return;
    if(!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if(Notification.permission === 'granted'){ await doSubscribe(); return; }
    if(Notification.permission === 'default'){
      const ask = async ()=>{
        document.removeEventListener('pointerdown', ask, true);
        const p = await Notification.requestPermission();
        if(p === 'granted') await doSubscribe();
      };
      document.addEventListener('pointerdown', ask, true);
    }
  }
  setInterval(ensure, 2000);
  ensure();

  function queuePush(chatId, text){
    if(typeof ME === 'undefined' || !ME) return;
    const sender = (ME.display_name || ME.username || 'Кто-то');
    fetch(PUSH_FN,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send', chat_id:chatId, title:'💬 Новое сообщение', bodyText: sender + ': ' + text, exclude: ME.id})
    }).catch(()=>{});
  }

  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('#sendBtn');
    if(b){
      const t = document.getElementById('msgInput').value.trim();
      if(t && typeof CURRENT !== 'undefined' && CURRENT) setTimeout(()=>queuePush(CURRENT, t), 300);
    }
  }, true);

  document.addEventListener('keydown', e=>{
    if(e.key==='Enter' && !e.shiftKey && e.target && e.target.id==='msgInput'){
      const t = e.target.value.trim();
      if(t && typeof CURRENT !== 'undefined' && CURRENT) setTimeout(()=>queuePush(CURRENT, t), 300);
    }
  }, true);

  const att = document.getElementById('attachInput');
  if(att) att.addEventListener('change', ()=>{ if(typeof CURRENT !== 'undefined' && CURRENT) setTimeout(()=>queuePush(CURRENT, '📎 Фото или видео'), 4000); });
  const mic = document.getElementById('micBtn');
  if(mic) mic.addEventListener('pointerup', ()=>{ if(typeof CURRENT !== 'undefined' && CURRENT) setTimeout(()=>queuePush(CURRENT, '🎤 Голосовое сообщение'), 3000); });
})();
