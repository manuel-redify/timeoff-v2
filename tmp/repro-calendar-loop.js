const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  const chromePort = Number(process.env.CHROME_DEBUG_PORT || '9222');

  function parseSetCookie(setCookie) {
    const [nameValue, ...attrParts] = setCookie.split(';');
    const [name, ...valueParts] = nameValue.split('=');
    const value = valueParts.join('=');
    const cookie = {
      name: name.trim(),
      value: value.trim(),
      url: 'http://localhost:3000',
    };

    for (const rawAttr of attrParts) {
      const attr = rawAttr.trim();
      const [attrName, ...attrValueParts] = attr.split('=');
      const attrValue = attrValueParts.join('=');
      switch (attrName.toLowerCase()) {
        case 'path':
          cookie.path = attrValue || '/';
          break;
        case 'httponly':
          cookie.httpOnly = true;
          break;
        case 'secure':
          cookie.secure = true;
          break;
        case 'samesite': {
          const normalized = (attrValue || '').toLowerCase();
          if (normalized === 'lax') cookie.sameSite = 'Lax';
          if (normalized === 'strict') cookie.sameSite = 'Strict';
          if (normalized === 'none') cookie.sameSite = 'None';
          break;
        }
        case 'expires': {
          const expires = Date.parse(attrValue);
          if (!Number.isNaN(expires)) cookie.expires = Math.floor(expires / 1000);
          break;
        }
      }
    }

    return cookie;
  }

  const csrfRes = await fetch('http://localhost:3000/api/auth/csrf', { redirect: 'manual' });
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie().map(parseSetCookie);
  const csrfCookieHeader = csrfCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

  const loginBody = new URLSearchParams({
    email: 'manuel.magnani+parker@redify.co',
    password: 'TempPassword123!',
    csrfToken: csrfData.csrfToken,
    callbackUrl: 'http://localhost:3000/',
    json: 'true',
  });

  const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials?json=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookieHeader,
    },
    body: loginBody,
    redirect: 'manual',
  });

  const authCookies = [
    ...csrfCookies,
    ...loginRes.headers.getSetCookie().map(parseSetCookie),
  ];

  const version = await fetchJson(`http://127.0.0.1:${chromePort}/json/version`);
  const target = await fetchJson(
    `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent('http://localhost:3000/login')}`,
    { method: 'PUT' }
  );
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let id = 0;
  const pending = new Map();
  const wallChartRequests = [];
  const lifecycle = [];

  function send(method, params = {}) {
    const messageId = ++id;
    ws.send(JSON.stringify({ id: messageId, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(messageId, { resolve, reject, method });
      setTimeout(() => {
        if (pending.has(messageId)) {
          pending.delete(messageId);
          reject(new Error(`Timeout waiting for ${method}`));
        }
      }, 15000);
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data.toString());
    if (msg.id) {
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else entry.resolve(msg.result);
      return;
    }

    if (msg.method === 'Network.requestWillBeSent') {
      const url = msg.params?.request?.url || '';
      if (url.includes('/api/calendar/wall-chart')) {
        wallChartRequests.push({
          timestamp: Date.now(),
          url,
          type: msg.params.type,
        });
      }
    }

    if (msg.method === 'Page.lifecycleEvent') {
      lifecycle.push({ name: msg.params.name, timestamp: Date.now() });
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.setLifecycleEventsEnabled', { enabled: true });
  const cookieSetResults = [];
  for (const cookie of authCookies) {
    const result = await send('Network.setCookie', cookie);
    cookieSetResults.push({ name: cookie.name, result });
  }
  const browserCookies = await send('Network.getCookies', { urls: ['http://localhost:3000/'] });

  async function evalExpr(expression) {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.text || 'Runtime.evaluate failed';
      throw new Error(text);
    }
    return result.result?.value;
  }

  async function waitFor(fnExpression, timeoutMs, label) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const value = await evalExpr(fnExpression);
      if (value) return value;
      await sleep(250);
    }
    const cookieSnapshot = await send('Network.getCookies', { urls: ['http://localhost:3000/'] });
    const diagnostics = {
      href: await evalExpr('location.href'),
      title: await evalExpr('document.title'),
      body: await evalExpr('document.body ? document.body.innerText.slice(0, 1000) : ""'),
      cookies: cookieSnapshot.cookies,
    };
    console.error(JSON.stringify({ waitFor: label, diagnostics }, null, 2));
    throw new Error(`Timeout waiting for ${label}`);
  }

  await waitFor(`document.readyState === 'complete'`, 15000, 'login page ready');
  await send('Page.navigate', { url: 'http://localhost:3000/api/auth/session' });
  await waitFor(`document.readyState === 'complete'`, 15000, 'auth session page');
  const sessionBody = await evalExpr('document.body ? document.body.innerText : ""');
  if (!sessionBody || sessionBody.trim() === 'null' || sessionBody.includes('{}')) {
    throw new Error(`Browser session check failed: ${sessionBody}`);
  }
  await send('Page.navigate', { url: 'http://localhost:3000/calendar' });
  await waitFor(`location.pathname === '/calendar'`, 20000, 'calendar page');
  await waitFor(`document.readyState === 'complete'`, 15000, 'calendar ready');

  const idleStart = Date.now();
  await sleep(15000);
  const idleEnd = Date.now();

  const summary = {
    currentUrl: await evalExpr('location.href'),
    title: await evalExpr('document.title'),
    cookieSetResults,
    browserCookies: browserCookies.cookies,
    wallChartRequests,
    requestCount: wallChartRequests.length,
    idleWindowMs: idleEnd - idleStart,
  };

  const outPath = path.join(process.cwd(), 'tmp', 'calendar-repro.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  ws.close();
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
