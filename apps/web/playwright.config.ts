import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3001';
const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Each worker is a Chromium drawing WebGL in software (SwiftShader) next to `next dev`: 2 locally, not half the
  // cores. PLAYWRIGHT_WORKERS to override.
  workers: isCI ? 1 : Number(process.env['PLAYWRIGHT_WORKERS'] ?? 2),
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'html',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      // PLAYWRIGHT_CHANNEL=chrome uses the installed Google Chrome instead of Playwright's own Chromium.
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env['PLAYWRIGHT_CHANNEL']
          ? { channel: process.env['PLAYWRIGHT_CHANNEL'] }
          : {}),
        // Locally, draw WebGL on the real GPU: in software (SwiftShader) the 3D pages starve the CPU and the
        // realistic-render spec times out. CI, or PLAYWRIGHT_SOFTWARE_GL=1, keeps the software renderer.
        ...(isCI || process.env['PLAYWRIGHT_SOFTWARE_GL']
          ? {}
          : {
              launchOptions: {
                args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=gl-egl'],
              },
            }),
      },
    },
  ],

  webServer: {
    command: isCI ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
