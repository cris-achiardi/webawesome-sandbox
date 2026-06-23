import type { Preview } from '@storybook/web-components-vite';
import { html } from 'lit';

// Web Awesome base styles + theme, then our token override (load order matters).
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/styles/themes/default.css';
import '@ws/tokens/theme';

// Register the components used in stories.
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

// Brand picker in the Storybook toolbar — wraps each story in a wa-theme-* scope.
export const globalTypes = {
  brand: {
    description: 'Brand theme',
    defaultValue: 'acme',
    toolbar: {
      title: 'Brand',
      icon: 'paintbrush',
      items: [
        { value: 'acme', title: 'Acme (blue / sans)' },
        { value: 'globex', title: 'Globex (green / serif)' },
      ],
      dynamicTitle: true,
    },
  },
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (story, context) => html`
      <div
        class="wa-theme-${context.globals['brand']}"
        style="padding: 1.5rem; background: var(--color-surface-default); font-family: var(--font-family-body);"
      >
        ${story()}
      </div>
    `,
  ],
};

export default preview;
