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
  (await mainText()).includes('Organization name'));
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
await page.getByRole('radio', { name: /Normal Consumer/ }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Full name').fill('Duplicate Person');
await page.locator('input[type="tel"]').fill('9812345678');
await page.getByRole('button', { name: 'Continue' }).click();
check('Consumer registration asks for a delivery location, not organization details',
  (await mainText()).includes('Where should mineral be delivered?'));
await page.getByLabel('Address').fill('12 Civil Lines');
await page.getByLabel('Taluka').fill('Nagpur');
await page.getByLabel('District').fill('Nagpur');
await page.getByLabel('PIN code').fill('440001');
await page.getByRole('button', { name: /Verify your number/ }).click();
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
