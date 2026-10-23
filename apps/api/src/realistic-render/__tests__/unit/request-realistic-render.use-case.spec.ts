import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';

import { RequestRealisticRenderUseCase } from '../../application/use-cases/request-realistic-render.use-case';
import { config, makeReader, makeRender, makeRepo, makeSource } from './fixtures';

describe('RequestRealisticRenderUseCase', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  function setup(source = makeSource()) {
    const repo = makeRepo();
    const reader = makeReader(source);
    const useCase = new RequestRealisticRenderUseCase(
      repo,
      reader,
      config,
    );
    return { repo, reader, useCase };
  }

  it('queues a new render keyed by the garment content', async () => {
    const { repo, useCase } = setup();
    repo.create.mockImplementation((data) => Promise.resolve(makeRender({ ...data })));

    const render = await useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION');

    expect(render.status).toBe('QUEUED');
    const data = repo.create.mock.calls[0][0];
    expect(data).toMatchObject({ versionId: 'version-1', requestedById: 'user-1', pose: 'PRESENTATION' });
    expect(data.cacheKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses a version the customer does not own', async () => {
    const { useCase } = setup(makeSource({ customerId: 'someone-else' }));
    await expect(useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('404s on an unknown version', async () => {
    const repo = makeRepo();
    const useCase = new RequestRealisticRenderUseCase(
      repo,
      makeReader(null),
      config,
    );
    await expect(useCase.execute('nope', 'customer-1', 'user-1', 'PRESENTATION')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses a version without pieces', async () => {
    const { useCase } = setup(makeSource({ pieces: [] }));
    await expect(useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns the render already queued for this version instead of queuing another', async () => {
    const { repo, useCase } = setup();
    const pending = makeRender({ status: 'RUNNING' });
    repo.findPendingByVersionAndKey.mockResolvedValue(pending);

    await expect(useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION')).resolves.toBe(pending);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns a finished render of the same version as is', async () => {
    const { repo, useCase } = setup();
    const done = makeRender({ status: 'DONE', glbUrl: 'https://cdn/x.glb' });
    repo.findLatestDoneByCacheKey.mockResolvedValue(done);

    await expect(useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION')).resolves.toBe(done);
    expect(repo.createCached).not.toHaveBeenCalled();
  });

  it('copies a finished render of another version with the same content (no quota used)', async () => {
    const { repo, useCase } = setup();
    const done = makeRender({ versionId: 'version-0', status: 'DONE', glbUrl: 'https://cdn/x.glb' });
    repo.findLatestDoneByCacheKey.mockResolvedValue(done);
    repo.countSimulatedSince.mockResolvedValue(99);
    repo.createCached.mockImplementation((data) =>
      Promise.resolve(makeRender({ versionId: data.versionId, status: 'DONE', cachedFromId: data.source.id })),
    );

    const render = await useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION');

    expect(render.cachedFromId).toBe(done.id);
    expect(repo.createCached.mock.calls[0][0]).toMatchObject({ versionId: 'version-1', source: done });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('enforces the daily quota (CLOTH_SIM_MAX_PER_DAY)', async () => {
    process.env.CLOTH_SIM_MAX_PER_DAY = '3';
    const { repo, useCase } = setup();
    repo.countSimulatedSince.mockResolvedValue(3);
    const now = new Date('2026-10-16T12:00:00Z');

    const error = await useCase
      .execute('version-1', 'customer-1', 'user-1', 'PRESENTATION', now)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect(repo.countSimulatedSince).toHaveBeenCalledWith('user-1', new Date('2026-10-15T12:00:00Z'));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('gives another pose another cache key', async () => {
    const { repo, useCase } = setup();
    repo.create.mockImplementation((data) => Promise.resolve(makeRender({ ...data })));

    await useCase.execute('version-1', 'customer-1', 'user-1', 'PRESENTATION');
    await useCase.execute('version-1', 'customer-1', 'user-1', 'NEUTRE');

    expect(repo.create.mock.calls[0][0].cacheKey).not.toBe(repo.create.mock.calls[1][0].cacheKey);
  });
});
