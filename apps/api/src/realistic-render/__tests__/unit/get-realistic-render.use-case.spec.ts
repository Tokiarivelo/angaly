import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { GetRealisticRenderUseCase } from '../../application/use-cases/get-realistic-render.use-case';
import { makeReader, makeRender, makeRepo, makeSource, RENDER_ID } from './fixtures';

describe('GetRealisticRenderUseCase', () => {
  function setup(source = makeSource()) {
    const repo = makeRepo();
    const useCase = new GetRealisticRenderUseCase(
      repo,
      makeReader(source),
    );
    return { repo, useCase };
  }

  it('returns the render of the version', async () => {
    const { repo, useCase } = setup();
    const render = makeRender({ status: 'DONE' });
    repo.findById.mockResolvedValue(render);
    await expect(useCase.execute('version-1', RENDER_ID, 'customer-1')).resolves.toBe(render);
  });

  it('404s on a render of another version (no reading renders through someone else’s version id)', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(makeRender({ versionId: 'version-9' }));
    await expect(useCase.execute('version-1', RENDER_ID, 'customer-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s on an unknown render', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('version-1', RENDER_ID, 'customer-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses another customer', async () => {
    const { useCase } = setup(makeSource({ customerId: 'other' }));
    await expect(useCase.execute('version-1', RENDER_ID, 'customer-1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(useCase.latest('version-1', 'customer-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the latest render of the version, by pose', async () => {
    const { repo, useCase } = setup();
    const render = makeRender();
    repo.findLatestByVersion.mockResolvedValue(render);
    await expect(useCase.latest('version-1', 'customer-1', 'NEUTRE')).resolves.toBe(render);
    expect(repo.findLatestByVersion).toHaveBeenCalledWith('version-1', 'NEUTRE');
  });
});
