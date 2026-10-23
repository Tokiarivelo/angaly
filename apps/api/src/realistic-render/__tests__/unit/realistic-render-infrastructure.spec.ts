import { Prisma, type RealisticRender } from '@angaly/database';

import type { ConfirmUploadUseCase } from '../../../media/application/use-cases/confirm-upload.use-case';
import type { CreatePresignedUploadUseCase } from '../../../media/application/use-cases/create-presigned-upload.use-case';
import type { PrismaService } from '../../../prisma/prisma.service';
import { RealisticRenderMapper } from '../../infrastructure/mappers/realistic-render.mapper';
import { PrismaRealisticRenderRepository } from '../../infrastructure/repositories/prisma-realistic-render.repository';
import { PrismaRenderSourceReader } from '../../infrastructure/repositories/prisma-render-source.reader';
import { MediaRenderStorageGateway } from '../../infrastructure/services/media-render-storage.gateway';
import { makeRender, RENDER_ID } from './fixtures';

function record(overrides: Partial<RealisticRender> = {}): RealisticRender {
  return {
    id: RENDER_ID,
    versionId: 'version-1',
    requestedById: 'user-1',
    pose: 'PRESENTATION',
    cacheKey: 'key',
    status: 'QUEUED',
    attempts: 0,
    mediaId: null,
    glbUrl: null,
    simPoseJson: null,
    metricsJson: null,
    error: null,
    durationMs: null,
    cachedFromId: null,
    createdAt: new Date('2026-10-16T10:00:00Z'),
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe('RealisticRenderMapper', () => {
  it('keeps JSON objects, drops arrays and scalars, falls back on an unknown pose', () => {
    const entity = RealisticRenderMapper.toEntity(
      record({ pose: 'DANSE', simPoseJson: { leftArm: 1 }, metricsJson: [1, 2] as Prisma.JsonValue }),
    );
    expect(entity.pose).toBe('PRESENTATION');
    expect(entity.simPose).toEqual({ leftArm: 1 });
    expect(entity.metrics).toBeNull();
    expect(entity.isPending).toBe(true);
    expect(RealisticRenderMapper.toEntity(record({ status: 'DONE' })).isPending).toBe(false);
  });
});

describe('PrismaRealisticRenderRepository', () => {
  function setup() {
    const model = {
      create: jest
        .fn<Promise<RealisticRender>, [{ data: Partial<RealisticRender> }]>()
        .mockImplementation(({ data }) => Promise.resolve(record(data))),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(record()),
      count: jest.fn().mockResolvedValue(4),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const queryRaw = jest.fn().mockResolvedValue([record({ status: 'RUNNING', attempts: 1 })]);
    const prisma = { realisticRender: model, $queryRaw: queryRaw } as unknown as PrismaService;
    return { model, queryRaw, repo: new PrismaRealisticRenderRepository(prisma) };
  }

  it('creates a queued render', async () => {
    const { model, repo } = setup();
    const data = { id: RENDER_ID, versionId: 'version-1', requestedById: 'user-1', pose: 'NEUTRE' as const, cacheKey: 'k' };
    await expect(repo.create(data)).resolves.toMatchObject({ status: 'QUEUED', pose: 'NEUTRE' });
    expect(model.create).toHaveBeenCalledWith({ data: { ...data, status: 'QUEUED' } });
  });

  it('copies a finished render, pointing at the original simulation', async () => {
    const { model, repo } = setup();
    const source = makeRender({ id: 'original', status: 'DONE', mediaId: 'm', glbUrl: 'u', simPose: { a: 1 } });
    const copy = await repo.createCached({ id: 'copy', versionId: 'version-2', requestedById: 'user-1', pose: 'PRESENTATION', cacheKey: 'k', source });
    expect(copy.cachedFromId).toBe('original');
    const data = model.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ status: 'DONE', mediaId: 'm', glbUrl: 'u', simPoseJson: { a: 1 }, durationMs: 0 });
    expect(data.metricsJson).toBe(Prisma.DbNull);

    const copyOfCopy = makeRender({ id: 'copy', status: 'DONE', cachedFromId: 'original' });
    await repo.createCached({ id: 'c2', versionId: 'v3', requestedById: 'u', pose: 'PRESENTATION', cacheKey: 'k', source: copyOfCopy });
    expect(model.create.mock.calls[1][0].data.cachedFromId).toBe('original');
  });

  it('reads renders', async () => {
    const { model, repo } = setup();
    await expect(repo.findById('x')).resolves.toBeNull();
    model.findUnique.mockResolvedValue(record());
    await expect(repo.findById(RENDER_ID)).resolves.toMatchObject({ id: RENDER_ID });

    await repo.findLatestDoneByCacheKey('k');
    expect(model.findFirst.mock.calls[0][0].where).toEqual({ cacheKey: 'k', status: 'DONE', glbUrl: { not: null } });
    await repo.findPendingByVersionAndKey('version-1', 'k');
    expect(model.findFirst.mock.calls[1][0].where.status).toEqual({ in: ['QUEUED', 'RUNNING'] });
    await repo.findLatestByVersion('version-1');
    expect(model.findFirst.mock.calls[2][0].where).toEqual({ versionId: 'version-1' });
    await repo.findLatestByVersion('version-1', 'MIROIR');
    expect(model.findFirst.mock.calls[3][0].where).toEqual({ versionId: 'version-1', pose: 'MIROIR' });

    model.findFirst.mockResolvedValue(null);
    await expect(repo.findLatestDoneByCacheKey('k')).resolves.toBeNull();
    await expect(repo.findPendingByVersionAndKey('v', 'k')).resolves.toBeNull();
    await expect(repo.findLatestByVersion('v')).resolves.toBeNull();
  });

  it('counts only simulated renders for the quota', async () => {
    const { model, repo } = setup();
    const since = new Date();
    await expect(repo.countSimulatedSince('user-1', since)).resolves.toBe(4);
    expect(model.count).toHaveBeenCalledWith({ where: { requestedById: 'user-1', cachedFromId: null, createdAt: { gte: since } } });
  });

  it('claims with FOR UPDATE SKIP LOCKED', async () => {
    const { queryRaw, repo } = setup();
    const claimed = await repo.claimNext(new Date('2026-10-16T09:00:00Z'), 2);
    expect(claimed).toMatchObject({ status: 'RUNNING', attempts: 1 });
    const sql = queryRaw.mock.calls[0][0] as Prisma.Sql;
    expect(sql.sql).toContain('FOR UPDATE SKIP LOCKED');
    expect(sql.values).toEqual([2, new Date('2026-10-16T09:00:00Z')]);

    queryRaw.mockResolvedValue([]);
    await expect(repo.claimNext(new Date(), 2)).resolves.toBeNull();
  });

  it('only finishes renders that are still RUNNING', async () => {
    const { model, repo } = setup();
    await expect(repo.markDone(RENDER_ID, { mediaId: 'm', glbUrl: 'u', durationMs: 5, simPose: null, metrics: { f: 80 } })).resolves.toBe(true);
    expect(model.updateMany.mock.calls[0][0].where).toEqual({ id: RENDER_ID, status: 'RUNNING' });
    expect(model.updateMany.mock.calls[0][0].data).toMatchObject({ status: 'DONE', simPoseJson: Prisma.DbNull, metricsJson: { f: 80 } });

    model.updateMany.mockResolvedValue({ count: 0 });
    await expect(repo.markFailed(RENDER_ID, 'boom', null)).resolves.toBe(false);
    expect(model.updateMany.mock.calls[1][0].data).toMatchObject({ status: 'FAILED', error: 'boom' });
  });

  it('fails stale renders that used every attempt', async () => {
    const { model, repo } = setup();
    model.updateMany.mockResolvedValue({ count: 3 });
    const staleBefore = new Date();
    await expect(repo.failStale(staleBefore, 2)).resolves.toBe(3);
    expect(model.updateMany.mock.calls[0][0].where).toEqual({ status: 'RUNNING', startedAt: { lt: staleBefore }, attempts: { gte: 2 } });
  });
});

describe('PrismaRenderSourceReader', () => {
  function setup(version: unknown) {
    const findUnique = jest.fn().mockResolvedValue(version);
    const prisma = { patternVersion: { findUnique } } as unknown as PrismaService;
    return new PrismaRenderSourceReader(prisma);
  }

  it('reads what dump-version.sh reads', async () => {
    const reader = setup({
      id: 'version-1',
      parametersJson: {
        measurements: { TOUR_POITRINE: 90, NOTE: 'x', TOUR_TAILLE: Number.NaN },
        inspiration: { fabricBehavior: 'STRUCTURE' },
      },
      project: { customerId: 'customer-1', garmentType: 'ROBE', inspirationAnalysisJson: { profile: { fit: { primaryColor: '#fff' } } } },
      pieces: [
        { id: 'p', versionId: 'version-1', name: 'Devant', dimensionsJson: { widthMm: 1 }, fabricRecommendation: null, quantity: 1, grainlineJson: null, seamAllowanceCm: 1, notchesJson: null },
      ],
    });

    await expect(reader.findByVersionId('version-1')).resolves.toEqual({
      versionId: 'version-1',
      customerId: 'customer-1',
      garmentType: 'ROBE',
      measurements: { TOUR_POITRINE: 90 },
      fabricBehavior: 'STRUCTURE',
      fit: { primaryColor: '#fff' },
      pieces: [
        { id: 'p', versionId: 'version-1', name: 'Devant', dimensionsJson: { widthMm: 1 }, fabricRecommendation: null, quantity: 1, grainlineJson: null, seamAllowanceCm: 1, notchesJson: null },
      ],
    });
  });

  it('tolerates a version without measurements, inspiration or analysis', async () => {
    const reader = setup({
      id: 'v',
      parametersJson: null,
      project: { customerId: 'c', garmentType: 'JUPE', inspirationAnalysisJson: null },
      pieces: [{ id: 'p', versionId: 'v', name: 'Jupe', dimensionsJson: [], fabricRecommendation: null, quantity: 1, grainlineJson: null, seamAllowanceCm: null, notchesJson: null }],
    });
    const source = await reader.findByVersionId('v');
    expect(source).toMatchObject({ measurements: null, fabricBehavior: null, fit: null });
    expect(source?.pieces[0]?.dimensionsJson).toEqual({});
  });

  it('returns null for an unknown version', async () => {
    await expect(setup(null).findByVersionId('nope')).resolves.toBeNull();
  });
});

describe('MediaRenderStorageGateway', () => {
  it('presigns a .glb PUT and records the Media row in the patterns bucket', async () => {
    const presign = { execute: jest.fn().mockResolvedValue({ bucket: 'patterns', objectKey: 'k', uploadUrl: 'u', expiresInSeconds: 600 }) };
    const confirm = { execute: jest.fn().mockResolvedValue({ id: 'media-1', url: 'https://cdn/patterns/k' }) };
    const gateway = new MediaRenderStorageGateway(
      presign as unknown as CreatePresignedUploadUseCase,
      confirm as unknown as ConfirmUploadUseCase,
    );

    await gateway.createUploadTarget('realistic-renders/r');
    expect(presign.execute).toHaveBeenCalledWith({
      entityType: 'PATTERN_EXPORT',
      originalFilename: 'garment.glb',
      mimeType: 'model/gltf-binary',
      keyPrefix: 'realistic-renders/r',
    });

    await expect(gateway.confirmUpload({ objectKey: 'k', sizeBytes: 9, versionId: 'v', altText: 'a' })).resolves.toEqual({
      mediaId: 'media-1',
      url: 'https://cdn/patterns/k',
    });
    expect(confirm.execute).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'patterns', entityId: 'v', mimeType: 'model/gltf-binary' }));
  });
});
