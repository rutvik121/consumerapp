# Domain model

The twelve V1 entities, defined in `src/domain/`. These are product concepts and
are independent of any screen or component.

## Relationships

```
User ─┬─ NormalConsumerUser          flat: no hierarchy
      └─ OrganizationUser ── Organization
                                 │
                                 └── Project ── Package ◄── operational scope
                                                   │
                                                   │ (context flows down)
                                                   ▼
StockPoint ──► Enquiry ──► Order ──► Delivery ──► DeliveryReceipt
    │             │           │          │              │
  Mineral ────────┴───────────┴──────────┘              ▼
                                                InventoryBalance
                                                        │
                                                        ▼
                                                ConsumptionEntry

Organization ──► TemporaryExcavationApplication   (organization only)
```

Follow any id in the fixtures and it resolves in another file. That connected
graph is what lets the prototype behave like a real application.

## Traceability chain

```
Requirement → Enquiry → Order → Delivery (e-TP + Vehicle)
            → Tracking → Destination → Verification → Receipt
            → Inventory → Consumption
```

`Delivery.permit` (the e-TP) is the pivot: it carries source quarry,
destination, vehicle, mineral, permitted quantity and the QR payload that
receiving scans. A delivery is never a generic shipment.

## Key modelling decisions

**Quantity is never a bare number.** `{ value, unit }` everywhere, with all
arithmetic in `rules/quantity.ts` so a unit mismatch throws rather than silently
producing a wrong figure. These are compliance numbers.

**Organization context is optional and absent.** `organizationId`, `projectId`
and `packageId` are optional on Enquiry, Order and Delivery. Consumer records
omit them entirely, so consumer screens cannot render them by accident. Every
enquiry is built through `enquiryScopeFor()` in `rules/enquiry.ts` — the single
point where operating context becomes record data, and the reason a Normal
Consumer cannot acquire these fields even by mistake.

**Inventory scope is a discriminated union.** `InventoryScope` is either
`PACKAGE` (organization) or `CONSUMER`. One inventory concept, two scopes —
which is why inventory is not built twice. Maps to a Dart sealed class.

**Available quantity is derived, never stored.** `Received − Consumed =
Available`, computed by `computeAvailableQuantity()`. A stored value could drift
from the invariant.

**`DeliveryReceipt` stores the derived difference.** Unlike available quantity,
the difference is persisted, because a receipt is an immutable audit record of
what was asserted at the moment of receiving.

**Distance is not on the entity.** "How far is it" only has meaning relative to
a destination, so `StockPointSearchResult` carries it and the repository
computes it against the caller's operating context.

## Provisional — confirm before the increment that uses it

| Item | Open question | Needed by |
|---|---|---|
| All status vocabularies | Real status values not yet supplied | Increment 3 |
| `EnquiryStatus.CONVERTED_TO_ORDER` | Is enquiry → order automatic, or quoted/confirmed first? | Increment 3 |
| No price fields anywhere | Is pricing in scope at all? | Increment 3 |
| `TemporaryExcavationApplication` fields | Real form field list unknown | Increment 7 |
| `DiscrepancyReason` | Is a reason required? Rejectable? Downstream effect? | Increment 5 |
| `MineralUnit` includes BRASS/CUM | Maharashtra often uses brass for sand/aggregate | Increment 3 |
| `NormalConsumerUser.deliveryAddress` | What is the real consumer destination concept? | Increment 3 |
| Single user per organization | Are there internal organization roles? | Increment 2 |

Each is isolated to one type or one function. Replacing an assumption is a
single-file change.
