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

/** Signs in as a demo persona via the prototype shortcut. */
async function persona(name) {
  await page.goto(BASE + '/welcome', { waitUntil: 'networkidle' });
  if (!page.url().includes('/welcome')) {
    // Already signed in — use the in-app switcher.
    await page.getByRole('button', { name: 'Switch persona' }).click();
  } else {
    await page.goto(BASE + '/prototype/persona', { waitUntil: 'networkidle' });
  }
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
  await page.waitForURL('**/home');
}

/** Signs in through the REAL flow: mobile number → OTP. */
async function signInWithOtp(mobile, code = '123456') {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="tel"]').fill(mobile);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/verify');
  await page.locator('input[autocomplete="one-time-code"]').fill(code);
}

/**
 * Signs out THROUGH THE UI, without reloading.
 *
 * The mock database lives in memory, so any page.goto() resets it to the
 * seeded fixtures and discards accounts created during the run. Checks that
 * depend on a just-registered account must stay on the same document.
 */
async function signOutInApp() {
  await page.getByRole('link', { name: 'More' }).click();
  await page.waitForURL('**/more');
  await page.getByRole('button', { name: 'Sign out' }).click();
  const dialog = page.getByRole('alertdialog');
  await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/welcome');
}

/** Clears the session so the next check starts from the entry point. */
async function signOut() {
  await page.goto(BASE + '/welcome', { waitUntil: 'networkidle' });
  if (page.url().includes('/welcome')) return;
  await page.evaluate(() => {
    localStorage.removeItem('mahakhanij.session');
    localStorage.removeItem('mahakhanij.organization-context');
  });
  await page.goto(BASE + '/welcome', { waitUntil: 'networkidle' });
}

// 1. Splash resolves an absent session and routes to the real entry point.
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForURL('**/welcome', { timeout: 5000 });
check('Splash routes an unauthenticated visitor to Welcome',
  page.url().endsWith('/welcome'), page.url().replace(BASE, ''));

// 2. No bottom navigation before sign-in.
check('No bottom navigation while signed out', (await page.$('nav[aria-label="Main"]')) === null);

// 3. Sign in as Organization (via the prototype shortcut).
await persona('Organization');
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
await persona('Normal Consumer');
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


/* ===========================================================================
 * AUTHENTICATION — Splash → Welcome → Login/Register → OTP → Experience
 * ======================================================================== */

await signOut();

// Welcome offers exactly two ways in.
await page.goto(BASE + '/welcome', { waitUntil: 'networkidle' });
const welcomeButtons = await page.$$eval('button', (els) =>
  els.map((e) => e.textContent.trim()).filter((t) => t === 'Sign in' || t === 'Create account'));
check('Welcome offers Sign in and Create account',
  welcomeButtons.length === 2, welcomeButtons.join(' · '));

// Mobile validation rejects a malformed number.
await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
await page.locator('input[type="tel"]').fill('12345');
await page.getByRole('button', { name: 'Continue' }).click();
check('Login rejects an invalid mobile number',
  (await page.textContent('main')).includes('valid 10-digit'));

// A wrong OTP shows the error state rather than signing anyone in.
await signInWithOtp('9822014576', '000000');
await page.waitForSelector('[role="alert"]', { timeout: 5000 });
check('Wrong OTP is rejected with a visible error',
  page.url().endsWith('/verify') && (await page.textContent('main')).includes('not correct'));

// An unknown number is told there is no account, not signed in.
await signInWithOtp('9000000001');
await page.waitForSelector('[role="alert"]', { timeout: 5000 });
check('Unknown number reports no account',
  (await page.textContent('main')).includes('No account exists'));

// The real flow signs in the seeded ORGANIZATION account.
await signInWithOtp('9822014576');
await page.waitForURL('**/home', { timeout: 5000 });
const orgAuthTabs = await tabs();
check('OTP sign-in resolves the Organization experience',
  JSON.stringify(orgAuthTabs) === JSON.stringify(['Home', 'Projects', 'Orders', 'More']),
  orgAuthTabs.join(' · '));

