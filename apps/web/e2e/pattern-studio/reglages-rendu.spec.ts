import { expect, test, type Page } from '@playwright/test';

/**
 * Parcours « Réglages du rendu » (docs/plans/studio-3d-rendering.md, lot 3) : 3D sur mannequin → panneau de réglages →
 * éclairage, ombres, qualité → choix mémorisés après rechargement. Mesure aussi la cadence d'images pendant une rotation
 * (affichée dans la sortie du test) et enregistre une capture par éclairage dans le dossier de résultats.
 *
 * Needs the dev stack (web + API + seed). Credentials: E2E_EMAIL / E2E_PASSWORD (seed client by default);
 * API: E2E_API_URL (http://localhost:3003).
 */
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3003';
const EMAIL = process.env['E2E_EMAIL'] ?? 'client@angaly.mg';
const PASSWORD = process.env['E2E_PASSWORD'] ?? 'Client@Angaly2026!';

/** A project of the account with a generated version (the 3D needs saved pieces). */
async function findProjectWithVersion(page: Page): Promise<string | null> {
  const login = await page.request.post(`${API_URL}/api/auth/login`, { data: { email: EMAIL, password: PASSWORD } });
  if (!login.ok()) return null;
  const { accessToken } = ((await login.json()) as { data: { accessToken: string } }).data;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const list = await page.request.get(`${API_URL}/api/pattern-projects`, { headers });
  if (!list.ok()) return null;
  const body = (await list.json()) as { data: Array<{ id: string }> | { items: Array<{ id: string }> } };
  const projects = Array.isArray(body.data) ? body.data : body.data.items;
  for (const project of projects) {
    const versions = await page.request.get(`${API_URL}/api/pattern-projects/${project.id}/versions`, { headers });
    if (!versions.ok()) continue;
    const data = ((await versions.json()) as { data: Array<{ pieces?: unknown[] }> }).data;
    if (data.some((v) => (v.pieces?.length ?? 0) > 0)) return project.id;
  }
  return null;
}

/** Frames per second while the view is being turned (R3F renders on demand: one rAF callback per drawn frame). */
async function orbitFps(page: Page): Promise<number> {
  const canvas = page.getByLabel('Prévisualisation 3D du patron assemblé sur un mannequin');
  const box = (await canvas.boundingBox())!;
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[] };
    w.__frames = [];
    const tick = (t: number) => {
      w.__frames.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const started = Date.now();
  for (let i = 0; Date.now() - started < 3000; i += 1) {
    await page.mouse.move(cx + Math.sin(i / 8) * box.width * 0.3, cy, { steps: 1 });
  }
  await page.mouse.up();
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames);
  const seconds = (frames[frames.length - 1]! - frames[0]!) / 1000;
  return seconds > 0 ? (frames.length - 1) / seconds : 0;
}

test('réglages du rendu : éclairage, ombres, qualité, mémorisés au rechargement', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const projectId = await findProjectWithVersion(page);
  test.skip(!projectId, 'Aucun projet avec une version générée pour ce compte (seed ou API absents).');

  await page.goto('/connexion');
  await page.fill('input[type=email],input[name=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/connexion'));
  await page.evaluate(() => window.localStorage.removeItem('angaly.studio3d.settings'));

  await page.goto(`/pattern-studio/projects/${projectId}`);
  await page.getByText('3D sur mannequin').first().click({ timeout: 90_000 });
  const stage = page.getByTestId('garment-3d-stage');
  await expect(stage.getByText('Préparation du rendu…')).toBeHidden({ timeout: 90_000 });

  const fps = await orbitFps(page);
  testInfo.annotations.push({ type: 'fps', description: fps.toFixed(1) });
  console.log(`[reglages-rendu] rotation : ${fps.toFixed(1)} images/s`);

  const toggle = stage.getByRole('button', { name: 'Réglages du rendu' });
  await toggle.click();
  const panel = stage.getByRole('group', { name: 'Réglages du rendu' });
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('studio-auto-tier')).toContainText(/haute|moyenne|basse/);
  console.log(`[reglages-rendu] niveau auto : ${await panel.getByTestId('studio-auto-tier').innerText()}`);

  for (const label of ['Studio', 'Doux', 'Contraste']) {
    await panel.getByRole('button', { name: label, exact: true }).click();
    await expect(panel.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(800);
    await stage.screenshot({ path: testInfo.outputPath(`eclairage-${label.toLowerCase()}.png`) });
  }

  await panel.getByRole('switch', { name: 'Ombres' }).click();
  await panel.getByRole('button', { name: 'Basse' }).click();
  await expect(panel.getByTestId('studio-auto-tier')).toHaveCount(0);
  await page.waitForTimeout(800);
  await stage.screenshot({ path: testInfo.outputPath('sans-ombres-basse.png') });

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();

  await page.reload();
  await page.getByText('3D sur mannequin').first().click({ timeout: 90_000 });
  await page.getByTestId('garment-3d-stage').getByRole('button', { name: 'Réglages du rendu' }).click();
  const again = page.getByTestId('garment-3d-stage').getByRole('group', { name: 'Réglages du rendu' });
  await expect(again.getByRole('button', { name: 'Contraste', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(again.getByRole('switch', { name: 'Ombres' })).toHaveAttribute('aria-checked', 'false');
  await expect(again.getByRole('button', { name: 'Basse' })).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.localStorage.removeItem('angaly.studio3d.settings'));
});
