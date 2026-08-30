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

## Route protection

| Route | Guard |
|---|---|
| `/prototype/persona` | none (prototype entry point) |
| `/home` | session |
| `/projects` | session + `VIEW_PROJECTS` |
| `/mineral` | session + `VIEW_MINERAL_TAB` |
| `/orders` | session |
| `/temporary-excavation` | session + `TEMPORARY_EXCAVATION` |
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

## Out of scope entirely

Supervisor and Site Agent workflows belong to separate existing applications.
Supervisor details may be displayed as read-only context on a Package. No
supervisor or site-agent login, dashboard, navigation, or workflow exists in
this app.
