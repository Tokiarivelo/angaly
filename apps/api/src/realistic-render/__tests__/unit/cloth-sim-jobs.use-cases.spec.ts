import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ClaimClothSimJobUseCase } from '../../application/use-cases/claim-cloth-sim-job.use-case';
import { CompleteClothSimJobUseCase } from '../../application/use-cases/complete-cloth-sim-job.use-case';
import { CreateClothSimUploadTargetUseCase } from '../../application/use-cases/create-cloth-sim-upload-target.use-case';
import { FailClothSimJobUseCase } from '../../application/use-cases/fail-cloth-sim-job.use-case';
import type { IRenderStorageGateway } from '../../domain/services/render-storage.gateway';
import { config, makeReader, makeRender, makeRepo, makeStorage, RENDER_ID } from './fixtures';

const asRepo = (repo: ReturnType<typeof makeRepo>) => repo;
const asStorage = (storage: ReturnType<typeof makeStorage>) => storage as unknown as IRenderStorageGateway;

describe('ClaimClothSimJobUseCase', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('hands the oldest job with the anonymous simulation input (no customer id)', async () => {
    process.env.CLOTH_SIM_TIMEOUT_S = '300';
    const repo = makeRepo();
    repo.claimNext.mockResolvedValue(makeRender({ status: 'RUNNING', attempts: 1, pose: 'NEUTRE' }));
    const useCase = new ClaimClothSimJobUseCase(asRepo(repo), makeReader(), config);
    const now = new Date('2026-10-16T12:00:00Z');

    const job = await useCase.execute(now);

    const staleBefore = new Date(now.getTime() - (300 + 120) * 1000);
    expect(repo.failStale).toHaveBeenCalledWith(staleBefore, 2);
    expect(repo.claimNext).toHaveBeenCalledWith(staleBefore, 2);
    expect(job).toMatchObject({
      renderId: RENDER_ID,
      versionId: 'version-1',
      pose: 'NEUTRE',
      garmentType: 'ROBE',
      fabricBehavior: 'FLUIDE',
      timeoutSeconds: 300,
    });
    expect(job?.pieces).toHaveLength(2);
    expect(JSON.stringify(job)).not.toContain('customer-1');
  });

  it('returns null when the queue is empty', async () => {
    const repo = makeRepo();
    repo.failStale.mockResolvedValue(1);
    const useCase = new ClaimClothSimJobUseCase(asRepo(repo), makeReader(), config);
    await expect(useCase.execute()).resolves.toBeNull();
  });

  it('fails a job whose version vanished', async () => {
    const repo = makeRepo();
    repo.claimNext.mockResolvedValue(makeRender({ status: 'RUNNING' }));
    const useCase = new ClaimClothSimJobUseCase(asRepo(repo), makeReader(null), config);
    await expect(useCase.execute()).resolves.toBeNull();
    expect(repo.markFailed).toHaveBeenCalledWith(RENDER_ID, expect.any(String), null);
  });
});

describe('CreateClothSimUploadTargetUseCase', () => {
  it('presigns a PUT inside the render’s own folder', async () => {
    const repo = makeRepo();
    const storage = makeStorage();
    repo.findById.mockResolvedValue(makeRender({ status: 'RUNNING' }));
    const target = { bucket: 'patterns', objectKey: `realistic-renders/${RENDER_ID}/a.glb`, uploadUrl: 'u', expiresInSeconds: 600 };
    storage.createUploadTarget.mockResolvedValue(target);

    await expect(new CreateClothSimUploadTargetUseCase(asRepo(repo), asStorage(storage)).execute(RENDER_ID)).resolves.toBe(
      target,
    );
    expect(storage.createUploadTarget).toHaveBeenCalledWith(`realistic-renders/${RENDER_ID}`);
  });

  it('refuses a render that is not running', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeRender({ status: 'DONE' }));
    await expect(
      new CreateClothSimUploadTargetUseCase(asRepo(repo), asStorage(makeStorage())).execute(RENDER_ID),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('404s on an unknown render', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new CreateClothSimUploadTargetUseCase(asRepo(repo), asStorage(makeStorage())).execute(RENDER_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('CompleteClothSimJobUseCase', () => {
  const objectKey = `realistic-renders/${RENDER_ID}/0b9f.glb`;

  function setup() {
    const repo = makeRepo();
    const storage = makeStorage();
    repo.findById.mockResolvedValue(makeRender({ status: 'RUNNING' }));
    storage.confirmUpload.mockResolvedValue({ mediaId: 'media-1', url: 'https://cdn/patterns/x.glb' });
    return { repo, storage, useCase: new CompleteClothSimJobUseCase(asRepo(repo), asStorage(storage)) };
  }

  it('attaches the uploaded .glb and marks the render DONE', async () => {
    const { repo, storage, useCase } = setup();

    await useCase.execute(RENDER_ID, {
      objectKey,
      sizeBytes: 210_000,
      durationMs: 300_000,
      simPose: { leftArm: { raise: -7.5 } },
      metrics: { frames: 80 },
    });

    expect(storage.confirmUpload).toHaveBeenCalledWith(
      expect.objectContaining({ objectKey, sizeBytes: 210_000, versionId: 'version-1' }),
    );
    expect(repo.markDone).toHaveBeenCalledWith(RENDER_ID, {
      mediaId: 'media-1',
      glbUrl: 'https://cdn/patterns/x.glb',
      durationMs: 300_000,
      simPose: { leftArm: { raise: -7.5 } },
      metrics: { frames: 80 },
    });
  });

  it.each([
    'realistic-renders/other-render/x.glb',
    `realistic-renders/${RENDER_ID}/../other/x.glb`,
    `realistic-renders/${RENDER_ID}/nested/x.glb`,
    'avatars/x.glb',
  ])('refuses an object key outside the render folder: %s', async (key) => {
    const { storage, useCase } = setup();
    await expect(useCase.execute(RENDER_ID, { objectKey: key, sizeBytes: 1, durationMs: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.confirmUpload).not.toHaveBeenCalled();
  });

  it('conflicts when the render was taken back meanwhile', async () => {
    const { repo, useCase } = setup();
    repo.markDone.mockResolvedValue(false);
    await expect(useCase.execute(RENDER_ID, { objectKey, sizeBytes: 1, durationMs: 1 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('FailClothSimJobUseCase', () => {
  it('stores a shortened reason', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeRender({ status: 'RUNNING' }));

    await new FailClothSimJobUseCase(asRepo(repo)).execute(RENDER_ID, { error: 'x'.repeat(3000), durationMs: 12 });

    const [, error, duration] = repo.markFailed.mock.calls[0];
    expect(error).toHaveLength(1000);
    expect(duration).toBe(12);
  });

  it('accepts a failure without duration', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeRender({ status: 'RUNNING' }));
    await new FailClothSimJobUseCase(asRepo(repo)).execute(RENDER_ID, { error: 'Blender timeout' });
    expect(repo.markFailed).toHaveBeenCalledWith(RENDER_ID, 'Blender timeout', null);
  });
});
