/* Адрес API с автоматическим обходом блокировки.
   Сначала пробуем напрямую (supabase.co). Если не достучались — переключаемся на прокси (Cloudflare Worker) и запоминаем. */
(function () {
  var DIRECT = 'https://zuxvcqdttptahwinlnpz.supabase.co';
  var PROXY = 'https://golda-api.levshlapa919.workers.dev';
  var K = 'golda_api_proxy';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function once() { try { if (sessionStorage.getItem('golda_api_rl')) return false; sessionStorage.setItem('golda_api_rl', '1'); return true; } catch (e) { return false; } }
  function probe(base) {
    return new Promise(function (res) {
      var c = typeof AbortController === 'function' ? new AbortController() : null;
      var t = setTimeout(function () { if (c) c.abort(); res(false); }, 5000);
      fetch(base + '/auth/v1/health', { mode: 'no-cors', cache: 'no-store', signal: c ? c.signal : undefined })
        .then(function () { clearTimeout(t); res(true); }, function () { clearTimeout(t); res(false); });
    });
  }
  var on = get(K) === '1';
  window.GOLDA_API = on ? PROXY : '';
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!on) {
        probe(DIRECT).then(function (ok) { if (!ok && once()) { probe(PROXY).then(function (ok2) { if (ok2) { set(K, '1'); location.reload(); } }); } });
      } else {
        probe(PROXY).then(function (ok) { if (!ok) { probe(DIRECT).then(function (ok2) { if (ok2 && once()) { set(K, null); location.reload(); } }); } });
      }
    }, 1500);
  });
})();
