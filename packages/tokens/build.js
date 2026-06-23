/**
 * Brand-aware Style Dictionary build.
 *
 * Token tiers:
 *   core      → brand-agnostic primitives (palette, spacing, type scale)  → :root
 *   brand/*   → semantic tokens that REFERENCE core, one set per brand     → .wa-theme-<brand>
 *
 * Output (dist/css):
 *   core.css            :root { --color-blue-500: …; --space-md: …; }
 *   acme.css            .wa-theme-acme   { --color-brand-primary: var(--color-blue-500); … }
 *   globex.css          .wa-theme-globex { --color-brand-primary: var(--color-green-500); … }
 *
 * To add a brand: drop tokens/brands/<name>/*.json and add <name> to BRANDS.
 */
import StyleDictionary from 'style-dictionary';

const BRANDS = ['acme', 'globex'];

// 1. Core primitives → :root (shared by every brand), plus JS/TS for non-CSS consumers.
const core = new StyleDictionary({
  source: ['tokens/core/**/*.json'],
  usesDtcg: true,
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        { destination: 'core.css', format: 'css/variables', options: { outputReferences: true } },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [
        { destination: 'core.js', format: 'javascript/es6' },
        { destination: 'core.d.ts', format: 'typescript/es6-declarations' },
      ],
    },
  },
});
await core.buildAllPlatforms();

// 2. Each brand's semantic layer → scoped selector. We feed core in as source so the
//    {color.blue.500} references resolve, but only WRITE the brand's own tokens (filter),
//    keeping them as var(--…) refs into core.css (outputReferences).
for (const brand of BRANDS) {
  const sd = new StyleDictionary({
    source: ['tokens/core/**/*.json', `tokens/brands/${brand}/**/*.json`],
    usesDtcg: true,
    // We intentionally filter core tokens OUT of the brand file while keeping
    // var() references to them (they live at :root in core.css). Silence the
    // expected "filtered out token references" warning.
    log: { warnings: 'disabled' },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'dist/css/',
        files: [
          {
            destination: `${brand}.css`,
            format: 'css/variables',
            filter: (token) => token.filePath.includes(`brands/${brand}/`),
            options: { outputReferences: true, selector: `.wa-theme-${brand}` },
          },
        ],
      },
    },
  });
  await sd.buildAllPlatforms();
}
