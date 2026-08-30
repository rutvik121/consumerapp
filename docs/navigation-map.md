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

## Built in Increment 0

| Path | Screen | Access |
|---|---|---|
| `/prototype/persona` | Persona picker *(prototype)* | public |
| `/` | → `/home` | session |
| `/home` | Home, resolved by role | session |
| `/projects` | Projects | `VIEW_PROJECTS` |
| `/mineral` | Mineral | `VIEW_MINERAL_TAB` |
| `/orders` | Orders | session |
| `/temporary-excavation` | Temporary Excavation | `TEMPORARY_EXCAVATION` |
| `/more` | More | session |
| `*` | Not found | session |

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
