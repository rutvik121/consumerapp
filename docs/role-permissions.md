# Role permission matrix

There is **one application** with two authenticated experiences. This table is
the complete specification. It is generated from — and enforced by —
`src/rules/access.ts`.

## Capabilities

| Capability | Normal Consumer | Organization |
|---|:---:|:---:|
| `VIEW_PROJECTS` | ✗ | ✓ |
| `VIEW_PACKAGES` | ✗ | ✓ |
| `USE_ORGANIZATION_CONTEXT` | ✗ | ✓ |
| `TEMPORARY_EXCAVATION` | ✗ | ✓ |
| `VIEW_ORGANIZATION` | ✗ | ✓ |
| `VIEW_MINERAL_TAB` | ✓ | ✗ |

## Navigation

| | Normal Consumer | Organization |
|---|---|---|
| Tabs | Home · Mineral · Orders · More | Home · Projects · Orders · More |

Projects and Packages never appear for Normal Consumers.
Temporary Excavation appears in neither tab bar — it is reached from within the
Organization experience.

## Where user type is established

Registration, step 1. It is the first question asked, because it determines the
entire post-login experience and what the rest of registration needs to
collect. It is not offered as an editable setting afterwards.

## Route protection

| Route | Guard |
|---|---|
| `/` | none — splash resolves the session |
| `/welcome`, `/login`, `/register` | **no** session |
| `/verify` | no session + a verification in progress |
| `/prototype/persona` | **no** session (prototype shortcut) |
| `/home` | session |
| `/projects` | session + `VIEW_PROJECTS` |
| `/projects/:projectId` | session + `VIEW_PROJECTS` |
| `/projects/:projectId/packages/:packageId` | session + `VIEW_PACKAGES` |
| `/mineral` | session + `VIEW_MINERAL_TAB` |
| `/orders` | session |
| `/temporary-excavation` | session + `TEMPORARY_EXCAVATION` |
| `/temporary-excavation/new` | session + `TEMPORARY_EXCAVATION` |
| `/temporary-excavation/:applicationId` | session + `TEMPORARY_EXCAVATION` |
| `/more` | session |

A user without the capability is **redirected to Home**, not shown a "not
available" message. The product rule is that Normal Consumers must never *see*
Temporary Excavation; an explicit denial screen would still reveal that the
feature exists.

## Field-level visibility

Project and Package must not appear anywhere in the Normal Consumer experience:
enquiry, order, delivery, tracking, receiving, inventory, consumption. In the
domain types these fields are **optional and absent** for consumer records — not
present-but-empty — so a consumer record cannot accidentally render them.

## Organization type is metadata, not architecture

Government departments, builders, contractors and any other organization type
share **one identical experience**. There is no Builder App, no Contractor App,
no Government App — and structurally there cannot be one.

`organization.type` appears in exactly four places in the codebase:

| Location | Role |
|---|---|
| `domain/organization.ts` | the type union |
| `domain/organization.ts` | the field on the entity |
| `content/en.ts` | a table of display labels |
| `screens/MoreScreen.tsx` | renders that label in one subtitle |

There is no conditional anywhere that reads it — no `if`, no `switch`, no route
or navigation decision. `scripts/verify-foundation.mjs` enforces this by cycling
the organization through all four types and asserting that navigation, route
access and screen content are identical each time, with only the subtitle label
changing.

Adding a single `if (organization.type === 'GOVERNMENT')` to any screen turns
that suite red.

## Out of scope entirely

Supervisor and Site Agent workflows belong to separate existing applications.
Supervisor details may be displayed as read-only context on a Package. No
supervisor or site-agent login, dashboard, navigation, or workflow exists in
this app.
