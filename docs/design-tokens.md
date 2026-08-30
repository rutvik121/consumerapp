# Design tokens

Defined once in `src/design-system/tokens.css`. Every token is emitted as a CSS
custom property and as a Tailwind utility, so there is exactly one place to
change a design decision.

Tailwind's default palette is **wiped** (`--color-*: initial`). The palette is
exactly what is listed below. If a colour is not defined here it must not appear
in the UI.

## Colour

**Neutral** — cool slate, carries ~90% of the interface.
`0 · 25 · 50 · 100 · 200 · 300 · 400 · 500 · 600 · 700 · 800 · 900`
from `#ffffff` to `#182027`.

**Primary** — deep institutional blue, `50–900`, base `--color-primary-500:
#2c6e9e`. Chosen to read as government-connected and trustworthy rather than
promotional. Deliberately not a saturated consumer-app blue.

**Status** — exactly three hues, never decorative:

| Hue | Base | Meaning |
|---|---|---|
| success | `#1e7f4f` | verified · received · available · approved · operational |
| warning | `#b26b00` | attention required · awaiting action · discrepancy · under review |
| danger | `#c0392f` | critical · shortage · failed verification · rejected |

**Semantic roles** — prefer these over raw scale values in components:

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `#f5f7f9` | page background |
| `--color-surface` | `#ffffff` | content surface |
| `--color-surface-sunken` | `#eceff3` | inset area |
| `--color-line` | `#dde3ea` | hairline separator |
| `--color-line-strong` | `#c6cfd9` | input border |
| `--color-ink` | `#182027` | primary text |
| `--color-ink-secondary` | `#55636f` | supporting text |
| `--color-ink-muted` | `#71808f` | metadata, placeholders |
| `--color-ink-inverse` | `#ffffff` | text on dark surfaces |

Status colour is never the only signal — a `StatusBadge` always states the
status in words.

## Typography

System font stack: renders natively on device, no web-font payload, and keeps
the prototype feeling like a real mobile app.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 28 / 34 | 700 | quantities, metric values |
| `title-lg` | 20 / 26 | 600 | screen titles |
| `title` | 17 / 22 | 600 | section and row titles |
| `body-lg` | 16 / 23 | 400 | emphasised body |
| `body` | 15 / 21 | 400 | default |
| `body-sm` | 13 / 18 | 400 | supporting |
| `label` | 13 / 16 | 500 | form labels, badges |
| `caption` | 12 / 16 | 400 | metadata |
| `overline` | 11 / 14 | 600 | section headers, uppercase, +0.06em |

Quantities and identifiers use the `.tabular` utility (`tabular-nums`) so
columns of numbers align when scanned quickly.

## Spacing · radius · elevation

4px base grid; standard screen gutter is 16px (`px-4`).

Radius: `xs 4 · sm 6 · md 10 · lg 14 · xl 20 · 2xl 28 · full`.

Elevation is deliberately restrained — default to hairline separation, not
stacked cards:

| Token | Use |
|---|---|
| `--shadow-e1` | a surface that must lift off the canvas |
| `--shadow-e2` | bottom sheets, sticky bars |
| `--shadow-e3` | modal dialogs |

## Touch targets

Field usage means gloved hands, sunlight, and movement.

| Token | Value |
|---|---|
| `--touch-min` | 44px — hard floor for anything tappable |
| `--touch-comfortable` | 48px |
| `--control-h-sm/md/lg` | 36 / 44 / 52px |

The `.touch-target` utility guarantees the floor regardless of visual size.
`scripts/verify-foundation.mjs` asserts it against the running app.

## Flutter mapping

| Token group | Flutter |
|---|---|
| primary + neutral + status | `ColorScheme` |
| semantic roles | `ThemeData` surface/onSurface + a theme extension |
| type scale | `TextTheme` |
| radius | `BorderRadius` constants |
| elevation | `BoxShadow` constants (not Material elevation) |
| touch targets | `MaterialTapTargetSize` + explicit `minimumSize` |

## Not implemented

**Dark mode.** V1 is light-only by decision, not omission. The token structure
makes it a matter of redefining the semantic roles under a media query.

**Marathi.** English-only for V1. See `src/content/` for the localization seam.
