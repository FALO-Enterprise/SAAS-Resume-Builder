const { URL } = require('url');
(async () => {
  const res = await fetch('http://localhost:3001/api/auth/oauth/github?locale=en', { redirect: 'manual' });
  console.log('start status', res.status);
  console.log('location', res.headers.get('location'));
  console.log('set-cookie', res.headers.get('set-cookie'));
  const loc = res.headers.get('location');
  const cookie = res.headers.get('set-cookie');
  if (!loc || !cookie) return;
  const state = new URL(loc).searchParams.get('state');
  const callbackUrl = `http://localhost:3001/api/auth/oauth/github/callback?state=${encodeURIComponent(state)}&code=boguscode`;
  console.log('callback url', callbackUrl);
  const res2 = await fetch(callbackUrl, { headers: { Cookie: cookie.split(';')[0] }, redirect: 'manual' });
  console.log('callback status', res2.status);
  console.log('callback location', res2.headers.get('location'));
  console.log('callback body start', (await res2.text()).slice(0, 500));
})();
