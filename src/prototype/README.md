# `src/prototype/` — demo scaffolding, not product

Everything in this folder exists to make the prototype reviewable. None of it
is part of the product being specified, and all of it is deleted before
production hand-off.

| File | Purpose | Replaced by |
|---|---|---|
| `personas.ts` | The two demo personas | Real accounts (Increment 1) |
| `PersonaPickerScreen.tsx` | Temporary entry point | Splash → Login → OTP (Increment 1) |
| `PrototypeBar.tsx` | Persona switcher strip | Nothing — deleted |
| `FoundationCheck.tsx` | QA panel for role + context | Nothing — deleted |

## To remove entirely

1. Delete this folder.
2. Remove `<PrototypeBar />` from `src/navigation/AppShell.tsx`.
3. Remove the persona route from `src/app/router.tsx`.
4. Remove the prototype block from `src/screens/MoreScreen.tsx`.
5. Remove the `prototype` key from `src/content/en.ts`.

Nothing else in the application imports from here — that separation is
intentional and should be preserved.