// Splash now sends the returning user straight in.
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForURL('**/home', { timeout: 5000 });
check('Splash routes a returning user to Home', page.url().endsWith('/home'));

// Auth screens are closed to an authenticated user.
for (const path of ['/welcome', '/login', '/register', '/verify']) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  check(`Authenticated user is kept out of ${path}`,
    page.url().endsWith('/home'), 'landed on ' + page.url().replace(BASE, ''));
}

// The real flow signs in the seeded NORMAL CONSUMER account.
await signOut();
await signInWithOtp('9730845120');
await page.waitForURL('**/home', { timeout: 5000 });
const conAuthTabs = await tabs();
check('OTP sign-in resolves the Normal Consumer experience',
  JSON.stringify(conAuthTabs) === JSON.stringify(['Home', 'Mineral', 'Orders', 'More']),
  conAuthTabs.join(' · '));
check('Consumer signed in via OTP still cannot see Projects',
  !conAuthTabs.includes('Projects'));

// /verify is unreachable without a verification actually in progress.
await signOut();
await page.goto(BASE + '/verify', { waitUntil: 'networkidle' });
check('/verify without a pending verification redirects to Login',
  page.url().endsWith('/login'), page.url().replace(BASE, ''));

/* --- REGISTRATION: the step that establishes the user type --- */

await page.goto(BASE + '/register', { waitUntil: 'networkidle' });
check('Registration asks for user type first',
  (await page.textContent('main')).includes('How will you use Mahakhanij?'));

// Continue is blocked until a type is chosen.
check('Registration cannot proceed without choosing a user type',
  await page.getByRole('button', { name: 'Continue' }).isDisabled());

