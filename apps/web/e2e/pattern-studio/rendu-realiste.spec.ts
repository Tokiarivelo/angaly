import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Parcours « Rendu réaliste » (docs/features/realistic-render-blender.md §17) : 3D sur mannequin → bouton → suivi →
 * rendu prêt → affichage du `.glb` simulé → retour à l'aperçu.
 *
 * Needs the dev stack (web + API + seed). Only the realistic-render endpoints are intercepted: the Blender worker
 * takes minutes and is not part of the dev stack, and the `.glb` is a real simulation output (robe v2, fixture).
 * Credentials: E2E_EMAIL / E2E_PASSWORD (seed client by default); API: E2E_API_URL (http://localhost:3003).
 */
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3003';
const EMAIL = process.env['E2E_EMAIL'] ?? 'client@angaly.mg';
const PASSWORD = process.env['E2E_PASSWORD'] ?? 'Client@Angaly2026!';
const GLB_URL = 'http://e2e.angaly.test/realistic-renders/robe-v2.glb';
const GLB = readFileSync(join(__dirname, 'fixtures', 'robe-v2-simulated.glb'));

interface ProjectSummary {
  id: string;
  currentVersion?: { id: string } | null;
  versions?: Array<{ id: string }>;
}

/** A project of the account with a generated version (the section needs saved pieces). */
async function findProjectWithVersion(page: Page): Promise<string | null> {
  const login = await page.request.post(`${API_URL}/api/auth/login`, { data: { email: EMAIL, password: PASSWORD } });
  if (!login.ok()) return null;
  const { accessToken } = ((await login.json()) as { data: { accessToken: string } }).data;
  const list = await page.request.get(`${API_URL}/api/pattern-projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!list.ok()) return null;
  const body = (await list.json()) as { data: ProjectSummary[] | { items: ProjectSummary[] } };
  const projects = Array.isArray(body.data) ? body.data : body.data.items;
  for (const project of projects) {
    const versions = await page.request.get(`${API_URL}/api/pattern-projects/${project.id}/versions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!versions.ok()) continue;
    const list = ((await versions.json()) as { data: Array<{ pieces?: unknown[] }> }).data;
    if (list.some((v) => (v.pieces?.length ?? 0) > 0)) return project.id;
  }
  return null;
}

const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });

test('rendu réaliste : demande, suivi, affichage du .glb simulé puis retour à l’aperçu', async ({ page }) => {
  test.setTimeout(300_000);
  const projectId = await findProjectWithVersion(page);
  test.skip(!projectId, 'Aucun projet avec une version générée pour ce compte (seed ou API absents).');

  const render = {
    id: '0c84bb1a-1c44-4216-8018-724f81b9415f',
    versionId: '',
    pose: 'PRESENTATION',
    status: 'QUEUED',
    glbUrl: null as string | null,
    simPose: null as Record<string, unknown> | null,
    error: null,
    durationMs: null as number | null,
    cached: false,
    createdAt: new Date().toISOString(),
    finishedAt: null as string | null,
  };
  let polls = 0;
  const requested: Array<{ pose: string }> = [];

  await page.route(GLB_URL, (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: GLB }));
  await page.route(/\/api\/pattern-versions\/([^/]+)\/realistic-render(\/[^/?]+)?(\?.*)?$/, async (route) => {
    const match = /pattern-versions\/([^/]+)\/realistic-render(\/[^/?]+)?/.exec(route.request().url());
    render.versionId = match?.[1] ?? '';
    if (route.request().method() === 'POST') {
      requested.push(route.request().postDataJSON() as { pose: string });
      return json(route, render, 201);
    }
    if (!match?.[2]) return json(route, null); // latest: none yet
    polls += 1;
    if (polls === 1) return json(route, { ...render, status: 'RUNNING' });
    const limb = (raise: number) => ({ raise, forward: 0, twist: 0, bend: 6 });
    return json(route, {
      ...render,
      status: 'DONE',
      glbUrl: GLB_URL,
      simPose: { leftArm: limb(-7.5), rightArm: limb(-7.5), leftLeg: limb(0), rightLeg: limb(0) },
      durationMs: 385_000,
      finishedAt: new Date().toISOString(),
    });
  });

  await page.goto('/connexion');
  await page.fill('input[type=email],input[name=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/connexion'));

  await page.goto(`/pattern-studio/projects/${projectId}`);
  await page.getByText('3D sur mannequin').first().click({ timeout: 90_000 });

  const section = page.getByTestId('realistic-render');
  await section.getByRole('button', { name: 'Rendu réaliste' }).click();
  await expect(section.getByRole('status')).toContainText(/En file d’attente|Simulation du tissu en cours/);
  await expect(section.getByRole('button', { name: 'Rendu réaliste' })).toBeDisabled();
  expect(requested[0]?.pose).toMatch(/^(NEUTRE|PRESENTATION|MIROIR)$/);

  // Polled every 5 s: RUNNING, then DONE. Generous delay: in headless Chrome the 3D preview is drawn in software
  // (SwiftShader) and starves the page's timers (the first poll was seen ~70 s after the request).
  await expect(section.getByRole('status')).toHaveText('Rendu réaliste prêt', { timeout: 150_000 });
  await section.getByRole('button', { name: 'Voir le rendu réaliste' }).click();
  await expect(page.getByLabel('Rendu réaliste du vêtement simulé sur le mannequin')).toBeVisible();
  await expect(page.getByText('Chargement du rendu réaliste…')).toBeHidden({ timeout: 60_000 });
  await expect(section.getByRole('alert')).toHaveCount(0);

  await section.getByRole('button', { name: 'Revenir à l’aperçu' }).click();
  await expect(page.getByTestId('realistic-render-viewer')).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Relancer le rendu réaliste' })).toBeEnabled();
});
