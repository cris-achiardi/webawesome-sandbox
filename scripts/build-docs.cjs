/**
 * Generate Web Awesome reference docs from the installed package's own metadata.
 *
 *   docs/tokens.md     — every global --wa-* design token + per-component CSS custom properties
 *   docs/prop-map.md   — component API catalog (axes registry, value glossary, prop index,
 *                        events, slots, consistency notes) modeled on Enara's prop-map format
 *   apps/storybook/src/register-all.ts — imports all components so Storybook is a full gallery
 *
 * Sources (read-only): @awesome.me/webawesome/dist/custom-elements.json + styles/*.css.
 * Pure Node, no deps. Deterministic (no timestamps) so re-runs produce no diff.
 * Generated — do not hand-edit the outputs; re-run `npm run docs` after a WA version bump.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const waPkgJson = require.resolve('@awesome.me/webawesome/package.json');
const WA_DIR = path.join(path.dirname(waPkgJson), 'dist');
const WA_VERSION = require(waPkgJson).version;
const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
fs.mkdirSync(DOCS, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'apps', 'storybook', 'src'), { recursive: true });

const ce = JSON.parse(fs.readFileSync(path.join(WA_DIR, 'custom-elements.json'), 'utf8'));
const components = [];
for (const m of ce.modules) for (const d of m.declarations || []) if (d.customElement && d.tagName) components.push(d);
components.sort((a, b) => a.tagName.localeCompare(b.tagName));

// ─── small static knowledge (labels only; never values we don't see in data) ──────────────
const GLOBAL_ATTRS = new Set(['dir', 'lang', 'did-ssr']); // inherited HTML noise, excluded from index
const PALETTE_HUES = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'gray'];
const TOKEN_CATEGORIES = [ // longest-prefix-first
  'form-control', 'line-height', 'color', 'font', 'shadow', 'border', 'space',
  'focus', 'transition', 'panel', 'link', 'tooltip', 'button', 'content', 'surface',
];
const AXIS_CONCEPTS = {
  variant: "Theme/intent color of a component.",
  appearance: "Visual fill style (paint).",
  size: "Control size on one ordered scale.",
  orientation: "Layout axis.",
  placement: "Overlay/anchor positioning.",
  type: "Native input type / sub-kind.",
  autocomplete: "Native autocomplete hint.",
  weight: "Font weight.",
  align: "Alignment.",
};
const VALUE_MEANINGS = {
  neutral: "Default, low-emphasis theme.", brand: "Primary brand color.",
  success: "Positive/completed status.", warning: "Caution/pending status.",
  danger: "Error/destructive status.", accent: "Solid brand-colored fill (highest emphasis).",
  filled: "Tinted/neutral solid fill.", outlined: "Border only, transparent fill.",
  'filled-outlined': "Filled with a visible border.", plain: "No chrome until interaction.",
  horizontal: "Laid out left-to-right.", vertical: "Laid out top-to-bottom.",
  xs: "Extra small.", s: "Small.", m: "Medium (default).", l: "Large.", xl: "Extra large.",
  small: "Small (alias of s).", medium: "Medium (alias of m).", large: "Large (alias of l).",
};

// ─── helpers ──────────────────────────────────────────────────────────────────────────────
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const isEnumType = (t) => typeof t === 'string' && t.includes('|') && t.includes("'");
const enumValues = (t) => [...t.matchAll(/'([^']*)'/g)].map((x) => x[1]);
const code = (s) => '`' + s + '`';
const usedOn = (set, limit = 10) => {
  const arr = [...set].sort();
  if (arr.length <= limit) return arr.join(', ');
  return arr.slice(0, limit).join(', ') + ` +${arr.length - limit} more`;
};

/**
 * Token extraction. WA defines light tokens before dark in document order (and the light
 * block's selector list also references `.wa-dark .wa-invert` for inverted scopes, so a naive
 * "skip anything containing dark" filter wrongly drops the main light block). We instead rely
 * on first-occurrence-wins, which yields the light value for every token defined in both modes.
 */
function extractTokens(file) {
  const css = stripComments(fs.readFileSync(file, 'utf8'));
  const out = new Map(); // name -> value (first occurrence = light)
  let buf = '';
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{' || ch === '}') buf = '';
    else if (ch === ';') {
      const m = buf.match(/(--wa-[a-z0-9-]+)\s*:\s*([^;]+)$/i);
      if (m && !out.has(m[1])) out.set(m[1], m[2].trim().replace(/\s+/g, ' '));
      buf = '';
    } else buf += ch;
  }
  return out;
}

