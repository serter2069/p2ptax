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
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`);
  await p.waitForTimeout(1000);
  // Try to type email — selector for the new unified Input
  const emailInput = await p.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="@"]').first();
  await emailInput.fill('serter2069@gmail.com');
  await p.locator('text=Продолжить, text=Войти, button:has-text("Продолжить")').first().click().catch(() => {});
  await p.waitForTimeout(1500);
  // Type OTP 000000
  const otpInputs = await p.locator('input[inputmode="numeric"], input[type="tel"], input[maxlength="1"]').all();
  if (otpInputs.length === 6) {
    for (let i = 0; i < 6; i++) await otpInputs[i].fill('0');
  } else if (otpInputs.length === 1) {
    await otpInputs[0].fill('000000');
  }
  await p.waitForTimeout(2500);
  await p.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
    let authed = false;
    for (const r of ROUTES) {
      if (r.auth && !authed) { await authenticate(ctx); authed = true; }
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
