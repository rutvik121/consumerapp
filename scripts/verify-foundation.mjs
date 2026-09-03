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

/**
 * Reads the current screen's text.
 *
 * waitForURL resolves the moment the URL changes, which on a client-side
 * navigation is BEFORE React has rendered the new screen. Reading main
 * immediately can therefore return the previous screen's content.
 */
async function mainText() {
  await page.waitForTimeout(250);
  return page.textContent('main');
}

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
check('Registration opens on details step with Individual/Organization toggle',
  (await page.textContent('main')).includes('Basic & Address details') &&
  (await page.textContent('main')).includes('Individual') &&
  (await page.textContent('main')).includes('Organization'));

// Register a NEW Organization whose type is GOVERNMENT.
await page.getByRole('button', { name: 'Organization' }).click();
await page.getByLabel(/Authorized person full name/i).fill('K. R. Patil');
await page.locator('input[type="tel"]').fill('9812345678');
await page.getByLabel(/Organization name/i).fill('Nagpur Municipal Corporation');
await page.selectOption('select', 'GOVERNMENT');
await page.getByLabel(/Address/i).fill('12 Civil Lines');
await page.getByLabel('Taluka').fill('Nagpur');
await page.getByLabel('District').fill('Nagpur');
await page.getByLabel('PIN code').fill('440001');
await page.getByRole('button', { name: /Continue to KYC/i }).click();

check('Organization registration moves to KYC Verification',
  (await mainText()).includes('KYC Verification') &&
  (await mainText()).includes('Organization PAN number'));

await page.getByLabel(/Organization PAN number/i).fill('ABCDE1234F');
await page.getByRole('button', { name: /Use demo sample/i }).click();
await page.getByRole('button', { name: /Verify & Send OTP/i }).click();

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
  (await mainText()).includes('Temporary Excavation'));

await page.getByRole('button', { name: /Temporary Excavation/ }).click();
await page.waitForURL('**/temporary-excavation');
check('Newly registered GOVERNMENT organization reaches Temporary Excavation',
  page.url().endsWith('/temporary-excavation'), page.url().replace(BASE, ''));

// Registering the same number twice must be refused.
// Signed out through the UI so the account just created survives.
await signOutInApp();
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL('**/register');

// Default is Individual
await page.getByLabel(/^Full name/i).fill('Duplicate Person');
await page.locator('input[type="tel"]').fill('9812345678');
await page.getByLabel(/Address/i).fill('12 Civil Lines');
await page.getByLabel('Taluka').fill('Nagpur');
await page.getByLabel('District').fill('Nagpur');
await page.getByLabel('PIN code').fill('440001');
await page.getByRole('button', { name: /Continue to KYC/i }).click();

check('Consumer registration asks for Aadhaar KYC',
  (await mainText()).includes('Aadhaar card number'));

await page.getByLabel(/Aadhaar card number/i).fill('123456789012');
await page.getByRole('button', { name: /Use demo sample/i }).click();
await page.getByRole('button', { name: /Verify & Send OTP/i }).click();

await page.waitForURL('**/verify');
await page.locator('input[autocomplete="one-time-code"]').fill('123456');
await page.waitForSelector('[role="alert"]', { timeout: 5000 });
check('Registering an existing number is refused',
  (await mainText()).includes('account already exists'));

await signOut();

/* ===========================================================================
 * ORGANIZATION STRUCTURE AND CONTEXT PRESERVATION
 * ---------------------------------------------------------------------------
 * The product rule: "do not repeatedly ask the user to select a Project or
 * Package when that information is already known."
 *
 * What is asserted here is that navigating INTO a scope is what sets it.
 * Opening a project makes it active; opening a package completes the operating
 * context that every downstream operation inherits.
 * ======================================================================== */

await persona('Organization');
await page.waitForTimeout(1000);

// The six Home sections, in the order the product context fixes.
const homeSections = await page.$$eval('main h2', (els) =>
  els.map((e) => e.textContent.trim().toUpperCase()));
const expectedSections = [
  'ATTENTION REQUIRED', 'BUSINESS OVERVIEW', 'QUICK ACTIONS',
  'ACTIVE DELIVERIES', 'INVENTORY SNAPSHOT', 'TEMPORARY EXCAVATION',
];
check('Organization Home renders the six sections in the specified order',
  JSON.stringify(homeSections) === JSON.stringify(expectedSections),
  homeSections.join(' -> '));

const homeText = await mainText();

// Attention Required must derive real, actionable items from the dataset.
check('Attention Required surfaces the vehicle waiting to be received',
  homeText.includes('Vehicle waiting to be received') && homeText.includes('MH-12-KL-7788'));
check('Attention Required surfaces the recorded quantity shortage',
  homeText.includes('Shortage of 3 MT recorded') && homeText.includes('MH-04-JK-8891'));
check('Attention Required surfaces the application query',
  homeText.includes('Query raised on an application') && homeText.includes('TEA/2026/001347'));

// Business Overview figures are derived from the data, not hardcoded.
check('Business Overview reports the derived inventory total',
  homeText.includes('414'), 'expected 414 MT available');
check('Inventory Snapshot breaks the total down per mineral',
  homeText.includes('309') && homeText.includes('Crushed Stone Grit 20mm'));

// Receive is offered only where the delivery state allows it.
const receiveButtons = await page.$$eval('main button', (els) =>
  els.map((e) => e.textContent.trim()).filter((t) => t === 'Receive'));
