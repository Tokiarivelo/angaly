import react from '@vitejs/plugin-react';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Local runs: half the cores (each jsdom worker can take ~1 GB with three.js) — VITEST_MAX_WORKERS to override.
    ...(process.env['CI']
      ? {}
      : { maxWorkers: process.env['VITEST_MAX_WORKERS'] ?? '50%', minWorkers: 1 }),
    // e2e/ holds Playwright specs (separate runner, separate test/expect).
    // .headdump/ is a manual mesh-dump tool, run only with HEAD_OUT set: HEAD_OUT=/tmp/head vitest run .headdump
    exclude: [
      ...configDefaults.exclude,
      'e2e/**',
      ...(process.env['HEAD_OUT'] ? [] : ['.headdump/**']),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.*',
        '**/*.d.ts',
        '**/index.ts',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'src/app/**', // Next.js pages — no logic to test
        'src/providers/**', // Simple provider wrappers
        'src/components/**', // UI primitives & layout — no business logic
        'src/hooks/**', // Infrastructure hooks
        'src/middleware.ts', // Next.js edge middleware
        'src/lib/**', // API client, env, query-client
        'src/stores/**', // Zustand store wiring
        '.next/**',
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    reporters: ['default'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
