/**
 * Web Awesome registration for the Vue sandbox.
 *
 * Order matters:
 *   1. Library base styles + a theme.
 *   2. Cherry-picked components (each import self-registers its <wa-*> custom element).
 *   3. Our token override sheet, loaded LAST so its --wa-* overrides win.
 */

// 1. Base styles + default theme
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/styles/themes/default.css';

// 2. Cherry-picked components (tree-shakeable — import only what we test)
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

// 3. Our design-token → Web Awesome theme bridge (must come after the library CSS)
import '@ws/tokens/theme';
