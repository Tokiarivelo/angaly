import {
  RealisticRenderEntity,
  type RealisticRenderProps,
} from '../../domain/entities/realistic-render.entity';
import type {
  CreateCachedRealisticRenderData,
  CreateRealisticRenderData,
  IRealisticRenderRepository,
  MarkRenderDoneData,
} from '../../domain/repositories/realistic-render.repository';
import type { RealisticRenderPose } from '../../domain/value-objects/realistic-render-status.vo';
import type { IRenderSourceReader, RenderSource } from '../../domain/repositories/render-source.reader';
import type { IRenderStorageGateway } from '../../domain/services/render-storage.gateway';
import { RealisticRenderConfig } from '../../application/services/realistic-render.config';

export const RENDER_ID = '7d0c3a52-8a51-4f53-9c1e-3c8f4f0b8e11';

export function makeSource(overrides: Partial<RenderSource> = {}): RenderSource {
  return {
    versionId: 'version-1',
    customerId: 'customer-1',
    garmentType: 'ROBE',
    measurements: { TOUR_POITRINE: 90, TOUR_TAILLE: 70 },
    fabricBehavior: 'FLUIDE',
    fit: { primaryColor: '#123456' },
    pieces: [
      {
        id: 'piece-1',
        versionId: 'version-1',
        name: 'Devant',
        dimensionsJson: { widthMm: 300, heightMm: 900, outlineMm: [{ x: 0, y: 0 }] },
        fabricRecommendation: null,
        quantity: 1,
        grainlineJson: null,
        seamAllowanceCm: 1,
        notchesJson: null,
      },
      {
        id: 'piece-2',
        versionId: 'version-1',
        name: 'Dos',
        dimensionsJson: { widthMm: 280, heightMm: 900 },
        fabricRecommendation: null,
        quantity: 2,
        grainlineJson: null,
        seamAllowanceCm: 1,
        notchesJson: null,
      },
    ],
    ...overrides,
  };
}

export function makeRender(overrides: Partial<RealisticRenderProps> = {}): RealisticRenderEntity {
  return RealisticRenderEntity.create({
    id: RENDER_ID,
    versionId: 'version-1',
    requestedById: 'user-1',
    pose: 'PRESENTATION',
    cacheKey: 'key',
    status: 'QUEUED',
    attempts: 0,
    mediaId: null,
    glbUrl: null,
    simPose: null,
    metrics: null,
    error: null,
    durationMs: null,
    cachedFromId: null,
    createdAt: new Date('2026-10-16T10:00:00Z'),
    startedAt: null,
    finishedAt: null,
    ...overrides,
  });
}

type Entity = RealisticRenderEntity;

export function makeRepo() {
  return {
    create: jest.fn<Promise<Entity>, [CreateRealisticRenderData]>(),
    createCached: jest.fn<Promise<Entity>, [CreateCachedRealisticRenderData]>(),
    findById: jest.fn<Promise<Entity | null>, [string]>(),
    findLatestDoneByCacheKey: jest.fn<Promise<Entity | null>, [string]>().mockResolvedValue(null),
    findPendingByVersionAndKey: jest.fn<Promise<Entity | null>, [string, string]>().mockResolvedValue(null),
    findLatestByVersion: jest
      .fn<Promise<Entity | null>, [string, RealisticRenderPose | undefined]>()
      .mockResolvedValue(null),
    countSimulatedSince: jest.fn<Promise<number>, [string, Date]>().mockResolvedValue(0),
    failStale: jest.fn<Promise<number>, [Date, number]>().mockResolvedValue(0),
    claimNext: jest.fn<Promise<Entity | null>, [Date, number]>().mockResolvedValue(null),
    markDone: jest.fn<Promise<boolean>, [string, MarkRenderDoneData]>().mockResolvedValue(true),
    markFailed: jest.fn<Promise<boolean>, [string, string, number | null]>().mockResolvedValue(true),
  } satisfies { [K in keyof IRealisticRenderRepository]: jest.Mock };
}

export type RepoMock = ReturnType<typeof makeRepo>;

export function makeReader(source: RenderSource | null = makeSource()): {
  findByVersionId: jest.Mock;
} & IRenderSourceReader {
  return { findByVersionId: jest.fn().mockResolvedValue(source) };
}

export function makeStorage(): { [K in keyof IRenderStorageGateway]: jest.Mock } {
  return {
    createUploadTarget: jest.fn(),
    confirmUpload: jest.fn(),
  };
}

export const config = new RealisticRenderConfig();