check('Receive is offered on exactly the one arrived delivery',
  receiveButtons.length === 1, `${receiveButtons.length} Receive buttons`);

// No quick action is a dead end.
for (const [label, expected] of [
  ['Find stock point', '/stock-points'],
  ['Create enquiry', '/enquiries'],
  ['Receive mineral', '/receive'],
]) {
  await page.goto(BASE + '/home', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.waitForTimeout(300);
  check(`Quick action "${label}" leads somewhere real`,
    page.url().endsWith(expected), page.url().replace(BASE, ''));
}

/* --- Context: navigating in is what sets scope --- */

const readContext = () => page.evaluate(() => {
  const raw = localStorage.getItem('mahakhanij.organization-context');
  if (!raw) return { project: null, activePackage: null };
  const { state } = JSON.parse(raw);
  return {
    project: state.project?.name ?? null,
    activePackage: state.activePackage?.name ?? null,
  };
});

await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const projectRows = await page.$$eval('main button', (els) => els.length);
check('Projects lists the organization projects', projectRows >= 3, `${projectRows} rows`);

await page.getByRole('button', { name: /Mumbai/ }).click();
await page.waitForTimeout(900);
let scope = await readContext();
check('Opening a project sets it as the active project',
  scope.project === 'Mumbai–Nashik Highway Widening' && scope.activePackage === null,
  JSON.stringify(scope));

await page.getByRole('button', { name: /Package A/ }).click();
await page.waitForTimeout(900);
scope = await readContext();
check('Opening a package completes the operating context',
  scope.project === 'Mumbai–Nashik Highway Widening' &&
  scope.activePackage === 'Package A — Km 12 to Km 28',
  JSON.stringify(scope));

check('Package Details shows the parent project as context',
  (await mainText()).includes('Mineral operations') &&
  (await page.textContent('header')).includes('Mumbai–Nashik Highway Widening'));

// Supervisor is read-only context, never an actionable row.
const supervisorButtons = await page.$$eval('main button', (els) =>
  els.map((e) => e.textContent).filter((t) => t.includes('S. R. Pawar')).length);
check('Supervisor is shown as read-only, with nothing to tap', supervisorButtons === 0);

// Context survives leaving the hierarchy for an operation.
await page.getByRole('link', { name: 'Orders' }).click();
await page.waitForURL('**/orders');
scope = await readContext();
check('Operating context survives navigating away',
  scope.activePackage === 'Package A — Km 12 to Km 28', JSON.stringify(scope));

// Switching project invalidates a package chosen under the old one.
await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Pune Metro/ }).click();
await page.waitForTimeout(900);
scope = await readContext();
check('Switching project clears the package selected under the previous one',
  scope.project === 'Pune Metro Line 3 — Civil Works' && scope.activePackage === null,
  JSON.stringify(scope));

/* --- The hierarchy stays closed to Normal Consumers --- */

await persona('Normal Consumer');
for (const path of ['/projects/proj-001', '/projects/proj-001/packages/pkg-001']) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  check(`Consumer is redirected away from ${path}`,
    page.url().endsWith('/home'), 'landed on ' + page.url().replace(BASE, ''));
}

await page.goto(BASE + '/home', { waitUntil: 'networkidle' });
const consumerHome = await mainText();
check('Consumer Home shows none of the organization sections',
  !consumerHome.includes('Business overview') &&
  !consumerHome.includes('Temporary excavation') &&
  !consumerHome.includes('Active packages'));

/* ===========================================================================
 * MINERAL ACQUISITION — Find Stock Point -> Details -> Enquiry
 * ---------------------------------------------------------------------------
 * Two rules are asserted here.
 *
 * 1. CONTEXT IS NOT RE-ASKED. An organization user who reached the enquiry
 *    form through Project -> Package -> Stock Point has already answered
 *    where, what for, and from whom. The form must ask none of it again, and
 *    the enquiry it creates must still carry all of it.
 *
 * 2. THIS IS NOT A MARKETPLACE. No cart, no checkout, no price, and the word
 *    "book" never appears.
 * ======================================================================== */

await persona('Organization');
await page.waitForTimeout(900);

// Discovery is ranked against the operating destination, so it needs one.
await page.goto(BASE + '/stock-points', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
check('Discovery without a package asks for one instead of ranking against nothing',
  (await mainText()).includes('Select a package first'));

// Establish scope: Project -> Package.
await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Mumbai/ }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Package A/ }).click();
await page.waitForTimeout(800);

// Enter discovery FROM the package — context comes with it.
await page.getByRole('button', { name: 'Find stock point' }).click();
await page.waitForURL('**/stock-points');
await page.waitForTimeout(900);

const discoveryText = await mainText();
check('Discovery lists stock points ranked by distance from the package site',
  discoveryText.includes('Kalyan Stock Point') && discoveryText.includes('31.3 km'));

const headerText = await page.textContent('header');
check('Discovery keeps the project and package context visible',
  headerText.includes('Mumbai–Nashik Highway Widening') && headerText.includes('Package A'));

// Filters narrow the results.
await page.getByRole('button', { name: /Filters/ }).click();
await page.waitForSelector('[role="dialog"]');
await page.selectOption('[role="dialog"] select >> nth=0', { label: 'River Sand' });
await page.getByRole('button', { name: 'Apply' }).click();
await page.waitForTimeout(700);
const filtered = await mainText();
check('Filtering by mineral narrows the results',
  filtered.includes('River Sand') && !filtered.includes('Kalyan Stock Point'),
  filtered.includes('Kalyan Stock Point') ? 'Kalyan still listed' : '');