// Register a NEW Organization whose type is GOVERNMENT.
await page.getByRole('radio', { name: /Organization/ }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Full name').fill('K. R. Patil');
await page.locator('input[type="tel"]').fill('9812345678');
await page.getByRole('button', { name: 'Continue' }).click();
check('Organization registration asks for organization details',
  (await page.textContent('main')).includes('Organization name'));
await page.getByLabel('Organization name').fill('Nagpur Municipal Corporation');
await page.selectOption('select', 'GOVERNMENT');
await page.getByLabel(/registration number/i).fill('MH/MK/ENT/2026/000123');
await page.getByRole('button', { name: /Verify your number/ }).click();
await page.waitForURL('**/verify');
await page.locator('input[autocomplete="one-time-code"]').fill('123456');
await page.waitForURL('**/home', { timeout: 5000 });

const govTabs = await tabs();
check('Newly registered GOVERNMENT organization gets the Organization experience',
  JSON.stringify(govTabs) === JSON.stringify(['Home', 'Projects', 'Orders', 'More']),
  govTabs.join(' · '));

// Reached through the UI, not by page.goto — a reload would reset the
// in-memory database and discard the account just created.
await page.getByRole('link', { name: 'More' }).click();
await page.waitForURL('**/more');
check('Newly registered GOVERNMENT organization sees Temporary Excavation in More',
  (await page.textContent('main')).includes('Temporary Excavation'));

await page.getByRole('button', { name: /Temporary Excavation/ }).click();
await page.waitForURL('**/temporary-excavation');
check('Newly registered GOVERNMENT organization reaches Temporary Excavation',
  page.url().endsWith('/temporary-excavation'), page.url().replace(BASE, ''));

// Registering the same number twice must be refused.
// Signed out through the UI so the account just created survives.
await signOutInApp();
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL('**/register');
await page.getByRole('radio', { name: /Normal Consumer/ }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Full name').fill('Duplicate Person');
await page.locator('input[type="tel"]').fill('9812345678');
await page.getByRole('button', { name: 'Continue' }).click();
check('Consumer registration asks for a delivery location, not organization details',
  (await page.textContent('main')).includes('Where should mineral be delivered?'));
await page.getByLabel('Address').fill('12 Civil Lines');
await page.getByLabel('Taluka').fill('Nagpur');
await page.getByLabel('District').fill('Nagpur');
await page.getByLabel('PIN code').fill('440001');
await page.getByRole('button', { name: /Verify your number/ }).click();
await page.waitForURL('**/verify');
await page.locator('input[autocomplete="one-time-code"]').fill('123456');
await page.waitForSelector('[role="alert"]', { timeout: 5000 });
check('Registering an existing number is refused',
  (await page.textContent('main')).includes('account already exists'));

await signOut();

/* ===========================================================================
 * 19. ORGANIZATION TYPE IS METADATA, NOT ARCHITECTURE
 * ---------------------------------------------------------------------------
 * Government departments, builders, contractors and any other organization
 * type share ONE identical experience. There is no Builder App, no Contractor
 * App, no Government App.
 *
 * This is the rule most likely to be broken quietly six months from now by a
 * single innocuous `if (organization.type === 'GOVERNMENT')`. So it is asserted
 * here rather than left as a convention: the organization is cycled through
 * every type and the entire signed-in experience must come back byte-identical
 * apart from the one subtitle that displays the type by design.
 * ======================================================================== */

const ORG_TYPES = ['BUILDER', 'CONTRACTOR', 'GOVERNMENT', 'OTHER'];
const EXPECTED_LABEL = { BUILDER: 'Builder', CONTRACTOR: 'Contractor', GOVERNMENT: 'Government', OTHER: 'Organization' };

/** Rewrites the persisted session's organization type and reloads. */
async function setOrganizationType(type) {
  await page.evaluate((nextType) => {
    const raw = localStorage.getItem('mahakhanij.session');
    if (!raw) throw new Error('no persisted session');
    const parsed = JSON.parse(raw);
    parsed.state.organization.type = nextType;
    localStorage.setItem('mahakhanij.session', JSON.stringify(parsed));
  }, type);
  await page.reload({ waitUntil: 'networkidle' });
}

/**
 * Captures the whole experience: tab set, every reachable route, and the full
 * text of More with the one legitimate type-bearing element removed.
 */
async function captureExperience() {
  await page.goto(BASE + '/more', { waitUntil: 'networkidle' });

  const more = await page.evaluate(() => {
    const main = document.querySelector('main').cloneNode(true);
    // The organization row's subtitle is the ONE place type is shown by design.
    // Take the DEEPEST matching node, not an ancestor that also wraps the name.
    const candidates = [...main.querySelectorAll('span')]
      .filter((el) => el.textContent.includes('MH/MK/ENT'));
    const subtitle = candidates.sort(
      (a, b) => a.textContent.length - b.textContent.length,
    )[0];
    const typeLabel = subtitle ? subtitle.textContent.split('\u00b7')[0].trim() : null;
    subtitle?.remove();
    return { typeLabel, rest: main.textContent.replace(/\s+/g, ' ').trim() };
  });

  const tabList = await tabs();

  const reach = {};
  for (const path of ['/home', '/projects', '/orders', '/temporary-excavation']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    reach[path] = page.url().replace(BASE, '');
  }

  return { tabs: tabList, more: more.rest, typeLabel: more.typeLabel, reach };
}

await persona('Organization');
const baseline = await captureExperience();

for (const type of ORG_TYPES) {
  await setOrganizationType(type);
  const actual = await captureExperience();

  check(`Org type ${type} — identical navigation`,
    JSON.stringify(actual.tabs) === JSON.stringify(baseline.tabs), actual.tabs.join(' · '));

  check(`Org type ${type} — identical route access`,
    JSON.stringify(actual.reach) === JSON.stringify(baseline.reach),
    JSON.stringify(actual.reach));

  check(`Org type ${type} — identical screen content`,
    actual.more === baseline.more,
    actual.more === baseline.more ? '' : 'content diverged');

  check(`Org type ${type} — only the type label changes`,
    actual.typeLabel === EXPECTED_LABEL[type],
    `label="${actual.typeLabel}"`);
}

// Restore the seeded type so later runs start from a clean state.
await setOrganizationType('BUILDER');

check('No console or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
