import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Parcours « Vues caméra » (docs/plans/studio-3d-rendering.md, lot 4) : 3D sur mannequin → boutons « 3/4 » et
 * « Ourlet » et raccourci 5 → la caméra glisse (le canevas, rendu à la demande, dessine une série d'images pendant
 * ≈ 600 ms au lieu d'une seule) puis s'arrête. Enregistre les captures dans le dossier de résultats.
 *
 * Needs the dev stack (web + API + seed). Credentials: E2E_EMAIL / E2E_PASSWORD (seed client by default);
 * API: E2E_API_URL (http://localhost:3003).
 */
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3003';
const EMAIL = process.env['E2E_EMAIL'] ?? 'client@angaly.mg';
const PASSWORD = process.env['E2E_PASSWORD'] ?? 'Client@Angaly2026!';

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

/** Animation frames requested by the page during `ms` after `action` (R3F asks one per frame it draws). */
async function framesDuring(page: Page, action: () => Promise<void>, ms = 900): Promise<number> {
  await page.evaluate(() => {
    (window as unknown as { __rafCount: number }).__rafCount = 0;
  });
  await action();
  await page.waitForTimeout(ms);
  return page.evaluate(() => (window as unknown as { __rafCount: number }).__rafCount);
}

const shot = async (stage: Locator, path: string): Promise<Buffer> => stage.screenshot({ path, animations: 'allow' });

test('vues caméra : 3/4 et ourlet, transition douce', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const projectId = await findProjectWithVersion(page);
  test.skip(!projectId, 'Aucun projet avec une version générée pour ce compte (seed ou API absents).');

  await page.addInitScript(() => {
    const w = window as unknown as { __rafCount: number };
    w.__rafCount = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      w.__rafCount += 1;
      return raf(cb);
    };
  });
  await page.goto('/connexion');
  await page.fill('input[type=email],input[name=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/connexion'));

  await page.goto(`/pattern-studio/projects/${projectId}`);
  await page.getByText('3D sur mannequin').first().click({ timeout: 90_000 });
  const stage = page.getByTestId('garment-3d-stage');
  await expect(stage.getByText('Préparation du rendu…')).toBeHidden({ timeout: 90_000 });

  const views = page.getByRole('group', { name: 'Vues' });
  await views.getByRole('button', { name: 'Face' }).click();
  await page.waitForTimeout(1000);
  const front = await shot(stage, testInfo.outputPath('vue-face.png'));

  const idle = await framesDuring(page, async () => {});
  const moving = await framesDuring(page, () => views.getByRole('button', { name: '3/4' }).click());
  console.log(`[vues-camera] images dessinées : repos ${idle}, transition ${moving}`);
  testInfo.annotations.push({ type: 'frames', description: `idle ${idle}, move ${moving}` });
  // A jump draws 1-2 frames; the eased move draws one per display frame for 600 ms.
  expect(moving).toBeGreaterThan(idle + 5);
  const threeQuarter = await shot(stage, testInfo.outputPath('vue-3-4.png'));
  expect(threeQuarter.equals(front)).toBe(false);
  // The move is over: the image no longer changes.
  await page.waitForTimeout(300);
  expect((await shot(stage, testInfo.outputPath('vue-3-4-fin.png'))).equals(threeQuarter)).toBe(true);

  await views.getByRole('button', { name: 'Ourlet' }).click();
  await page.waitForTimeout(1200);
  const hem = await shot(stage, testInfo.outputPath('vue-ourlet.png'));
  expect(hem.equals(threeQuarter)).toBe(false);

  // Shortcut 5 on the stage goes back to 3/4.
  await stage.focus();
  await page.keyboard.press('5');
  await page.waitForTimeout(1200);
  const again = await shot(stage, testInfo.outputPath('vue-3-4-raccourci.png'));
  expect(again.equals(hem)).toBe(false);
});
