const { URL } = require("url");
const fetch = globalThis.fetch || require("node-fetch");
(async () => {
  const start = await fetch(
    "http://localhost:3001/api/auth/oauth/github?locale=en",
    { redirect: "manual" },
  );
  console.log("start status:", start.status);
  const location = start.headers.get("location");
  const cookie = start.headers.get("set-cookie");
  console.log("location:", location);
  console.log("cookie:", cookie);
  if (!location || !cookie) return;
  const state = new URL(location).searchParams.get("state");
  if (!state) {
    console.error("state missing");
    return;
  }
  const callbackUrl = `http://localhost:3001/api/auth/oauth/github/callback?state=${encodeURIComponent(state)}&code=boguscode`;
  console.log("callbackUrl:", callbackUrl);
  const callback = await fetch(callbackUrl, {
    headers: { Cookie: cookie.split(";")[0] },
    redirect: "manual",
  });
  console.log("callback status:", callback.status);
  console.log(
    "callback headers:",
    Object.fromEntries(callback.headers.entries()),
  );
  const body = await callback.text();
  console.log("callback body:", body.slice(0, 500));
})();
