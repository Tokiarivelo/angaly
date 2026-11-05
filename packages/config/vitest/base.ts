import { defineConfig } from 'vitest/config';

export const baseVitestConfig = defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Local runs: half the cores (each jsdom worker can take ~1 GB with three.js) — VITEST_MAX_WORKERS to override.
    ...(process.env['CI']
      ? {}
      : { maxWorkers: process.env['VITEST_MAX_WORKERS'] ?? '50%', minWorkers: 1 }),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.*',
        '**/*.d.ts',
        '**/index.ts',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    reporters: ['default'],
  },
});
