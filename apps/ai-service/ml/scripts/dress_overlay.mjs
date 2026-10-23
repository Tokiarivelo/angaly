// Captures the 3D mannequin of ONE project with the inspiration photo superposed (page's « Superposer » mode).
//   node ml/scripts/dress_overlay.mjs <projectId> <out.png> [opacity 0-100] [web=http://localhost:3100]
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [projectId, out, opacity = '50', web = 'http://localhost:3100'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(`${web}/connexion`);
await page.fill('input[type=email],input[name=email]', process.env.EMAIL ?? 'client@angaly.mg');
await page.fill('input[type=password]', process.env.PASSWORD ?? 'Client@Angaly2026!');
await page.getByRole('button', { name: 'Se connecter' }).click();
await page.waitForTimeout(5000);
await page.goto(`${web}/pattern-studio/projects/${projectId}`);
await page.getByText('3D sur mannequin').first().click({ timeout: 90000 });
await page.waitForTimeout(Number(process.env.WAIT_MS ?? 12000));
await page.getByText('Modèle', { exact: true }).first().click();
await page.getByLabel('Superposer').check();
await page.waitForTimeout(2500);
const slider = page.locator('input[type=range]').filter({ hasNot: page.locator('x') }).last();
try { await slider.fill(opacity, { timeout: 3000 }); } catch { /* the opacity control is optional */ }
await page.waitForTimeout(1500);
const canvas = page.locator('canvas').first();
await canvas.scrollIntoViewIfNeeded();
const box = await canvas.boundingBox();
await page.screenshot({ path: out, clip: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined });
await browser.close();
