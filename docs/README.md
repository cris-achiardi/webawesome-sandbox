# Web Awesome reference docs

Auto-generated reference for the pinned `@awesome.me/webawesome` version — a single place to
see everything Web Awesome exposes, for reasoning about adoption in an Angular + Vue design system.

| File | What it is |
| --- | --- |
| [`tokens.md`](./tokens.md) | Every global `--wa-*` design token (grouped by category, light-mode values) **plus** each component's CSS custom properties. |
| [`prop-map.md`](./prop-map.md) | Component API catalog — axes registry, value glossary, full prop index, events, slots, and WA-internal consistency notes. Modeled on the prop-glossary format. |

## Regenerate

```bash
npm run docs        # node scripts/build-docs.cjs
```

Both files are **generated from Web Awesome's own metadata** (`custom-elements.json` +
`styles/*.css`) — **do not hand-edit**. Re-run after bumping the Web Awesome version. The
generator also emits `apps/storybook/src/register-all.ts` so Storybook registers all components.

> Scope: this documents **Web Awesome's own** vocabulary only. Mapping it onto a specific
> design system's canonical axes is intentionally out of scope here.
