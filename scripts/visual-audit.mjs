#!/usr/bin/env node
import { chromium } from '/Users/sergei/.vizor/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = process.env.AUDIT_BASE || 'http://localhost:8081';
const OUT = process.env.AUDIT_OUT || '.audit/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { name: '01-home', path: '/', auth: false },
  { name: '02-login', path: '/login', auth: false },
  { name: '03-specialists', path: '/specialists', auth: false },
  { name: '04-specialist-detail', path: '/specialists', auth: false, action: 'first-card' },
  { name: '05-saved-specialists', path: '/saved-specialists', auth: true },
  { name: '06-public-requests', path: '/public-requests', auth: false },
  { name: '07-my-requests', path: '/my-requests', auth: true },
  { name: '08-request-new', path: '/requests/new', auth: true },
  { name: '09-messages', path: '/messages', auth: true },
  { name: '10-dashboard', path: '/dashboard', auth: true },
  { name: '11-settings', path: '/settings', auth: true },
  { name: '12-onboarding-work-area', path: '/onboarding/work-area', auth: true },
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1280, height: 900 },
  { tag: 'mobile', width: 430, height: 932 },
];

async function authenticate(ctx) {
  const email = process.env.AUDIT_EMAIL || 'serter2069@gmail.com';
  const code = '000000';
  const apiBase = process.env.API_BASE || 'http://localhost:3812';

  // Request OTP (dev mode: registers user, sends nothing)
  await fetch(`${apiBase}/api/auth/request-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  }).catch((e) => console.log('WARN request-otp:', e.message));

  // Verify with dev code 000000
  const res = await fetch(`${apiBase}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, code }),
  }).catch((e) => { console.log('AUTH_FAIL verify-otp fetch:', e.message); return null; });

  if (!res || !res.ok) {
    const body = res ? await res.text().catch(() => '') : '';
    console.log(`AUTH_FAIL HTTP ${res ? res.status : 'no-response'} ${body.slice(0, 200)}`);
    return false;
  }

  const data = await res.json();
  const accessToken = data.accessToken || data.token || data.access_token;
  const refreshToken = data.refreshToken || data.refresh_token;

  if (!accessToken) {
    console.log('AUTH_FAIL no token in response:', JSON.stringify(data).slice(0, 200));
    return false;
  }

  // Inject tokens into localStorage BEFORE any navigation.
  // AuthContext uses keys: p2ptax_access_token / p2ptax_refresh_token
  await ctx.addInitScript(({ accessToken, refreshToken }) => {
    try {
      localStorage.setItem('p2ptax_access_token', accessToken);
      if (refreshToken) localStorage.setItem('p2ptax_refresh_token', refreshToken);
    } catch {}
  }, { accessToken, refreshToken });

  console.log(`AUTH_OK email=${email} token=${accessToken.slice(0, 20)}...`);
  return true;
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    let authed = false;
    for (const r of ROUTES) {
      if (r.auth && !authed) { authed = await authenticate(ctx); }
      const p = await ctx.newPage();
      await p.route('**/*', (route) => route.continue({ headers: { ...route.request().headers(), 'Cache-Control': 'no-cache, no-store' } }));
      try {
        await p.goto(`${BASE}${r.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await p.waitForTimeout(2000);
      } catch (e) { console.log(`WARN ${r.name} ${vp.tag}: ${e.message}`); }
      const file = path.join(OUT, `${r.name}-${vp.tag}.png`);
      await p.screenshot({ path: file, fullPage: false });
      console.log(`OK ${file}`);
      await p.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log('DONE');
})();
