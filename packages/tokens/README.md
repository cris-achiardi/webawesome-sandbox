# @ws/tokens

Design tokens authored in **W3C DTCG** format (`$value` / `$type`) and built with
**Style Dictionary v5** into framework-agnostic outputs — with **multi-brand** support.

> ⚠️ **Scaffold only.** Token values are **placeholders** (marked `PLACEHOLDER` in their
> `$description`). They exist to prove the pipeline, not as a real palette. Replace when
> the real tokens land.

## Token tiers

```
core      brand-agnostic primitives (palette, spacing, type scale)   → :root
brands/*  semantic tokens that REFERENCE core, one set per brand      → .wa-theme-<brand>
```

Only the **semantic** tier differs per brand. Core primitives are shared, and the
Web Awesome bridge (`theme.css`) is structural — so a brand swap only changes what
`--color-brand-primary` (etc.) resolves to.

## Layout

```
tokens/
├─ core/                      # shared primitives
│  ├─ color.json              # blue / green / gray palettes
│  ├─ dimension.json          # spacing + radius
│  └─ typography.json         # sans + serif stacks, sizes, weights
└─ brands/
   ├─ acme/semantic.json      # blue + sans  → color.brand.primary = {color.blue.500}
   └─ globex/semantic.json    # green + serif → color.brand.primary = {color.green.500}
build.js                      # brand-aware build (Style Dictionary Node API)
theme.css                     # core + brand layers + the --wa-* bridge
dist/css/
├─ core.css                   # :root { --color-blue-500: …; --space-md: …; }
├─ acme.css                   # .wa-theme-acme   { --color-brand-primary: var(--color-blue-500); … }
└─ globex.css                 # .wa-theme-globex { --color-brand-primary: var(--color-green-500); … }
dist/js/{core.js, core.d.ts}  # primitives for JS/TS consumers
```

## Build

```bash
npm run build        # node build.js  (or: npm run build:tokens from repo root)
```

`build.js` builds core once at `:root`, then loops `BRANDS` — feeding core in as
source so `{color.blue.500}` references resolve, but `filter`-ing the output to each
brand's own tokens and emitting them under `selector: .wa-theme-<brand>` with
`outputReferences: true` (so they stay `var(--…)` refs into `core.css`).

**Add a brand:** drop `tokens/brands/<name>/*.json` and add `<name>` to `BRANDS` in `build.js`.

## How multi-brand theming works at runtime

1. `core.css` defines primitives at `:root` (inherited everywhere).
2. Each `.wa-theme-<brand>` block sets our semantic tokens for that brand.
3. `theme.css` bridges onto Web Awesome. WA's brand color is a **ramp**
   (`--wa-color-brand-05…95`) that all brand UI derives from, so each scope remaps the
   **whole ramp** (Acme→blue, Globex→green) — like WA's own `.wa-brand-*` utilities —
   plus the structural bits (fonts, radius) shared by every brand. WA's defaults are in
   `@layer wa-color-variant`, so this unlayered bridge wins.

Switch brands by toggling a `wa-theme-<brand>` class. Because CSS custom properties
resolve at use-time and pierce shadow DOM, every `<wa-*>` in that scope re-themes
live — and two brands can render on the same page in separate subtrees.

```html
<html class="wa-theme-globex wa-light">   <!-- whole app = Globex -->

<div class="wa-theme-acme">…</div>          <!-- this subtree = Acme -->
<div class="wa-theme-globex">…</div>        <!-- …next to a Globex subtree -->
```
