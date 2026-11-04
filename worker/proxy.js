// Cloudflare Worker: прозрачный прокси для Supabase (REST, auth, storage, realtime/websocket)
const TARGET = 'zuxvcqdttptahwinlnpz.supabase.co';
export default {
  async fetch(req) {
    const u = new URL(req.url);
    u.hostname = TARGET; u.protocol = 'https:'; u.port = '';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers.get('access-control-request-headers') || '*', 'access-control-allow-methods': '*', 'access-control-max-age': '86400' } });
    const r = new Request(u, req);
    r.headers.set('host', TARGET);
    const res = await fetch(r);
    if (res.status === 101) return res;
    const h = new Headers(res.headers); h.set('access-control-allow-origin', '*'); h.set('access-control-expose-headers', '*');
    return new Response(res.body, { status: res.status, headers: h });
  }
};