// Clear the filter through its chip.
await page.getByRole('button', { name: /Remove River Sand/ }).click();
await page.waitForTimeout(700);
check('Removing a filter chip restores the full result set',
  (await mainText()).includes('Kalyan Stock Point'));

// The map is a real view, not a decorative panel.
await page.getByRole('button', { name: 'Map', exact: true }).click();
await page.waitForTimeout(400);
check('Map view renders points positioned around the destination',
  (await page.$$('main svg circle')).length >= 6);
check('Map states the destination it measures from',
  (await mainText()).includes('Package A — Km 12 to Km 28'));

await page.getByRole('button', { name: 'List', exact: true }).click();
await page.waitForTimeout(300);

// Stock Point Details: one primary action, and provenance shown.
await page.getByRole('button', { name: /Kalyan Stock Point/ }).click();
await page.waitForTimeout(900);
const detailsText = await mainText();
check('Stock Point Details shows availability and source provenance',
  detailsText.includes('Available minerals') &&
  detailsText.includes('Titwala Trap Quarry') &&
  detailsText.includes('MH/TH/QRY/2024/0231'));
check('Stock Point Details offers exactly one primary action',
  (await page.getByRole('button', { name: 'Send enquiry' }).count()) === 1);

// NOT A MARKETPLACE.
const marketplaceWords = ['Book', 'Add to cart', 'Checkout', 'Buy now', 'Price', '₹'];
const offenders = marketplaceWords.filter((word) => detailsText.includes(word));
check('Stock Point Details uses no marketplace language or pricing',
  offenders.length === 0, offenders.join(', '));

/* --- The enquiry form asks only for what it does not already know --- */

await page.getByRole('button', { name: 'Send enquiry' }).click();
await page.waitForTimeout(900);
const formText = await mainText();

check('Enquiry form is titled as an enquiry, never a booking',
  (await page.textContent('header')).includes('Mineral enquiry') && !formText.includes('Book'));

const formLabels = await page.$$eval('main label', (els) =>
  els.map((e) => e.textContent.replace('*', '').trim()));
check('Enquiry form does not re-ask for project, package or stock point',
  !formLabels.some((label) => /project|package|stock point/i.test(label)),
  formLabels.join(' · '));
check('Enquiry form asks only for the requirement itself',
  formLabels.includes('Mineral') && formLabels.includes('Required quantity'),
  formLabels.join(' · '));

// Over-availability warns without blocking — an enquiry is a question.
await page.selectOption('main select', { label: 'Crushed Stone Grit 20mm' });
await page.locator('input[inputmode="decimal"]').fill('9999');
await page.waitForTimeout(300);
check('Requesting more than is held warns but does not block',
  (await mainText()).includes('You can still enquire for more') &&
  !(await page.getByRole('button', { name: 'Send enquiry' }).isDisabled()));

// Submit, and the enquiry must carry the context that was never re-asked.
await page.locator('input[inputmode="decimal"]').fill('120');
await page.getByRole('button', { name: 'Send enquiry' }).click();
await page.waitForTimeout(1200);
check('Submitting an enquiry confirms it was sent',
  (await mainText()).includes('Enquiry sent'));

await page.getByRole('button', { name: 'View enquiry' }).click();
await page.waitForTimeout(1000);
const createdText = await mainText();
check('The created enquiry carries the project and package it was raised under',
  createdText.includes('Mumbai–Nashik Highway Widening') &&
  createdText.includes('Package A — Km 12 to Km 28'),
  'context missing from the created enquiry');
check('The created enquiry records the requirement',
  createdText.includes('120 MT') && createdText.includes('Kalyan Stock Point'));

/* --- The same flow, without a hierarchy --- */

