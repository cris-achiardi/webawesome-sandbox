import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

/**
 * A small grouping of Web Awesome form controls inside a card, to eyeball
 * spacing, theming, and token overrides together.
 */
const meta: Meta = {
  title: 'Web Awesome/Form controls',
};

export default meta;
type Story = StoryObj;

export const InACard: Story = {
  render: () => html`
    <wa-card style="max-width: 360px;">
      <div style="display:flex; flex-direction:column; gap:16px;">
        <wa-input label="Name" value="Ada"></wa-input>
        <wa-switch checked>Notifications</wa-switch>
        <wa-button variant="brand" appearance="filled">Save</wa-button>
      </div>
    </wa-card>
  `,
};
