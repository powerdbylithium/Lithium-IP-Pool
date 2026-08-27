export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", ts: Date.now() });
    }

    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("missing params of url", { status: 400 });
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response("invalid url", { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new Response("unsupported protocol", { status: 400 });
    }

    const headers = new Headers(request.headers);
    for (const h of ["cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor", "x-forwarded-for", "x-real-ip", "host", "referer", "origin"]) {
      headers.delete(h);
    }

    const upstream = await fetch(parsed.toString(), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "manual"
    });

    const out = new Response(upstream.body, upstream);
    out.headers.set("Access-Control-Allow-Origin", "*");
    out.headers.delete("set-cookie");
    return out;
  }
};
