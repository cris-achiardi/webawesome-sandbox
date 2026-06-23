<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const BRANDS = ['acme', 'globex'] as const;
type Brand = (typeof BRANDS)[number];

// --- Active brand: toggles a `wa-theme-<brand>` class on <html>, live (no reload) ---
const brand = ref<Brand>('acme');
watchEffect(() => {
  const html = document.documentElement;
  BRANDS.forEach((b) => html.classList.remove(`wa-theme-${b}`));
  html.classList.add(`wa-theme-${brand.value}`);
});

// --- Reactive state bound to Web Awesome custom elements ---
const clicks = ref(0);
const name = ref('Ada');
const notifications = ref(true);
const fruit = ref('apple');

// Imperative access to a component instance (dialog opened via its `open` property)
const dialog = ref<HTMLElement & { open: boolean }>();
function openDialog() {
  if (dialog.value) dialog.value.open = true;
}
</script>

<template>
  <main class="page">
    <header>
      <h1>Web Awesome × Vue 3</h1>
      <p class="muted">
        Testing how <code>&lt;wa-*&gt;</code> custom elements bind in Vue: events, two-way
        binding, the <code>checked</code> gotcha, and imperative methods. Colors and fonts
        come from our design tokens via <code>theme.css</code>.
      </p>

      <!-- BRAND SWITCHER — flips the wa-theme-* class on <html>, re-theming everything live -->
      <div class="brand-switcher">
        <span class="muted">Brand:</span>
        <wa-button
          v-for="b in BRANDS"
          :key="b"
          size="small"
          :variant="b === brand ? 'brand' : 'neutral'"
          :appearance="b === brand ? 'filled' : 'outlined'"
          @click="brand = b"
        >
          {{ b }}
        </wa-button>
      </div>
    </header>

    <!-- 1. EVENT HANDLING — native @click works directly -->
    <wa-card class="demo">
      <strong>1. Events</strong>
      <p class="muted">Native <code>@click</code> on a custom element — works as-is.</p>
      <wa-button variant="brand" appearance="filled" @click="clicks++">
        Clicked {{ clicks }} time(s)
      </wa-button>
    </wa-card>

    <!-- 2. TWO-WAY TEXT — v-model works: wa-input has `value` + emits `input` -->
    <wa-card class="demo">
      <strong>2. Two-way text (v-model)</strong>
      <p class="muted">
        <code>v-model</code> works on <code>wa-input</code> because it exposes a
        <code>value</code> property and emits a standard <code>input</code> event.
      </p>
      <wa-input label="Name" :value="name" @input="name = ($event.target as any).value" />
      <p>Hello, <strong>{{ name || '…' }}</strong>!</p>
    </wa-card>

    <!-- 3. CHECKED GOTCHA — v-model maps to value/input, NOT checked.
         Use :checked + @change instead. -->
    <wa-card class="demo">
      <strong>3. Boolean (the <code>checked</code> gotcha)</strong>
      <p class="muted">
        Plain <code>v-model</code> binds <code>value</code>, not <code>checked</code> — so for
        toggles bind <code>:checked</code> and listen to <code>@change</code>.
      </p>
      <wa-switch
        :checked="notifications"
        @change="notifications = ($event.target as any).checked"
      >
        Notifications: {{ notifications ? 'on' : 'off' }}
      </wa-switch>
    </wa-card>

    <!-- 4. SELECT — value + change -->
    <wa-card class="demo">
      <strong>4. Select</strong>
      <p class="muted"><code>:value</code> + <code>@change</code>.</p>
      <wa-select :value="fruit" @change="fruit = ($event.target as any).value" label="Fruit">
        <wa-option value="apple">Apple</wa-option>
        <wa-option value="banana">Banana</wa-option>
        <wa-option value="cherry">Cherry</wa-option>
      </wa-select>
      <p>Picked: <strong>{{ fruit }}</strong></p>
    </wa-card>

    <!-- 5. IMPERATIVE — open a dialog through a template ref + its `open` property -->
    <wa-card class="demo">
      <strong>5. Imperative API (template ref)</strong>
      <p class="muted">Open a <code>wa-dialog</code> by setting its <code>open</code> property via a ref.</p>
      <wa-button @click="openDialog">Open dialog</wa-button>
      <wa-dialog ref="dialog" label="Hello from Web Awesome">
        This dialog was opened imperatively from Vue.
        <wa-button slot="footer" variant="brand" @click="dialog!.open = false">Close</wa-button>
      </wa-dialog>
    </wa-card>

      <!-- 6. TWO BRANDS ON ONE PAGE — each panel scopes its own wa-theme-* class.
           Proves brand theming cascades by subtree, independent of the global switch above. -->
    <wa-card class="demo">
      <strong>6. Two brands, one page</strong>
      <p class="muted">
        Each panel applies its own <code>wa-theme-*</code> class, so components inside
        pick up that brand's color + font independently.
      </p>
      <div class="brand-grid">
        <div v-for="b in BRANDS" :key="b" :class="`wa-theme-${b}`" class="brand-panel">
          <small class="muted">{{ b }}</small>
          <wa-input label="Name" value="Sample"></wa-input>
          <wa-button variant="brand" appearance="filled">Primary action</wa-button>
        </div>
      </div>
    </wa-card>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: var(--font-family-body, system-ui, sans-serif);
  color: var(--color-text-default, #111);
  background: var(--color-surface-default, #f5f5f5);
}
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-lg, 24px);
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 16px);
}
h1 { margin: 0 0 var(--space-xs, 4px); }
.muted { color: #666; font-size: 0.9rem; }
.demo {
  display: block;
}
.demo strong { display: block; margin-bottom: var(--space-xs, 4px); }
code { background: rgba(0,0,0,0.06); padding: 0 4px; border-radius: 3px; }
.brand-switcher {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  margin-top: var(--space-sm, 8px);
}
.brand-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md, 16px);
}
.brand-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
  padding: var(--space-md, 16px);
  border-radius: var(--radius-md, 8px);
  /* Both read from the panel's own brand scope */
  background: var(--color-surface-default);
  font-family: var(--font-family-body);
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
