# Web Awesome reference docs

Auto-generated reference for the pinned `@awesome.me/webawesome` version — a single place to
see everything Web Awesome exposes, for reasoning about adoption in an Angular + Vue design system.

### Generated (do not hand-edit)

| File | What it is |
| --- | --- |
| [`tokens.md`](./tokens.md) | Every global `--wa-*` design token (grouped by category, light-mode values) **plus** each component's CSS custom properties. |
| [`prop-map.md`](./prop-map.md) | Component API catalog — axes registry, value glossary, full prop index, events, slots, and WA-internal consistency notes. Modeled on the prop-glossary format. |

### Hand-authored guides (update manually after a major WA bump)

| File | What it is |
| --- | --- |
| [`component-architecture.md`](./component-architecture.md) | Dev-pattern audit of every WA component (class hierarchy, decorators, lifecycle, presentation channels, events) turned into **contracts** — a definition-of-done so custom components share WA's architecture. |
| [`naming-conventions.md`](./naming-conventions.md) | Normative naming table for tags, props, attributes, enum values, events, parts, slots, custom states, and tokens — plus rules to enforce the same names in a Figma integration. |

## Regenerate

```bash
npm run docs        # node scripts/build-docs.cjs
```

Both files are **generated from Web Awesome's own metadata** (`custom-elements.json` +
`styles/*.css`) — **do not hand-edit**. Re-run after bumping the Web Awesome version. The
generator also emits `apps/storybook/src/register-all.ts` so Storybook registers all components.

> Scope: this documents **Web Awesome's own** vocabulary only. Mapping it onto a specific
> design system's canonical axes is intentionally out of scope here.
