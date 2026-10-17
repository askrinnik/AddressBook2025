import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.spec.ts'],
      setupFiles: ['tests/setup.ts'],
      css: false,
      // The first import of a page chunk transforms Vuetify and can be slow, especially with coverage.
      testTimeout: 20000,
      // Vuetify ships CSS and ESM that Node cannot load directly, so Vite transforms it.
      server: { deps: { inline: ['vuetify'] } },
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        // The entry point and the declaration files have nothing to execute.
        exclude: ['src/main.ts', 'src/**/*.d.ts'],
        reporter: ['text', 'html'],
        thresholds: { lines: 85, branches: 70 },
      },
    },
  }),
);
