# Web Awesome Sandbox

A throwaway monorepo to evaluate whether [**Web Awesome**](https://webawesome.com/docs) (the web-component
library from the Font Awesome / Shoelace team) is a viable foundation for a new **Angular + Vue** design
system — and to scaffold a **W3C DTCG + Style Dictionary** design-token pipeline alongside it.

> **Goal:** install Web Awesome as-is, wire it into both frameworks, and see how cleanly its custom elements
> bind (props, events, two-way binding, imperative methods). Then decide: **use as-is / cherry-pick / reference**.

## What's inside

| Path | What it is |
| --- | --- |
| `packages/tokens` | Design tokens in **W3C DTCG** format, built with **Style Dictionary v5** → CSS variables + JS/TS. **Multi-brand** (core + per-brand layers). Scaffold only (placeholder values — real tokens TBD). |
| `apps/vue-sandbox` | Vite + Vue 3 app importing `wa-*` components to test bindings + a live **brand switcher**. |
| `apps/angular-sandbox` | Angular app importing the same `wa-*` components — focus on `[(ngModel)]` / two-way binding + brand switcher. |
| `apps/storybook` | Web-components Storybook to browse components, with a **brand** toolbar picker. |

## Key facts (Web Awesome)

- **Package:** `@awesome.me/webawesome` (pinned to `3.9.0`). **Core is MIT / free** — no license token. (Pro is a paid add-on; not used here.)
- **Tokens:** exposed as CSS custom properties prefixed `--wa-`, overridable with plain CSS loaded *after* `webawesome.css`.
- **Vue:** native custom elements + Vite `isCustomElement: (t) => t.startsWith('wa-')`. No official Vue wrapper.
- **Angular:** native custom elements + `CUSTOM_ELEMENTS_SCHEMA` + styles in `angular.json`. No official Angular wrapper.
- **Node ≥ 22 required** (Style Dictionary v5).

## Multi-brand theming

Two brands ship in this sandbox — **Acme** (blue / sans-serif) and **Globex** (green / serif) —
to prove multi-brand theming end-to-end. Switch brands live in the Vue and Angular apps
(buttons in the header) and via the Storybook toolbar.

### The model: 3 token tiers, brands differ in the middle

```
PRIMITIVE  (brand-agnostic)      color.blue.500 = #2680eb,  space.md = 16px       → :root
   ▲ referenced by
SEMANTIC   (brand-specific)      color.brand.primary = {color.blue.500}            → .wa-theme-<brand>
   ▲ referenced by
BRIDGE     (structural, global)  --wa-color-brand-fill-loud = var(--color-brand-primary)
```

Only the **semantic** tier is per-brand. The bridge (`theme.css`) is structural and never
changes between brands; primitives are a shared palette. So a brand swap only changes what
`--color-brand-primary` resolves to — and because CSS custom properties resolve at use-time
and pierce shadow DOM, every `wa-*` component re-themes automatically.

### How it's wired

`packages/tokens/build.js` emits one scoped stylesheet per brand (our own semantic tokens):

```css
/* dist/css/acme.css */    .wa-theme-acme   { --color-brand-primary: var(--color-blue-500);  --font-family-body: var(--font-family-sans); }
/* dist/css/globex.css */  .wa-theme-globex { --color-brand-primary: var(--color-green-500); --font-family-body: var(--font-family-serif); }
```

Then `theme.css` bridges those onto Web Awesome. **The important bit:** WA's brand color
is a full **ramp** (`--wa-color-brand-05…95`) — every brand surface (button fills, borders,
hover via color-mix, text-on-brand) derives from it. Overriding a single token like
`--wa-color-brand-fill-loud` is incomplete (the button stays the default blue). So you remap
the **whole ramp** per scope — exactly what WA's own `.wa-brand-*` utilities do:

```css
.wa-theme-globex {                       /* Globex = green */
  --wa-color-brand-50: var(--wa-color-green-50);   /* …05 through 95… */
  --wa-color-brand:    var(--wa-color-green);
}
.wa-theme-acme, .wa-theme-globex {       /* structural, brand-agnostic */
  --wa-font-family-body: var(--font-family-body);
}
```

WA's defaults live in `@layer wa-color-variant`, so this **unlayered** block always wins —
no specificity battles. (For a custom brand hex, generate an 11-step ramp and map to that.)

Switching is just a class on `<html>`:

```html
<html class="wa-theme-acme wa-light">   <!-- swap to wa-theme-globex to re-theme everything -->
```

…and because theming cascades by subtree, **two brands can render on one page** (demo #6 in
both apps):

```html
<div class="wa-theme-acme">…blue…</div>
<div class="wa-theme-globex">…green…</div>
```

### Delivery strategies (pick per use case)