function tokenCategory(name) {
  const base = name.replace(/^--wa-/, '');
  const cat = TOKEN_CATEGORIES.find((c) => base === c || base.startsWith(c + '-')) || base.split('-')[0];
  return cat;
}
function isPaletteToken(name) {
  const base = name.replace(/^--wa-color-/, '');
  return new RegExp(`^(${PALETTE_HUES.join('|')})-\\d`).test(base);
}

// ─── gather tokens ──────────────────────────────────────────────────────────────────────────
const tokens = new Map();
for (const f of ['styles/themes/default.css', 'styles/color/palettes/default.css']) {
  for (const [k, v] of extractTokens(path.join(WA_DIR, f))) if (!tokens.has(k)) tokens.set(k, v);
}
const byCategory = {};
for (const [name, value] of [...tokens].sort((a, b) => a[0].localeCompare(b[0]))) {
  const cat = tokenCategory(name);
  (byCategory[cat] = byCategory[cat] || []).push({ name, value });
}

// ─── gather component API ─────────────────────────────────────────────────────────────────
const attrUsage = new Map();   // name -> Set(tags)
const attrKinds = new Map();   // name -> Set('axis'|'boolean'|'local')
const attrValues = new Map();  // name -> Set(values)
const attrTypes = new Map();   // name -> Set(type text for non-enum)
const attrDefaults = new Map();// name -> Set(default)
const attrPerComp = new Map(); // name -> Map(tag -> sorted values) for consistency check
const eventUsage = new Map();
const slotUsage = new Map();

const add = (map, k, v) => (map.get(k) || map.set(k, new Set()).get(k)).add(v);

for (const d of components) {
  for (const a of d.attributes || []) {
    if (GLOBAL_ATTRS.has(a.name)) continue;
    const t = (a.type && a.type.text) || '';
    add(attrUsage, a.name, d.tagName);
    if (isEnumType(t)) {
      add(attrKinds, a.name, 'axis');
      const vals = enumValues(t);
      vals.forEach((v) => add(attrValues, a.name, v));
      if (!attrPerComp.has(a.name)) attrPerComp.set(a.name, new Map());
      attrPerComp.get(a.name).set(d.tagName, vals.slice().sort().join('·'));
    } else if (t === 'boolean') add(attrKinds, a.name, 'boolean');
    else { add(attrKinds, a.name, 'local'); if (t) add(attrTypes, a.name, t); }
    if (a.default != null && a.default !== '') add(attrDefaults, a.name, a.default);
  }
  for (const e of d.events || []) add(eventUsage, e.name, d.tagName);
  for (const s of d.slots || []) add(slotUsage, s.name || '(default)', d.tagName);
}

const kindOf = (name) => {
  const k = attrKinds.get(name);
  return k.has('axis') ? 'axis' : k.has('local') ? 'local' : 'boolean';
};
const valuesOrType = (name) => {
  const kind = kindOf(name);
  if (kind === 'axis') return [...attrValues.get(name)].sort().map(code).join(' ');
  if (kind === 'boolean') return code('true·false');
  // local: type text may itself contain `|` (e.g. `Element | string`); escape for the table.
  return [...(attrTypes.get(name) || ['—'])].map((x) => code(x.replace(/\s+/g, ' '))).join(', ').replace(/\|/g, '\\|');
};

const allAttrNames = [...attrUsage.keys()].sort();
const axisNames = allAttrNames.filter((n) => kindOf(n) === 'axis');
const boolNames = allAttrNames.filter((n) => kindOf(n) === 'boolean');
const localNames = allAttrNames.filter((n) => kindOf(n) === 'local');

// ─── write docs/tokens.md ─────────────────────────────────────────────────────────────────
const banner = (extra) =>
  `> Generated by \`scripts/build-docs.cjs\` from \`@awesome.me/webawesome@${WA_VERSION}\` — do not edit by hand.\n` +
  `> Re-run \`npm run docs\` after a Web Awesome version bump.${extra ? '\n> ' + extra : ''}\n`;

