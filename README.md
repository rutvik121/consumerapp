# Mahakhanij Consumer App — V1 Prototype

A high-fidelity functional prototype of the Mahakhanij Consumer App, the
destination-and-consumption side of the Government of Maharashtra's minor
mineral ecosystem.

> **This is a prototype, not the production application.** The production build
> will be implemented in Flutter/Dart by a separate team. This repository exists
> to demonstrate the product, validate UX, and serve as an implementation
> reference: screens, navigation, user flows, business rules, permissions, data
> requirements, context passed between screens, and states.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | Types only |
| `npm run preview` | Serve the production build |
| `npm run build:standalone` | Single-file static build (hash routing) |

Open it on a phone, or in a desktop browser where it renders inside a device
frame.

Sign in with a seeded account — **9822014576** (Organization) or
**9730845120** (Normal Consumer) — using code **123456**. Any other code shows
the error state. Or create a new account and choose your own user type.

A persona shortcut at `/prototype/persona` skips authentication during review.

## The product in one paragraph

Mahakhanij tracks minor minerals from quarry to destination using electronic
transport permits (e-TP) carrying source, destination, vehicle, mineral,
quantity and a unique QR code. This app owns the destination side: discover a
stock point, raise a mineral enquiry, follow the order, track the vehicle,
verify the permit on arrival, record the actual quantity received, surface any
discrepancy, and manage inventory through to consumption. It is **not** a
mineral marketplace.

## Two experiences, one application

| | Normal Consumer | Organization |
|---|---|---|
| Scope | Flat — mineral belongs to the person | `Organization → Project → Package` |
| Tabs | Home · Mineral · Orders · More | Home · Projects · Orders · More |
| Temporary Excavation | Never | Yes |

The operational lifecycle is identical for both. Role selects a tab set, gates
a route, and decides whether Project/Package context is attached — it never
forks the screens. See [`docs/role-permissions.md`](docs/role-permissions.md).

## Layout

```
src/
├── domain/         12 product entities as TypeScript types
├── rules/          business rules as pure functions (access, quantity,
│                   inventory, discrepancy, status presentation, geo)
├── data/           fixtures → in-memory db → async repositories
├── state/          session + organization context + operating context
├── design-system/  tokens.css + reusable components
├── navigation/     routes, role-driven tabs, guards, app shell, screen frame
├── content/        centralized UI text (localization seam)
├── screens/        one file per route
├── app/            router + application root
└── prototype/      demo scaffolding — deleted before hand-off
```

Full detail in [`docs/architecture.md`](docs/architecture.md).

## Documentation

| Document | Contents |
|---|---|
| [architecture.md](docs/architecture.md) | Layers, dependency rules, Flutter mapping |
| [domain-model.md](docs/domain-model.md) | Entities, relationships, modelling decisions |
| [role-permissions.md](docs/role-permissions.md) | The complete permission matrix |
| [navigation-map.md](docs/navigation-map.md) | Route table and user journeys |
| [design-tokens.md](docs/design-tokens.md) | Colour, type, spacing, elevation, touch |
| [src/prototype/README.md](src/prototype/README.md) | What to delete before hand-off |

## Build status

| Increment | Scope | Status |
|---|---|---|
| 0 | Architecture and design system | **Done** |
| 1 | Authentication and the role split | **Done** |
| 2 | Organization structure and context | **Done** |
| 3 | Mineral acquisition | **Done** |
| 4 | Orders and transport | **Done** |
| 5 | Receiving | **Done** |
| 6 | Inventory and consumption | Next |
| 7 | Temporary Excavation | |
| 8 | Quality and hand-off | |

Routes not yet built render an honest scaffold marker naming the increment that
builds them and what will be on them. There are no placeholder dashboards.

## Verifying the foundation

`scripts/verify-foundation.mjs` asserts the Increment 0 guarantees against the
running app — routing, role-driven navigation, route-level access control,
session persistence, mobile layout, touch targets and design tokens.

```bash
npm run build
npx vite preview --port 4173 --host 127.0.0.1 &
npm i -D playwright        # not a project dependency
node scripts/verify-foundation.mjs
```

143 checks, covering authentication end to end, the Organization Home, the
project hierarchy, mineral acquisition through to a created enquiry, orders
through to vehicle tracking, and receiving through to the inventory it
updates. The
access-control and context assertions matter most, because they cover the
rules most likely to break quietly months from now:

- *"A Normal Consumer must never reach Temporary Excavation"* — asserted by
  direct-URL navigation, not just by the tab bar.
- *"Organization type is metadata, not architecture"* — the organization is
  cycled through Builder, Contractor, Government and Other, and the entire
  signed-in experience must come back identical apart from the one subtitle
  that displays the type by design. A newly registered **Government**
  organization is also checked end to end, from registration through to
  reaching Temporary Excavation.

- *"Do not ask for context the app already has"* — opening a project sets it,
  opening a package completes it, the scope survives navigating away, and
  switching project clears a package chosen under the old one. The enquiry
  form is asserted not to ask for project, package or stock point, and the
  enquiry it creates is asserted to carry all three anyway.
- *"This is not a marketplace"* — no cart, checkout, price or "book" anywhere
  in the acquisition flow.
- *"Tracking is operational, not a courier ETA"* — the screen is asserted to
  answer every question the product context lists, and route progress is
  asserted to be derived from reported position rather than a timer.
- *"Do not bury discrepancies"* — dispatched, received and difference are
  asserted to appear together and live, before anything is committed, and
  inventory is asserted to increase by what was **received**, never by what
  was dispatched.

These are executable checks rather than notes in a document. The second has
been verified to fail correctly: injecting a single
`organization.type !== 'GOVERNMENT'` condition into one screen turns the suite
red.

## Open questions

Eleven product questions are unresolved and are **not** silently invented. Each
provisional decision is isolated to one type or one function and marked with the
question it depends on — see the table in
[`docs/domain-model.md`](docs/domain-model.md#provisional--confirm-before-the-increment-that-uses-it).

## Decisions taken for V1

- **English only.** Marathi is not implemented; the seam for it is in
  `src/content/`.
- **Light theme only**, by decision rather than omission.
- **No pricing or payment** anywhere — consistent with "not a marketplace".
- **QR scanning is simulated** (mock scan plus manual permit entry). The
  *validation logic* is real.
- **Operational data is in-memory** and resets on reload. Session and
  organization context persist, so a refresh keeps you signed in and in scope.
  This matters when testing: a receipt or a registration survives client-side
  navigation but not a page reload.
