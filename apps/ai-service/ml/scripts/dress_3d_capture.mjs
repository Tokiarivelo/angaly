// Captures the 3D mannequin (front + side) of every project in a dress_benchmark results.json.
//   node ml/scripts/dress_3d_capture.mjs <results.json> <out-dir> [web=http://localhost:3100]
// Logs in as the seed client (owner of the benchmark projects; EMAIL/PASSWORD to override). Needs the web app, the API, Google Chrome and playwright (resolved from apps/web).
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
const require = createRequire(new URL('../../../web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [resultsPath, outDir, web = 'http://localhost:3100'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const results = Object.values(JSON.parse(readFileSync(resultsPath, 'utf8'))).filter((r) => r.projectId);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(`${web}/connexion`);
await page.fill('input[type=email],input[name=email]', process.env.EMAIL ?? 'client@angaly.mg');
await page.fill('input[type=password]', process.env.PASSWORD ?? 'Client@Angaly2026!');
await page.getByRole('button', { name: 'Se connecter' }).click();
await page.waitForTimeout(5000);
for (const r of results) {
  try {
    await page.goto(`${web}/pattern-studio/projects/${r.projectId}`);
    await page.getByText('3D sur mannequin').first().click({ timeout: 90000 });
    await page.waitForTimeout(Number(process.env.WAIT_MS ?? 25000));
    const canvas = page.locator('canvas').first();
    await canvas.scrollIntoViewIfNeeded();
    await canvas.screenshot({ path: `${outDir}/${r.projectId}-front.png` });
    await page.getByRole('button', { name: 'Côté', exact: true }).click();
    await page.waitForTimeout(1500);
    await canvas.scrollIntoViewIfNeeded();
    await canvas.screenshot({ path: `${outDir}/${r.projectId}-side.png` });
    console.log('ok', r.image, r.projectId);
  } catch (e) {
    console.log('fail', r.image, String(e).slice(0, 120));
  }
}
await browser.close();