let t = `# Web Awesome — Design Tokens\n\n${banner('Light-mode values shown; most color tokens also have `.wa-dark` overrides.')}\n`;
t += `**${tokens.size}** global \`--wa-*\` tokens · **${components.filter((c) => (c.cssProperties || []).length).length}** components expose component-level CSS custom properties.\n\n`;

const colorTokens = byCategory.color || [];
const palette = colorTokens.filter((x) => isPaletteToken(x.name));
const semantic = colorTokens.filter((x) => !isPaletteToken(x.name));
const otherCats = Object.keys(byCategory).filter((c) => c !== 'color').sort();

t += `## Categories\n\n`;
t += `- [Color — palette ramps](#color--palette-ramps) (${palette.length})\n`;
t += `- [Color — semantic](#color--semantic) (${semantic.length})\n`;
otherCats.forEach((c) => (t += `- [${c}](#${c}) (${byCategory[c].length})\n`));
t += `- [Component CSS custom properties](#component-css-custom-properties)\n\n---\n\n`;

const tokenTable = (rows) =>
  `| Token | Value |\n| --- | --- |\n` + rows.map((r) => `| ${code(r.name)} | ${code(r.value)} |`).join('\n') + '\n\n';

t += `## Color — palette ramps\n\nPerceptually-spaced color scales (\`05\`–\`95\`). Brand/semantic groups alias into these.\n\n${tokenTable(palette)}`;
t += `## Color — semantic\n\nMeaning-based color tokens (\`brand\`, \`neutral\`, \`success\`… and \`fill\`/\`border\`/\`on\`/\`surface\`/\`text\` groups).\n\n${tokenTable(semantic)}`;
for (const c of otherCats) t += `## ${c}\n\n${tokenTable(byCategory[c])}`;

t += `## Component CSS custom properties\n\nPer-component theming knobs (set on the element or a wrapping scope).\n\n`;
for (const d of components) {
  const props = d.cssProperties || [];
  if (!props.length) continue;
  t += `### ${code(d.tagName)}\n\n| Property | Default | Description |\n| --- | --- | --- |\n`;
  for (const p of props.slice().sort((a, b) => a.name.localeCompare(b.name)))
    t += `| ${code(p.name)} | ${p.default ? code(p.default) : '—'} | ${(p.description || '').replace(/\n+/g, ' ').replace(/\|/g, '\\|')} |\n`;
  t += '\n';
}
fs.writeFileSync(path.join(DOCS, 'tokens.md'), t);

// ─── write docs/prop-map.md ──────────────────────────────────────────────────────────────
let p = `# Web Awesome — Prop Map\n\n${banner('Descriptive catalog of every component attribute, its values, and the components using it.')}\n`;
p += `**Coverage:** ${components.length} components · ${allAttrNames.length} distinct attributes ` +
  `(${axisNames.length} enum/axis · ${boolNames.length} boolean · ${localNames.length} local) · ` +
  `${eventUsage.size} events · ${slotUsage.size} slots. \`dir\`/\`lang\`/\`did-ssr\` excluded as inherited globals.\n\n`;
p += `## How to use this\n\n- **Designing an API on top of WA?** Check the **Axes registry** for the shared vocabulary (\`variant\`, \`size\`, \`appearance\`…).\n- **Looking up an attribute?** The **Prop index** lists every attribute, its values, and which components expose it.\n- **Binding from a framework?** See **Events** and **Slots**.\n- **Consistency notes** flag where WA's own naming diverges across components.\n\n---\n\n`;