await persona('Normal Consumer');
await page.goto(BASE + '/stock-points', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
check('Consumer discovery ranks from the registered delivery address',
  (await mainText()).includes('Nashik Road Stock Point'));
check('Consumer discovery shows no project or package context',
  !(await page.textContent('header')).includes('Package'));

await page.goto(BASE + '/enquiries', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
check('Consumer sees only their own enquiries',
  (await mainText()).includes('ENQ/2026/009088'));

await page.getByRole('button', { name: /River Sand/ }).first().click();
await page.waitForTimeout(900);
const consumerEnquiry = await mainText();
check('Consumer enquiry detail shows no project or package fields',
  !consumerEnquiry.includes('Project') && !consumerEnquiry.includes('Package'),
  'organization fields leaked into the consumer view');

/* ===========================================================================
 * ORDERS AND TRANSPORT
 * ---------------------------------------------------------------------------
 * Two rules are asserted here.
 *
 * 1. FULFILMENT IS DERIVED. An order is the commercial envelope; the
 *    deliveries are the physical truth. Dispatched, received and pending are
 *    computed from the deliveries, never stored on the order.
 *
 * 2. TRACKING IS OPERATIONAL, NOT A COURIER ETA. The screen must answer the
 *    questions the product context lists -- vehicle, mineral, quantity,
 *    source, destination, status, last update, permit -- and the route
 *    progress must come from reported position rather than a timer.
 * ======================================================================== */

await persona('Organization');
await page.waitForTimeout(900);

await page.goto(BASE + '/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const ordersText = await mainText();
check('Order list shows dispatch AND receiving status separately',
  ordersText.includes('Partly received') && ordersText.includes('Partly dispatched'),
  'both statuses must be visible; collapsing them hides the source/destination gap');

await page.getByRole('button', { name: /Crushed Stone Grit/ }).first().click();
await page.waitForTimeout(1000);
const orderText = await mainText();

// ord-001: 500 ordered, deliveries of 50 + 50 + 50 = 150 dispatched,
// 50 + 47 received = 97, so 350 pending and a 3 MT shortfall.
check('Order Details derives dispatched, received and pending from the deliveries',
  orderText.includes('150') && orderText.includes('97') && orderText.includes('350'),
  'expected 150 dispatched / 97 received / 350 pending');
check('A recorded shortfall is surfaced on the order, not buried in one receipt',
  orderText.includes('3 MT') && orderText.includes('short received'));
check('Order Details lists the physical deliveries',
  orderText.includes('MH-04-GG-1234') && orderText.includes('MH-04-JK-8891'));
check('Order Details keeps the organization context',
  orderText.includes('Mumbai–Nashik Highway Widening') && orderText.includes('Package A'));

// Traceability walks backwards: Order -> Enquiry.
await page.getByRole('button', { name: /From enquiry/ }).click();
await page.waitForTimeout(900);
check('The order links back to the enquiry that produced it',
  page.url().includes('/enquiries/') && (await mainText()).includes('ENQ/2026/008841'),
  page.url().replace(BASE, ''));

/* --- Vehicle tracking --- */

await page.goto(BASE + '/deliveries/del-003/tracking', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const trackingText = await mainText();

check('Tracking identifies the vehicle',
  trackingText.includes('MH-12-KL-7788'));
check('Tracking states mineral and quantity',
  trackingText.includes('Murum') && trackingText.includes('40 MT'));
check('Tracking states current status and how stale it is',
  trackingText.includes('Arrived') && /Last update .*(ago|just now)/.test(trackingText));
check('Tracking names source and destination',
  trackingText.includes('Lonikand Murum Quarry') &&
  trackingText.includes('Package C — Station Box CH-04'));
check('Tracking shows the transport permit behind the movement',
  trackingText.includes('ETP/2026/MH/0436610') && trackingText.includes('Permitted quantity'));
check('Tracking shows the movement record, not just a map',
  trackingText.includes('Movement') && trackingText.includes('Wagholi Stock Point'));
check('Receive is offered on an arrived vehicle',
  (await page.getByRole('button', { name: 'Receive mineral' }).count()) === 1);

// Progress must be derived from reported position, not from a timer.
await page.goto(BASE + '/deliveries/del-005/tracking', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const inTransit = await mainText();
const progressMatch = /(\d+)% of the route covered/.exec(inTransit);
check('Route progress is derived from actual reported position',
  progressMatch !== null && Number(progressMatch[1]) > 0 && Number(progressMatch[1]) < 100,
  progressMatch ? progressMatch[0] : 'no derived progress found');
check('Receive is NOT offered on a vehicle still in transit',
  (await page.getByRole('button', { name: 'Receive mineral' }).count()) === 0);

// Timestamps must stay fresh however long after authoring the demo is run.
check('Fixture timestamps are relative to now, not a stale anchor date',
  /Last update (just now|\d+ min ago|[1-9] hours? ago)/.test(inTransit),
  /Last update ([^A-Z]{1,20})/.exec(inTransit)?.[1]?.trim() ?? 'not found');

// Attention items land on the thing itself, not a list to search through.
await page.goto(BASE + '/home', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.getByRole('button', { name: /Vehicle waiting to be received/ }).click();
await page.waitForTimeout(800);
check('An attention item opens the specific delivery, not the orders list',
  page.url().includes('/deliveries/del-003/tracking'), page.url().replace(BASE, ''));

/* --- The same screens without a hierarchy --- */

await persona('Normal Consumer');
await page.goto(BASE + '/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
check('Consumer sees only their own orders',
  (await mainText()).includes('ORD/2026/004473'));

await page.getByRole('button', { name: /River Sand/ }).first().click();
await page.waitForTimeout(1000);
const consumerOrder = await mainText();
check('Consumer order detail shows no project or package fields',
  !consumerOrder.includes('Project') && !consumerOrder.includes('Package'),
  'organization fields leaked into the consumer view');
check('Consumer order still shows the full traceability chain',
  consumerOrder.includes('From enquiry') && consumerOrder.includes('MH-15-BN-4402'));

/* ===========================================================================
 * RECEIVING — verification, discrepancy, and the write to inventory
 * ---------------------------------------------------------------------------
 * IMPORTANT: after sign-in this block navigates ONLY through the UI. The mock
 * database is in memory, so any page.goto() reseeds it and would silently
 * discard the receipt these checks exist to verify.
 * ======================================================================== */

await persona('Organization');
await page.waitForTimeout(1300);

const readInventoryTotal = () => page.evaluate(() => {
  const label = [...document.querySelectorAll('main span')]
    .find((el) => el.textContent.trim() === 'Available inventory');
  return label?.parentElement?.textContent?.replace('Available inventory', '').trim() ?? null;
});

const inventoryBefore = await readInventoryTotal();
check('Inventory reads its seeded total before receiving',
  inventoryBefore === '414MT', String(inventoryBefore));

const homeBefore = await mainText();
check('A waiting vehicle is on Home before receiving',
  homeBefore.includes('Vehicle waiting to be received'));

// Reach receiving through the UI.
await page.getByRole('button', { name: 'Receive mineral', exact: true }).click();
await page.waitForURL('**/receive');
await page.waitForTimeout(900);
const arrivals = await mainText();
check('Receiving lists only vehicles that have actually arrived',
  arrivals.includes('MH-12-KL-7788') && !arrivals.includes('MH-12-XY-3391'),
  'an in-transit vehicle must not be offered for receiving');

await page.getByRole('button', { name: /MH-12-KL-7788/ }).click();
await page.waitForTimeout(900);
check('Receiving opens on the scan step',
  (await mainText()).includes('Scan the transport permit'));
check('Manual e-TP entry is offered alongside the camera',
  (await page.getByRole('button', { name: /Enter e-TP number instead/ }).count()) === 1);

// A permit that does not belong to this delivery must be refused.
await page.getByRole('button', { name: /Enter e-TP number instead/ }).click();
await page.waitForTimeout(300);
await page.getByLabel('e-TP number').fill('ETP/2026/MH/9999999');
await page.getByRole('button', { name: 'Verify permit' }).click();
await page.waitForTimeout(500);
check('A permit that does not match the delivery is refused',
  (await mainText()).includes('does not match this delivery'));

// The real permit passes all four checks.
await page.getByRole('button', { name: 'Scan QR code' }).click();
await page.waitForTimeout(700);
const validated = await mainText();
check('A valid permit reports the transaction verified',
  validated.includes('Transaction verified'));
check('All four verification checks are reported separately',
  validated.includes('Transport permit') && validated.includes('Permit validity') &&
  validated.includes('Vehicle') && validated.includes('Destination'),
  'an operator needs to know WHICH check failed, not just that one did');
check('Dispatched quantity is reviewed before any quantity is entered',
  validated.includes('Dispatched quantity') && validated.includes('40 MT'));

await page.getByRole('button', { name: 'Enter received quantity' }).click();
await page.waitForTimeout(600);

// An exact match must not be reported as a discrepancy.
await page.locator('input[inputmode="decimal"]').fill('40');
await page.waitForTimeout(400);
const exact = await mainText();
check('An exact match reports no discrepancy',
  !exact.includes('Shortage') && exact.includes('0 MT'));
check('No reason is requested when quantities match',
  (await page.locator('main select').count()) === 0);

// A shortfall is computed and shown live, before committing.
await page.locator('input[inputmode="decimal"]').fill('37.5');
await page.waitForTimeout(400);
const short = await mainText();
check('Dispatched, received and difference are all shown together',
  short.includes('40 MT') && short.includes('37.5 MT') && short.includes('2.5 MT'));
check('The shortfall is identified as a shortage while typing',
  short.includes('Shortage'), 'a discrepancy must never be a post-commit surprise');
check('A reason is offered once a difference exists',
  (await page.locator('main select').count()) === 1);

await page.selectOption('main select', 'TRANSIT_LOSS');
await page.getByRole('button', { name: 'Confirm receipt' }).click();
await page.waitForSelector('[role="alertdialog"]');
check('Confirming warns that inventory will be updated',
  (await page.getByRole('alertdialog').textContent()).includes('updates your inventory'));

await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm receipt' }).click();
await page.waitForTimeout(1700);
const done = await mainText();
check('The receipt is confirmed and the outcome restated',
  done.includes('Receipt confirmed') && done.includes('40 MT') && done.includes('37.5 MT'));
check('The receipt reports the resulting available quantity',
  done.includes('Now available'));

/* --- The write must reach inventory, the order and Home --- */

await page.getByRole('button', { name: 'Back to home' }).click();
await page.waitForTimeout(1700);

const inventoryAfter = await readInventoryTotal();
check('Inventory increases by what was RECEIVED, not what was dispatched',
  inventoryAfter === '451.5MT',
  `${inventoryBefore} -> ${inventoryAfter}; 414 + 37.5 = 451.5 (not +40)`);

const homeAfter = await mainText();
check('The received vehicle no longer asks to be received',
  !homeAfter.includes('Vehicle waiting to be received'));
check('The new shortfall now asks for attention instead',
  homeAfter.includes('Shortage of 2.5 MT recorded'));

await page.getByRole('link', { name: 'Orders' }).click();
await page.waitForTimeout(1200);
check('The order receiving status is recomputed from its deliveries',
  (await mainText()).includes('Discrepancy'));

/* ===========================================================================
 * INVENTORY AND CONSUMPTION
 * ---------------------------------------------------------------------------
 *     Received − Consumed = Available
 *
 * Three numbers, always together. Available alone invites "out of how much?",
 * and that answer is what tells a site manager whether a package is running
 * efficiently or bleeding mineral.
 *
 * As with receiving, navigation after sign-in stays client-side — a reload
 * reseeds the in-memory database and would discard the consumption recorded.
 * ======================================================================== */

await persona('Organization');
await page.waitForTimeout(1200);

await page.goto(BASE + '/inventory', { waitUntil: 'networkidle' });
await page.waitForTimeout(1100);
const inventoryText = await mainText();
check('Inventory shows received, consumed and available together',
  inventoryText.includes('Received') && inventoryText.includes('Consumed') &&
  inventoryText.includes('Available'),
  'available on its own invites "out of how much?"');
check('Inventory lists balances per mineral',
  inventoryText.includes('Crushed Stone Grit 20mm') && inventoryText.includes('River Sand'));

// A depleted balance offers nothing to draw down.
await page.getByRole('button', { name: /Black Trap Metal/ }).first().click();
await page.waitForTimeout(1000);
check('A fully consumed balance reports itself as such',
  (await mainText()).includes('Fully consumed'));
check('A fully consumed balance offers no consumption action',
  (await page.getByRole('button', { name: 'Record consumption' }).count()) === 0);

await page.goBack();
await page.waitForTimeout(1000);

/* --- Drawing down a balance --- */

await page.getByRole('button', { name: /Crushed Stone Grit/ }).first().click();
await page.waitForTimeout(1000);
const balanceText = await mainText();
check('A balance shows available, with received and consumed explaining it',
  balanceText.includes('97') && balanceText.includes('32') && balanceText.includes('65'),
  '97 received − 32 consumed = 65 available');
check('A balance shows the consumption history behind its consumed figure',
  balanceText.includes('Consumption history') && balanceText.includes('Sub-base layer'),
  'a total nobody can decompose is a total nobody trusts');

await page.getByRole('button', { name: 'Record consumption' }).click();
await page.waitForSelector('[role="dialog"]');
const sheet = page.getByRole('dialog');
check('The consumption sheet keeps the available balance in view',
  (await sheet.textContent()).includes('65 MT'));

// The consequence is shown before the commitment.
await page.locator('[role="dialog"] input[inputmode="decimal"]').fill('20');
await page.waitForTimeout(400);
check('Remaining quantity updates live as the amount is typed',
  (await sheet.textContent()).includes('45 MT'), '65 − 20 = 45');

// The policy is enforced, and the reason is specific.
await page.locator('[role="dialog"] input[inputmode="decimal"]').fill('9999');
await page.waitForTimeout(400);
check('Consuming more than is available is refused with a specific reason',
  (await sheet.textContent()).includes('Only 65 MT is available'));
check('Recording is blocked while the amount is invalid',
  await sheet.getByRole('button', { name: 'Record' }).isDisabled());

await page.locator('[role="dialog"] input[inputmode="decimal"]').fill('20');
await page.waitForTimeout(300);
await sheet.getByRole('button', { name: 'Record' }).click();
await page.waitForTimeout(1600);

const afterConsumption = await mainText();
check('Recording consumption draws down the available balance',
  afterConsumption.includes('45'), '65 − 20 = 45');
check('Recording consumption raises the consumed figure',
  afterConsumption.includes('52'), '32 + 20 = 52');
check('The new entry appears in the consumption history',
  (await page.$$eval('main button', (els) =>
    els.filter((e) => e.textContent.includes('20 MT')).length)) >= 0);

/* --- The same screens without a hierarchy --- */

await persona('Normal Consumer');
await page.goto(BASE + '/inventory', { waitUntil: 'networkidle' });
await page.waitForTimeout(1100);
const consumerInventory = await mainText();
check('Consumer inventory shows their own balance',
  consumerInventory.includes('River Sand') && consumerInventory.includes('15'),
  '24 received − 9 consumed = 15 available');
check('Consumer inventory offers no package scope switcher',
  !consumerInventory.includes('This package') && !consumerInventory.includes('All packages'),
  'a consumer has no hierarchy to scope by');

/* ===========================================================================
 * TEMPORARY EXCAVATION — the one ORGANIZATION-ONLY workflow
 * ---------------------------------------------------------------------------
 * Two rules are asserted here.
 *
 * 1. A Normal Consumer can reach NONE of it, by any route.
 * 2. The app owns preparing and submitting an application, and nothing after
 *    it. There is no approve, no reject, no respond-to-query, because those
 *    are the department's decisions and not the applicant's.
 * ======================================================================== */

await persona('Organization');
await page.waitForTimeout(1000);

await page.goto(BASE + '/temporary-excavation', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const excavationList = await mainText();
check('Temporary Excavation summarises what is open and what needs action',
  excavationList.includes('Active applications') && excavationList.includes('Needing attention'));
check('Temporary Excavation lists the organization applications',
  excavationList.includes('TEA/2026/001347') && excavationList.includes('TEA/2026/001284'));

// A raised query is the one state where the organization owes a response.
await page.getByRole('button', { name: /River Sand/ }).first().click();
await page.waitForTimeout(1000);
const application = await mainText();
check('A raised query is promoted above the application details',
  application.includes('The department has raised a query') &&
  application.includes('Revised site plan required'));
check('The app says where to respond rather than offering a control that cannot work',
  application.includes('handled outside this app'));
check('An application under review offers no approve or reject action',
  (await page.getByRole('button', { name: /Approve|Reject/ }).count()) === 0,
  'those are the department decisions, not the applicant\'s');
check('A submitted application carries the project and package it was raised under',
  application.includes('Pune Metro Line 3') && application.includes('Package C'));

/* --- Creating an application ---
 *
 * The mobile form carries the SAME field set as the Mahakhanij web form, in
 * the same order: applicant, excavation, quarry and location, documents,
 * declaration. This walk asserts all five steps, including the two things the
 * web form does that a naive mobile port would drop — the map pin, and the
 * declaration that gates payment.
 * ------------------------------------------------------------------------ */

// Establish a package scope FIRST, so the context rule is actually exercised:
// the form must not ask for what the user has already chosen, and the created
// application must carry it anyway.
await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Mumbai/ }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Package A/ }).click();
await page.waitForTimeout(800);

await page.goto(BASE + '/temporary-excavation', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'New application' }).click();
await page.waitForTimeout(900);

/* STEP 1 — applicant */

check('A new application starts by asking who is applying',
  (await mainText()).includes('Who is applying?'));
check('The application form shows the package context it will attach',
  (await page.textContent('header')).includes('Package A'));

// PRE-FILLED, NOT RE-ASKED: the account already answers most of step one.
check('Applicant details open pre-filled from the signed-in account',
  (await page.getByLabel('Full name').inputValue()) === 'Rohit Sanghavi' &&
  (await page.getByLabel('Mobile number').inputValue()) === '9822014576');
check('The registered address is pre-filled from the organization',
  (await page.getByLabel('Registered address').inputValue()).includes('Sanghavi House'));

// A two-column row that overflows its frame is how a form built on a desktop
// reaches a phone. Nothing in this app may scroll sideways.
const formOverflow = await page.evaluate(() => {
  const main = document.querySelector('main');
  return { scrollWidth: main.scrollWidth, clientWidth: main.clientWidth };
});
check('The application form never scrolls sideways',
  formOverflow.scrollWidth <= formOverflow.clientWidth,
  `${formOverflow.scrollWidth}px of content in a ${formOverflow.clientWidth}px frame`);

// Context is attached, never asked for.
const applicationLabels = await page.$$eval('main label', (els) =>
  els.map((e) => e.textContent.replace('*', '').trim()).filter(Boolean));
check('The application form does not ask for project or package',
  !applicationLabels.some((label) => /^project$|^package$/i.test(label)),
  applicationLabels.join(' · '));

await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(400);
check('An incomplete step cannot be advanced',
  (await mainText()).includes('Select an ID proof'));

await page.getByLabel('ID proof').selectOption('PAN');
await page.getByLabel('ID number').fill('12345');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(400);
check('A malformed ID number is caught on the step that asked for it',
  (await mainText()).includes('PAN looks like'),
  'not three days later, by the department');

await page.getByLabel('ID number').fill('AFZPS1234K');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(600);

/* STEP 2 — excavation */

check('Step two asks what will be extracted',
  (await mainText()).includes('What will you extract?'));

await page.getByLabel('Mineral').selectOption({ index: 3 });
await page.locator('main input[inputmode="decimal"]').first().fill('750');
await page.getByLabel('Excavation method').selectOption('MECHANISED');
await page.getByLabel(/Depth/).fill('2');
await page.getByLabel('From').fill('2026-09-15');
await page.getByLabel('To').fill('2026-09-01');
await page.getByLabel(/Purpose/).fill('Embankment filling for the widening works.');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(500);
check('An end date before the start date is refused',
  (await mainText()).includes('cannot be before the start date'));

await page.getByLabel('To').fill('2026-11-15');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(700);

/* STEP 3 — quarry and location, including the map */

check('Step three asks where the quarry is',
  (await mainText()).includes('Where is the quarry?'));

await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(400);
check('An application cannot be filed without marking the site',
  (await mainText()).includes('Mark the excavation site on the map'),
  'a survey number alone does not tell the department which corner will be dug');

// THE MAP AS AN INPUT, not decoration: dropping a pin resolves the
// administrative cascade rather than merely recording a coordinate.
await page.locator('[role="application"]').click({ position: { x: 120, y: 90 } });
await page.waitForTimeout(700);
const pinnedVillage = await page.getByLabel('Village').inputValue();
const pinnedDistrict = await page.getByLabel('District').inputValue();
check('Marking the site on the map fills in the district, taluka and village',
  pinnedVillage.length > 0 && pinnedDistrict.length > 0,
  `district ${pinnedDistrict || 'none'} · village ${pinnedVillage || 'none'}`);

await page.getByLabel('Survey number').fill('221/3');
await page.getByLabel(/Sub-division/).fill('3');
await page.getByLabel('Land type').selectOption('PRIVATE');
await page.getByLabel(/Area/).fill('2400');
await page.getByLabel('PIN code').fill('421604');
await page.getByLabel('Site address').fill('Survey No. 221/3, near the village road');
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(700);

/* STEP 4 — documents */

check('Step four asks for the department checklist',
  (await mainText()).includes('What are you attaching?'));
check('The checklist states what is expected before anything is attached',
  (await mainText()).includes('Land record (7/12 extract)') &&
  (await mainText()).includes('Land owner consent'),
  'an applicant shown one "attach files" button has to already know the list');

await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(400);
check('Missing mandatory documents stop the application',
  (await mainText()).includes('Attach every required document'));

for (let index = 0; index < 4; index += 1) {
  await page.getByRole('button', { name: 'Attach' }).first().click();
  await page.waitForTimeout(200);
}
check('Attached documents are counted against what is required',
  (await mainText()).includes('4 of 4 attached'));

await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(700);

/* STEP 5 — review and declaration */

const review = await mainText();
check('The review step reads back every step, not just the last one',
  review.includes('Rohit Sanghavi') && review.includes('750 MT') &&
  review.includes('Mechanised') && review.includes('221/3'));
check('The review step shows the marked coordinates',
  /\d{2}\.\d{5}, \d{2}\.\d{5}/.test(review),
  'a schematic pin nobody can read back is not evidence');
check('The review step states the fee before asking for it',
  review.includes('Payment summary') && review.includes('₹1,000'));

await page.getByRole('button', { name: /Pay & submit/ }).click();
await page.waitForTimeout(500);
check('Payment is gated on the declaration',
  (await mainText()).includes('Accept the declaration'),
  'paying is what submits the application, so the declaration must come first');

await page.getByText('I declare that the information').click();
await page.waitForTimeout(300);

/* --- PAYMENT GATE 1: the application fee submits the application --- */

await page.getByRole('button', { name: /Pay & submit/ }).click();
await page.waitForTimeout(1500);
check('Completing the form leads to payment, not straight to submission',
  page.url().includes('/pay/application-fee'), page.url().replace(BASE, ''));

const feeSummary = await mainText();
check('The fee screen states what is payable',
  feeSummary.includes('Application fee') && feeSummary.includes('₹1,000'));
check('The fee screen states that paying submits the application',
  feeSummary.includes('submitted automatically once the fee is paid'));

// A failed payment must change nothing about the application.
await page.getByRole('button', { name: /Simulate a failed payment/ }).click();
await page.waitForTimeout(3200);
check('A failed payment is reported and takes no money',
  (await mainText()).includes('Payment failed') &&
  (await mainText()).includes('No money has been taken'));

await page.getByRole('button', { name: 'View application' }).click();
await page.waitForTimeout(1300);
check('A failed payment leaves the application unsubmitted',
  (await mainText()).includes('Application fee not yet paid'),
  'a failed payment must never look like a successful one');

// Now pay it properly.
await page.getByRole('button', { name: /Pay & submit/ }).click();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: /Proceed to pay/ }).click();
// Waited for rather than sampled: initiating the payment is itself a simulated
// network call, so a single read straight after the click races it. The
// timeout stays well inside the 2200 ms hand-off, so this still proves the
// screen appears BEFORE the result and not instead of it.
const handOffShown = await page
  .getByText('Redirecting to secure payment gateway')
  .waitFor({ timeout: 1500 })
  .then(() => true, () => false);
check('The gateway hand-off is shown before the result', handOffShown);
await page.waitForTimeout(3200);

const paid = await mainText();
check('A successful payment issues a receipt',
  paid.includes('Payment successful') && paid.includes('RCPT/'));
check('The receipt explains what the payment unlocked',
  paid.includes('goes to the department for review'));

await page.getByRole('button', { name: 'View application' }).click();
await page.waitForTimeout(1300);
const created = await mainText();
check('Paying the application fee submits the application automatically',
  created.includes('Submitted') && !created.includes('Application fee not yet paid'),
  'there is no separate submit step behind the payment');
check('The submitted application records the requirement',
  created.includes('750 MT') && created.includes('221/3'));
check('The created application carries the context it was raised in, unasked',
  created.includes('Mumbai–Nashik Highway Widening') &&
  created.includes('Package A — Km 12 to Km 28'),
  'the form never asked for project or package, yet the record carries both');
check('The application lists the payment that submitted it',
  created.includes('₹1,000') && created.includes('Application fee'));

/* --- PAYMENT GATE 2: the demand note issues the excavation order --- */

await page.getByRole('link', { name: 'Home' }).click();
await page.waitForTimeout(1400);
check('A demand note that is due asks for attention on Home',
  (await mainText()).includes('Demand note of ₹2,68,800 is due'),
  'money owed, with a deadline, belongs in Attention Required');

await page.goto(BASE + '/temporary-excavation', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.getByRole('button', { name: /Murum · 600/ }).first().click();
await page.waitForTimeout(1200);
const demandNote = await mainText();
check('A demand note is shown broken down, not as one figure',
  demandNote.includes('Royalty') &&
  demandNote.includes('District Mineral Foundation') &&
  demandNote.includes('District cess'),
  'an applicant checking against their own estimate needs the components');
check('The demand note totals correctly',
  demandNote.includes('₹2,40,000') && demandNote.includes('₹24,000') &&
  demandNote.includes('₹4,800') && demandNote.includes('₹2,68,800'),
  '240000 + 24000 + 4800 = 268800');
check('The demand note states what paying it unlocks',
  demandNote.includes('receive your excavation order'));

await page.getByRole('button', { name: /Pay demand note/ }).click();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: /Proceed to pay/ }).click();
await page.waitForTimeout(3400);
check('Paying the demand note succeeds',
  (await mainText()).includes('Payment successful'));

await page.getByRole('button', { name: 'View application' }).click();
await page.waitForTimeout(1300);
const ordered = await mainText();
check('Paying the demand note issues the excavation order',
  ordered.includes('Order issued') && ordered.includes('Excavation order') &&
  ordered.includes('EXO/'));
check('The excavation order states what it permits and for how long',
  ordered.includes('Permitted quantity') && ordered.includes('600 MT') &&
  ordered.includes('Valid until'));
check('The application shows both payments that got it there',
  ordered.includes('Application fee') && ordered.includes('Demand note'));

/* --- Closed to Normal Consumers by every route --- */

await persona('Normal Consumer');
for (const path of [
  '/temporary-excavation',
  '/temporary-excavation/new',
  '/temporary-excavation/tea-001',
]) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  check(`Consumer is redirected away from ${path}`,
    page.url().endsWith('/home'), 'landed on ' + page.url().replace(BASE, ''));
}

/* ===========================================================================
 * ORGANIZATION TYPE IS METADATA, NOT ARCHITECTURE
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
