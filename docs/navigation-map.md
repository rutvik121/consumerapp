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

## Reserved for later increments

Already defined in `routes.ts`, not yet registered:

| Path | Increment |
|---|---|
| `/projects/:projectId` | 2 |
| `/projects/:projectId/packages/:packageId` | 2 |
| `/stock-points`, `/stock-points/:stockPointId` | 3 |
| `/enquiries`, `/enquiries/:enquiryId` | 3 |
| `/orders/:orderId` | 4 |
| `/deliveries/:deliveryId/tracking` | 4 |
| `/receive`, `/receive/:deliveryId` | 5 |
| `/inventory` | 6 |

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