// §1 Axes registry
p += `## 1. Axes registry\n\nCross-cutting enum attributes (on ≥3 components). Values are the union seen across components.\n\n`;
p += `| Axis | Concept | Values | Default | Used on |\n| --- | --- | --- | --- | --: |\n`;
for (const n of axisNames.filter((n) => attrUsage.get(n).size >= 3).sort((a, b) => attrUsage.get(b).size - attrUsage.get(a).size)) {
  const def = attrDefaults.get(n);
  const defStr = def && def.size === 1 ? code([...def][0].replace(/'/g, '')) : def ? 'varies' : '—';
  p += `| ${code(n)} | ${AXIS_CONCEPTS[n] || '—'} | ${[...attrValues.get(n)].sort().map(code).join(' ')} | ${defStr} | ${attrUsage.get(n).size} |\n`;
}

// §2 Value glossary
p += `\n## 2. Value glossary\n\nDistinct values for the most common axes. Unannotated values had no static gloss.\n\n`;
p += `| Value | Meaning | Axis |\n| --- | --- | --- |\n`;
const glossaryAxes = ['variant', 'appearance', 'size', 'orientation', 'placement'].filter((a) => attrValues.has(a));
const seenVals = new Set();
for (const ax of glossaryAxes)
  for (const v of [...attrValues.get(ax)].sort()) {
    const key = ax + '|' + v;
    if (seenVals.has(key)) continue;
    seenVals.add(key);
    p += `| ${code(v)} | ${VALUE_MEANINGS[v] || '—'} | ${code(ax)} |\n`;
  }

// §3 Prop index
p += `\n## 3. Prop index\n\nEvery attribute across all ${components.length} components.\n\n`;
p += `| Prop | Kind | Values / type | Used on |\n| --- | --- | --- | --- |\n`;
for (const n of allAttrNames)
  p += `| ${code(n)} | ${kindOf(n)} | ${valuesOrType(n)} | ${usedOn(attrUsage.get(n))} |\n`;

// §4 Events
p += `\n## 4. Events\n\n| Event | Emitted by |\n| --- | --- |\n`;
for (const n of [...eventUsage.keys()].sort()) p += `| ${code(n)} | ${usedOn(eventUsage.get(n))} |\n`;

// §5 Slots
p += `\n## 5. Slots\n\n| Slot | Used on |\n| --- | --- |\n`;
for (const n of [...slotUsage.keys()].sort()) p += `| ${code(n)} | ${usedOn(slotUsage.get(n))} |\n`;

// §6 Consistency notes (data-derived)
p += `\n## 6. Consistency notes\n\nWA-internal naming divergences surfaced from the data (descriptive, not prescriptive).\n\n`;
const notes = [];
for (const n of axisNames) {
  const perComp = attrPerComp.get(n);
  if (!perComp) continue;
  const distinct = new Set(perComp.values());
  if (distinct.size > 1)
    notes.push(`**${code(n)}** — value set varies across components (${distinct.size} distinct sets over ${perComp.size} components).`);
}
const sizeVals = attrValues.get('size');
if (sizeVals && ['s', 'm', 'l'].some((x) => sizeVals.has(x)) && ['small', 'medium', 'large'].some((x) => sizeVals.has(x)))
  notes.push(`**${code('size')}** — exposes both short (\`s\`/\`m\`/\`l\`) and long (\`small\`/\`medium\`/\`large\`) spellings for the same scale.`);
p += notes.map((x) => `- ${x}`).join('\n') + '\n';

// Appendix — component summary
p += `\n## Appendix — component summary\n\n`;
p += `| Component | Attrs | Events | Slots | CSS parts | CSS vars | Status | Since |\n| --- | --: | --: | --: | --: | --: | --- | --- |\n`;
for (const d of components) {
  const nAttr = (d.attributes || []).filter((a) => !GLOBAL_ATTRS.has(a.name)).length;
  p += `| ${code(d.tagName)} | ${nAttr} | ${(d.events || []).length} | ${(d.slots || []).length} | ${(d.cssParts || []).length} | ${(d.cssProperties || []).length} | ${d.status || '—'} | ${d.since || '—'} |\n`;
}
fs.writeFileSync(path.join(DOCS, 'prop-map.md'), p);

// ─── write apps/storybook/src/register-all.ts ───────────────────────────────────────────────
let reg = `// Generated by scripts/build-docs.js — do not edit by hand.\n`;
reg += `// Imports every Web Awesome component so Storybook is a full gallery.\n`;
for (const d of components) reg += `import '@awesome.me/webawesome/dist/${d.modulePath}';\n`;
fs.writeFileSync(path.join(ROOT, 'apps', 'storybook', 'src', 'register-all.ts'), reg);

console.log(`docs/tokens.md      → ${tokens.size} tokens, ${components.filter((c) => (c.cssProperties || []).length).length} components with CSS vars`);
console.log(`docs/prop-map.md    → ${components.length} components, ${allAttrNames.length} attrs (${axisNames.length} axis / ${boolNames.length} bool / ${localNames.length} local), ${eventUsage.size} events, ${slotUsage.size} slots`);
console.log(`register-all.ts     → ${components.length} component imports`);
