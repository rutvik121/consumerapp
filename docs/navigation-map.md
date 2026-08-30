# Navigation map

Route paths are defined once in `src/navigation/routes.ts`. Screens navigate
with those builders, never with hand-written strings.

## Shell

```
AppShell                         device frame · role-driven tabs · overlay root
└── RequireSession               no session → /prototype/persona
    └── RoleGuard(capability)    no capability → /home
        └── Screen               app bar · scrollable body · sticky footer
```

## Authentication (Increment 1)

```
/  Splash
   ├── session?  → /home
   └── no session → /welcome
                      ├── Sign in       → /login    → /verify ─┐
                      └── Create account → /register → /verify ┴→ /home
```

One OTP screen serves both intents. Verifying a mobile number is the same step
whether signing in or registering; only what happens after verification differs.
Building two near-identical screens would guarantee they drift apart.

`/verify` requires a verification actually in progress. The auth flow store is
deliberately **not** persisted, so refreshing there sends the user back to
`/login` — which is what real authentication does when a verification expires.

Registration establishes the user type in **step 1 of 3**, because that choice
determines what steps 2 and 3 need to ask:

| Step | Normal Consumer | Organization |
|---|---|---|
| 1 | User type | User type |
| 2 | Name, mobile | Name, mobile |
| 3 | Delivery location | Organization name, type, registration number |

## Routes

| Path | Screen | Access |
|---|---|---|
| `/` | Splash | public |
| `/welcome` | Welcome | **no** session |
| `/login` | Login | **no** session |
| `/register` | Register | **no** session |
| `/verify` | OTP verification | no session + pending verification |
| `/prototype/persona` | Persona picker *(prototype shortcut)* | **no** session |
| `/home` | Home, resolved by role | session |
| `/projects` | Projects | `VIEW_PROJECTS` |
| `/mineral` | Mineral | `VIEW_MINERAL_TAB` |
| `/orders` | Orders | session |
| `/temporary-excavation` | Temporary Excavation | `TEMPORARY_EXCAVATION` |
| `/more` | More | session |
| `*` | Not found | session |

An authenticated user is redirected away from every authentication route —
otherwise an old link to `/login` would offer a sign-in form for an account
they are already inside.

| `/projects/:projectId` | Project Details | `VIEW_PROJECTS` |
| `/projects/:projectId/packages/:packageId` | Package Details | `VIEW_PACKAGES` |
| `/stock-points` | Find stock point | session |
| `/stock-points/:stockPointId` | Stock Point Details | session |
| `/stock-points/:stockPointId/enquiry` | Mineral Enquiry | session |
| `/enquiries` | Enquiries | session |
| `/enquiries/:enquiryId` | Enquiry Details | session |
| `/receive` | Receive mineral | session |
| `/inventory` | Inventory | session |

## Where context is set

```
/projects                       browse
/projects/:id                   → sets the ACTIVE PROJECT
/projects/:id/packages/:id      → sets the ACTIVE PACKAGE  ← scope complete
```

Navigating into a scope is what selects it. Making the user confirm it
afterwards with a separate picker would be exactly the repetition the product
context rules out. Switching project clears any package chosen under the old
one, because a package only has meaning inside its own project.

From Package Details, every mineral operation inherits Project + Package and
never asks again.

## Mineral acquisition

```
Find Stock Point → Stock Point Details → Mineral Enquiry → Enquiry Details
```

Raising an enquiry is nested under a stock point (`/stock-points/:id/enquiry`)
because an enquiry only exists in relation to a source. There is no route that
opens a blank enquiry form, which is what keeps the flow from behaving like a
generic "create record" screen.

For an Organization the form is reached with Project, Package and Stock Point
already known, and asks for none of them. For a Normal Consumer those fields do
not exist at all.

## Reserved for later increments

Defined in `routes.ts`, not yet registered:

| Path | Increment |
|---|---|
| `/orders/:orderId` | 4 |
| `/deliveries/:deliveryId/tracking` | 4 |
| `/receive/:deliveryId` | 5 |

## Organization journey

```
Home → Projects → Project Details → Packages → Package Details
                                                     │
                                    (operating context is set here)
                                                     ↓
   Find Stock Point → Stock Point Details → Mineral Enquiry → Order
        → Track Vehicle → Receive Mineral → Scan QR → Validate
        → Confirm Quantity → Inventory → Consumption
```

## Normal Consumer journey

```
Home → Find Stock Point → Stock Point Details → Mineral Enquiry → Order
     → Track Delivery → Receive Mineral → Scan QR → Confirm Quantity
     → Inventory → Consumption
```

Same screens, same components. The only difference is that no Project or
Package context is attached or displayed.
