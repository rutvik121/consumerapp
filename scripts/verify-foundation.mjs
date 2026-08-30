/**
 * FOUNDATION SMOKE CHECK
 *
 * Verifies the Increment 0 guarantees against the real running app rather than
 * against the source: routing, role-driven navigation, route-level access
 * control, session persistence, mobile layout, touch targets and design tokens.
 *
 * The access-control checks matter most. "A Normal Consumer must never reach
 * Temporary Excavation" is the kind of rule that quietly breaks when a route is
 * added later, so it is asserted here as an executable check rather than left
 * as a note in a document.
 *
 * USAGE
 *   npm run build
 *   npx vite preview --port 4173 --host 127.0.0.1 &
 *   npm i -D playwright          # not a project dependency; install to run
 *   node scripts/verify-foundation.mjs
 *
 * Playwright is deliberately NOT in package.json — the prototype should stay
 * light. Install it only when you want to run this.
 *
 * Set CHROMIUM_PATH if your Chromium is not on the default Playwright path.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
// iPhone 14-ish viewport: prove the mobile layout, not a desktop page.
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

async function tabs() {
  return page.$$eval('nav[aria-label="Main"] a', (els) => els.map((e) => e.textContent.trim()));
}

// 1. Unauthenticated root redirects to the entry point.
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
check('Unauthenticated root redirects to persona picker',
  page.url().endsWith('/prototype/persona'), page.url().replace(BASE, ''));

// 2. No bottom navigation before sign-in.
check('No bottom navigation while signed out', (await page.$('nav[aria-label="Main"]')) === null);

// 3. Sign in as Organization.
await page.getByRole('button', { name: /Organization/ }).first().click();
await page.waitForURL('**/home');
check('Organization persona lands on Home', page.url().endsWith('/home'));

const orgTabs = await tabs();
check('Organization tabs are Home · Projects · Orders · More',
  JSON.stringify(orgTabs) === JSON.stringify(['Home', 'Projects', 'Orders', 'More']),
  orgTabs.join(' · '));

// 4. Organization CAN reach Temporary Excavation by direct URL.
await page.goto(BASE + '/temporary-excavation', { waitUntil: 'networkidle' });
check('Organization reaches /temporary-excavation',
  page.url().endsWith('/temporary-excavation'), page.url().replace(BASE, ''));

// 5. Organization-only route reachable via More.
await page.goto(BASE + '/more', { waitUntil: 'networkidle' });
const orgMoreText = await page.textContent('main');
check('Temporary Excavation listed in More for Organization',
  orgMoreText.includes('Temporary Excavation'));

// 6. Context store starts empty and reports not-scoped.
check('Operating context starts unscoped for Organization',
  orgMoreText.includes('No project selected') && orgMoreText.includes('Fully scoped'));

// 7. Switch persona to Normal Consumer.
await page.getByRole('button', { name: 'Switch persona' }).click();
await page.getByRole('button', { name: /Normal Consumer/ }).click();
await page.waitForURL('**/home');
check('Consumer persona lands on Home', page.url().endsWith('/home'));

const conTabs = await tabs();
check('Consumer tabs are Home · Mineral · Orders · More',
  JSON.stringify(conTabs) === JSON.stringify(['Home', 'Mineral', 'Orders', 'More']),
  conTabs.join(' · '));

check('Consumer navigation has no Projects tab', !conTabs.includes('Projects'));

// 8. THE CRITICAL RULE — consumer blocked from Temporary Excavation by direct URL.
await page.goto(BASE + '/temporary-excavation', { waitUntil: 'networkidle' });
check('Consumer redirected away from /temporary-excavation (direct URL)',
  page.url().endsWith('/home'), 'landed on ' + page.url().replace(BASE, ''));

// 9. Consumer blocked from Projects by direct URL.
await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
check('Consumer redirected away from /projects (direct URL)',
  page.url().endsWith('/home'), 'landed on ' + page.url().replace(BASE, ''));

// 10. Consumer's More screen must not mention Temporary Excavation at all.
await page.goto(BASE + '/more', { waitUntil: 'networkidle' });
const conMoreText = await page.textContent('main');
check('Temporary Excavation absent from Consumer More',
  !conMoreText.includes('Temporary Excavation'));
check('Consumer capabilities exclude TEMPORARY_EXCAVATION',
  !conMoreText.includes('TEMPORARY_EXCAVATION') && conMoreText.includes('VIEW_MINERAL_TAB'));

// 11. Organization guard the other way — consumer-only route.
await page.goto(BASE + '/mineral', { waitUntil: 'networkidle' });
check('Consumer reaches /mineral', page.url().endsWith('/mineral'));

// 12. Session persists across reload.
await page.reload({ waitUntil: 'networkidle' });
check('Session survives reload', page.url().endsWith('/mineral'));

// 13. Unknown route inside session.
await page.goto(BASE + '/does-not-exist', { waitUntil: 'networkidle' });
check('Unknown route renders Not found', (await page.textContent('main')).includes('does not exist'));

// 14. Mobile layout: no horizontal overflow at 390px.
await page.goto(BASE + '/more', { waitUntil: 'networkidle' });
const overflow = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
check('No horizontal overflow at 390px', overflow.scrollW <= overflow.clientW,
  `${overflow.scrollW} vs ${overflow.clientW}`);

// 15. Touch targets meet the 44px floor.
const small = await page.$$eval('nav[aria-label="Main"] a, main button', (els) =>
  els.filter((e) => e.offsetParent !== null)
     .map((e) => ({ t: (e.textContent || '').trim().slice(0, 28), h: Math.round(e.getBoundingClientRect().height) }))
     .filter((e) => e.h > 0 && e.h < 44));
check('All visible tap targets >= 44px tall', small.length === 0,
  small.length ? JSON.stringify(small) : '');

// 16. Bottom sheet opens, portals inside the frame, and closes.
await page.getByRole('button', { name: 'Switch persona' }).click();
await page.waitForSelector('[role="dialog"]');
const inFrame = await page.evaluate(() =>
  !!document.getElementById('app-overlay-root')?.querySelector('[role="dialog"]'));
check('Bottom sheet portals into the in-frame overlay root', inFrame);
await page.keyboard.press('Escape');
await page.waitForSelector('[role="dialog"]', { state: 'detached' });
check('Bottom sheet closes on Escape', true);

// 17. Design tokens actually applied (not falling back to browser defaults).
const tokenCheck = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return { primary: s.getPropertyValue('--color-primary-600').trim(), touch: s.getPropertyValue('--touch-min').trim() };
});
check('Design tokens resolve at runtime',
  tokenCheck.primary === '#1f5680' && tokenCheck.touch === '44px',
  `primary-600=${tokenCheck.primary} touch-min=${tokenCheck.touch}`);

// 18. Desktop renders the device frame rather than a stretched page.
const desktop = await ctx.newPage();
await desktop.setViewportSize({ width: 1440, height: 900 });
await desktop.goto(BASE + '/home', { waitUntil: 'networkidle' });
const frameW = await desktop.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Main"]');
  const frame = nav?.parentElement;
  return frame ? Math.round(frame.getBoundingClientRect().width) : -1;
});
check('Desktop renders a 390px device frame, not a full-width page', frameW === 390, `${frameW}px`);


// Screenshots for review.
await page.goto(BASE + '/more', { waitUntil: 'networkidle' });


check('No console or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