| | Scoped selectors (used here) | One `:root` file per brand |
| --- | --- | --- |
| Output | all brands in one bundle, `.wa-theme-*` | `acme.css`, `globex.css`, each `:root` |
| Switch | toggle a class at runtime | load/swap the right stylesheet |
| Two brands on one page | ✅ yes | ❌ one at a time |
| Payload | all brands shipped | only the active brand |
| Best for | brand switcher, multi-tenant UI, Storybook | per-deployment single brand (white-label) |

The brand axis is **orthogonal to light/dark**: combine with Web Awesome's `wa-light` / `wa-dark`
(e.g. `class="wa-theme-globex wa-dark"`). **Add a brand** by dropping `tokens/brands/<name>/*.json`
and adding `<name>` to `BRANDS` in `build.js`.

> **Caveat:** brand color in WA is a **ramp**, so remap the whole `--wa-color-brand-05…95`
> scale (pointing at a built-in palette, or your own generated ramp) rather than patching one
> derived token — otherwise fills/borders/hovers drift out of sync. Everything you don't
> override falls back to WA's defaults, so a brand only lists its deltas.

## Getting started

```bash
# from repo root
npm install

# build the design tokens (CSS vars + JS/TS)
npm run build:tokens

# run each sandbox
npm run dev:vue         # Vite dev server
npm run dev:angular     # Angular dev server
npm run dev:storybook   # Storybook
```

## Findings

_From scaffolding + production builds of all three apps (Node v22.17.0). Live in-browser
interaction wasn't run — the Chrome extension wasn't connected — but every app compiles,
resolves all `wa-*` imports + CSS, and bundles cleanly._

### Verified ✓
- **Tokens** — `npm run build:tokens` produces `dist/css/variables.css` + `dist/js/tokens.{js,d.ts}`. DTCG aliases (`{color.base.blue-500}`) are preserved as `var(--…)` thanks to `outputReferences: true`.
- **Token → component theming works** — in the built Angular CSS bundle our override `--wa-color-brand-fill-loud: var(--color-brand-primary)` lands **after** Web Awesome's own defaults, so it wins. The full chain (DTCG token → CSS var → `--wa-*` component variable) is live.
- **Multi-brand works** — both `.wa-theme-acme` (blue ramp) and `.wa-theme-globex` (green ramp) scopes appear in the bundled CSS, remapping the full `--wa-color-brand-05…95` ramp; the unlayered override sits after WA's `@layer` default so it wins. Live brand switching + two-brands-on-one-page are wired into both apps and Storybook. See [Multi-brand theming](#multi-brand-theming).
- **Vue 3** — builds with `vue-tsc` under strict mode. `wa-*` elements compile once `isCustomElement: t => t.startsWith('wa-')` is set in `vite.config.ts`. No wrapper needed.
- **Angular 20** — builds under `strictTemplates`. `wa-*` elements compile once `CUSTOM_ELEMENTS_SCHEMA` is added. CSS `@import` of the library + tokens resolves via node resolution. No wrapper needed.
- **Storybook** (web-components-vite) — builds; stories render raw `wa-*` elements with the token theme applied globally in `preview.ts`.

### Gotchas / things to know
- **Web Awesome emits standard `input`/`change` events** (alongside `wa-*` ones) and exposes `value`/`checked` properties — so binding is via plain property + event:
  - Vue: `v-model` works on `wa-input` (value + `input`); but a **switch needs `:checked` + `@change`** (v-model maps to `value`, not `checked`).
  - **Angular: `[(ngModel)]` does _not_ work on custom elements** — Angular's built-in value accessors only match native selectors. Use `[value]`/`(input)` (and `[checked]`/`(change)`). Full forms/`ngModel` support needs a custom `ControlValueAccessor` directive per component.
- **No official Angular or Vue wrappers** (React gets wrappers; we don't use React here). Both frameworks consume the raw custom elements.
- **Web Awesome's Vue type defs** (`dist/types/vue`) aren't exposed via the package `exports` map, so they can't be added to tsconfig `types`. Templates still type-check fine without them.
- **Node version**: Angular **22** CLI needs Node ≥22.22.3; this environment is on 22.17, so the Angular app is pinned to **Angular 20** (needs Node ≥22.12, TS 5.8). Bump Node to move to Angular 22.
- Harmless build warnings: esbuild flags Web Awesome's modern CSS nesting against old browser targets.

### Recommendation
**Viable as-is for both Angular and Vue**, with a thin integration layer rather than a fork:
- **Tokens**: keep the DTCG + Style Dictionary pipeline; theme Web Awesome by overriding `--wa-*` from our tokens (proven here).
- **Vue**: usable directly; document the `:checked`/`@change` pattern for boolean controls.
- **Angular**: usable directly for display/events, but to get clean template forms you'll want a small set of **`ControlValueAccessor` wrapper directives** for input-like components. That's the main cost to budget.
- **Cherry-pick vs reference**: no need to cherry-pick source — Core is MIT and installs from npm. Treat it as a dependency; build our DS as tokens + (for Angular) thin form-binding directives on top.
