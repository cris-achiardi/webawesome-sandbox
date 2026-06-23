import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

/**
 * Browsing the raw <wa-button> custom element in Storybook.
 * The "brand" variant picks up the accent color from our design tokens (theme.css).
 */
const meta: Meta = {
  title: 'Web Awesome/Button',
  render: (args) =>
    html`<wa-button variant=${args['variant']} appearance=${args['appearance']}>
      ${args['label']}
    </wa-button>`,
  args: { label: 'Click me', variant: 'brand', appearance: 'filled' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled', 'outlined', 'plain'],
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <wa-button variant="neutral">Neutral</wa-button>
      <wa-button variant="brand" appearance="filled">Brand</wa-button>
      <wa-button variant="success">Success</wa-button>
      <wa-button variant="warning">Warning</wa-button>
      <wa-button variant="danger">Danger</wa-button>
    </div>
  `,
};
