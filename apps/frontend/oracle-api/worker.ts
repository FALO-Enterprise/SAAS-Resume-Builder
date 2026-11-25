type Environment = {
  ORACLE_API: { fetch(request: Request): Promise<Response> };
};

export default {
  async fetch(request: Request, env: Environment) {
    const url = new URL(request.url);
    if (url.pathname !== "/health" && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/uploads/")) {
      return new Response("Not found", { status: 404 });
    }

    const upstream = new URL("http://127.0.0.1:3001");
    upstream.pathname = url.pathname;
    upstream.search = url.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("forwarded");
    headers.delete("x-forwarded-for");
    headers.delete("x-forwarded-host");
    headers.set("x-forwarded-proto", "https");
    const clientIp = request.headers.get("cf-connecting-ip");
    if (clientIp) headers.set("x-forwarded-for", clientIp);

    try {
      return await env.ORACLE_API.fetch(new Request(upstream, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
      }));
    } catch (error) {
      console.error("Oracle API connection failed", error instanceof Error ? error.message : "Unknown error");
      return new Response("Service unavailable", { status: 503 });
    }
  },
};
