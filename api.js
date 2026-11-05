/* Адрес API с автоматическим обходом блокировки.
   Сначала пробуем напрямую (supabase.co). Если не достучались — пробуем прокси по очереди и запоминаем рабочий. */
(function () {
  var DIRECT = 'https://zuxvcqdttptahwinlnpz.supabase.co';
  var PROXIES = ['https://d5dgkfm514j6f8gd2fsi.g2n58e0c.apigw.yandexcloud.net', 'https://qwen-8-na41ghp7kcc8.levshlapa919-a11y.deno.net', 'https://golda-api.levshlapa919.workers.dev'];
  var K = 'golda_api_proxy';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function once() { try { if (sessionStorage.getItem('golda_api_rl')) return false; sessionStorage.setItem('golda_api_rl', '1'); return true; } catch (e) { return false; } }
  function probe(base) {
    return new Promise(function (res) {
      var c = typeof AbortController === 'function' ? new AbortController() : null;
      var t = setTimeout(function () { if (c) c.abort(); res(false); }, 5000);
      fetch(base + '/auth/v1/settings', { cache: 'no-store', headers: { apikey: 'sb_publishable_crUm-uK9Hs0o_xgD5eVdyg_TaOgO3lH', 'x-client-info': 'probe' }, signal: c ? c.signal : undefined })
        .then(function (r) { clearTimeout(t); res(r.status < 500); }, function () { clearTimeout(t); res(false); });
    });
  }
  function firstOk(list) { return list.reduce(function (p, b) { return p.then(function (r) { return r ? r : probe(b).then(function (ok) { return ok ? b : null; }); }); }, Promise.resolve(null)); }
  try { var q = location.search.match(/[?&]proxy=(\w+)/); if (q) { if (q[1] === 'off') { set(K, null); set('golda_api_force', null); } else if (q[1] === 'yandex') { set(K, PROXIES[0]); set('golda_api_force', '1'); } else if (q[1] === 'deno') { set(K, PROXIES[1]); set('golda_api_force', '1'); } history.replaceState(null, '', location.pathname + location.hash); } } catch (e) {}

  try {
    if (/[?&]diag=1/.test(location.search)) {
      var KEY = (document.documentElement.getAttribute('data-k') || '');
      window.addEventListener('load', function () {
        var d = document.createElement('pre');
        d.style.cssText = 'position:fixed;inset:0;z-index:999999;margin:0;padding:16px;background:#000;color:#0f0;font:12px monospace;white-space:pre-wrap;overflow:auto';
        d.textContent = 'Диагностика связи…\n'; document.body.appendChild(d);
        var key = (window.__SBKEY || '');
        var bases = [['direct', DIRECT]].concat(PROXIES.map(function (p, i) { return ['proxy' + i, p]; }));
        bases.reduce(function (pr, b) { return pr.then(function () {
          var t0 = Date.now();
          return fetch(b[1] + '/auth/v1/settings', { cache: 'no-store', headers: { apikey: key, 'x-client-info': 'diag' } })
            .then(function (r) { return r.text().then(function (tx) { d.textContent += b[0] + ' ' + b[1] + '\n  OK status=' + r.status + ' ' + (Date.now() - t0) + 'ms body=' + tx.slice(0, 80) + '\n'; }); })
            .catch(function (e) { d.textContent += b[0] + ' ' + b[1] + '\n  FAIL ' + (e && e.name) + ': ' + (e && e.message) + ' ' + (Date.now() - t0) + 'ms\n'; });
        }); }, Promise.resolve()).then(function () { d.textContent += '\nготово. force=' + get('golda_api_force') + ' cur=' + get(K) + '\nСфотографируй экран и пришли.'; });
      });
    }
  } catch (e) {}
  var cur = get(K);
  window.GOLDA_SWITCH = function () {
    var all = [''].concat(PROXIES), i = all.indexOf(cur || ''), next = all[(i + 1) % all.length];
    set(K, next || null); try { sessionStorage.removeItem('golda_api_rl'); sessionStorage.setItem('golda_api_sw', String((+sessionStorage.getItem('golda_api_sw') || 0) + 1)); } catch (e) {}
    location.reload(); return true;
  };
  if (cur && PROXIES.indexOf(cur) < 0) { set(K, null); cur = null; }
  window.GOLDA_API = cur || '';
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!cur) {
        probe(DIRECT).then(function (ok) { if (ok || !once()) return; firstOk(PROXIES).then(function (b) { if (b) { set(K, b); location.reload(); } }); });
      } else if (get('golda_api_force') !== '1') {
        probe(cur).then(function (ok) { if (ok) return; probe(DIRECT).then(function (d) { if (!once()) return; if (d) { set(K, null); location.reload(); } else firstOk(PROXIES).then(function (b) { if (b && b !== cur) { set(K, b); location.reload(); } }); }); });
      }
    }, 1500);
  });
})();
