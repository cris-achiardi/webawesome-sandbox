import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Tell Vue to treat every <wa-*> tag as a native custom element
          // instead of trying to resolve it as a Vue component.
          isCustomElement: (tag) => tag.startsWith('wa-'),
        },
      },
    }),
  ],
  server: { port: 5174 },
});
