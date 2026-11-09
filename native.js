/* Мост с приложением: уведомления о новых сообщениях в фоне */
(function () {
  'use strict';
  if (!window.GoldaNative) return;
  let t = 0;
  const muted = () => { try { return (JSON.parse(localStorage.getItem('golda_muted') || '[]') || []).join(','); } catch (e) { return ''; } };
  async function sync() {
    try {
      if (typeof ME === 'undefined' || !ME || !window.sb) return;
      GoldaNative.muted(muted());
      if (GoldaNative.token() && GoldaNative.uid() === ME.id) { GoldaNative.setup(SUPABASE_URL, SUPABASE_ANON_KEY, GoldaNative.token(), ME.id); return; }
      const r = await sb.rpc('notif_register');
      if (r.data) GoldaNative.setup(SUPABASE_URL, SUPABASE_ANON_KEY, r.data, ME.id);
    } catch (e) { }
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#btnLogout,#bsLogoutReal')) { try { const k = GoldaNative.token(); if (k && window.sb) sb.rpc('notif_unregister', { p_token: k }); GoldaNative.logout(); } catch (er) { } }
  }, true);
  setInterval(sync, 20000); setTimeout(sync, 4000);
})();
