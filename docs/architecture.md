# Architecture

A high-fidelity functional prototype of the Mahakhanij Consumer App V1, built in
React + TypeScript. It exists to demonstrate the product, validate UX, and serve
as an implementation reference for the production Flutter application.

## Layers

Dependencies point downward only. Nothing below imports from anything above it.

```
screens/          one file per route; composes the design system
   │
   ├── navigation/     routes, role-driven tabs, guards, app shell
   ├── design-system/  tokens + reusable components (no product knowledge)
   ├── state/          session + organization context
   │
   ├── rules/          business rules as pure functions
   └── data/           repositories → in-memory db → fixtures
            │
            └── domain/   product concepts as TypeScript types
```

| Layer | Owns | Must never |
|---|---|---|
| `domain/` | The twelve product entities | Import UI, state, or data |
| `rules/` | Every business rule, once | Import React or any store |
| `data/` | Mock records, repository access, `useAsync` | Be imported by a screen's render body directly |
| `state/` | Who is signed in, what scope, auth in flight | Cache operational data |
| `design-system/` | Visual vocabulary | Know what a Package is |
| `navigation/` | Paths, tabs, guards, shell | Contain product screens |
| `screens/` | One route each | Define new visual patterns or restate rules |
| `content/` | Shared UI text | Hold screen-specific prose |
| `prototype/` | Demo scaffolding | Be imported by product code |

## The rules that shaped it

**One application, two experiences.** Role never forks the route table or the
component tree. It selects a tab set, gates a route, and decides whether
context is attached. `HomeScreen` is one route that resolves by role.

**Access control has one source.** The capability matrix in `rules/access.ts` is
read by navigation, by route guards, and by screens. A route and its tab cannot
disagree about who may see something, because they ask the same question.

**Context travels, it is never re-asked.** `useOperatingContext()` resolves
Organization → Project → Package into one object that flows into every
operational screen. No screen asks for scope it has already been given.

**Provisional logic is quarantined.** Anything not confirmed by the Project
Context lives in exactly one function or one type, marked with the open question
it depends on. Replacing an assumption is a single-file change, never a search
across screens.

**The mock layer behaves like a network.** Repositories are async and slow
enough to be perceptible, so screens are built with loading and error states
from the start instead of retrofitting them later. `data/client.ts` is the only
seam that changes when a real API arrives, and every screen reads through
`useAsync`, so the three states are handled consistently rather than each
screen inventing its own.

**Screens compose, they do not derive.** Filtering, summing, sorting and
prioritising are product rules and live in `rules/`. A screen that needs
several sources composes them in a co-located read model — see
`screens/organization/useOrganizationOverview.ts`, which is also the
specification for the dashboard endpoint a real backend would expose.

## Mapping to Flutter

| Prototype | Production Flutter |
|---|---|
| `domain/*.ts` types | Dart model classes; discriminated unions → sealed classes |
| `rules/*.ts` pure functions | Plain Dart functions or a domain service |
| `data/repositories` | Repository classes over an API client |
| `data/client.ts` | The HTTP client |
| Zustand stores | Provider / Riverpod / Bloc |
| `useOperatingContext()` | A scoped provider read by operational screens |
| `navigation/routes.ts` | The Navigator / GoRouter route table |
| `navigation/tabs.ts` | `BottomNavigationBar` items, chosen by user type |
| `RoleGuard` | A route redirect or guard |
| `design-system/tokens.css` | `ThemeData` — `ColorScheme` + `TextTheme` |
| `design-system/components` | Reusable widgets |
| `Screen.tsx` | `Scaffold` with `AppBar` and body |

## Not yet built

State that will be added when the increment that needs it arrives — not before:

- Repository mutations for enquiries (Increment 3) and receipts (Increment 5).
  `authRepository.registerAndVerify` is the first mutation and already writes
  to the in-memory database.
- Persistence of operational data (Increment 5, when the first real mutation exists)
- Any form state (screen-local `useState`, not a store)
