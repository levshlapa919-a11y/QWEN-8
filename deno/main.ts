// Deno Deploy: прокси для Supabase (REST, auth, storage, realtime/websocket)
const TARGET = "zuxvcqdttptahwinlnpz.supabase.co";
const CORS = { "access-control-allow-origin": "*", "access-control-expose-headers": "*" };

Deno.serve(async (req: Request) => {
  const u = new URL(req.url);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS,
      "access-control-allow-headers": req.headers.get("access-control-request-headers") || "*",
      "access-control-allow-methods": "*", "access-control-max-age": "86400" } });
  }
  if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    const { socket: client, response } = Deno.upgradeWebSocket(req);
    const up = new WebSocket("wss://" + TARGET + u.pathname + u.search);
    const q: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];
    client.onmessage = (e) => { if (up.readyState === 1) up.send(e.data); else q.push(e.data); };
    up.onopen = () => { for (const m of q) up.send(m); q.length = 0; };
    up.onmessage = (e) => { if (client.readyState === 1) client.send(e.data); };
    up.onclose = () => { try { client.close(); } catch (_) {} };
    client.onclose = () => { try { up.close(); } catch (_) {} };
    up.onerror = () => { try { client.close(); } catch (_) {} };
    return response;
  }
  const headers = new Headers(req.headers);
  headers.set("host", TARGET);
  headers.delete("origin");
  const res = await fetch("https://" + TARGET + u.pathname + u.search, {
    method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body, redirect: "manual",
  });
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
});
