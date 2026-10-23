import { NotFoundException } from '@nestjs/common';
import { validatePatternExtParameters } from '@angaly/types';

import { CreateProjectFromCatalogUseCase } from '../../application/use-cases/create-project-from-catalog.use-case';
import { ListPatternCatalogUseCase } from '../../application/use-cases/list-pattern-catalog.use-case';
import type { CatalogImage, ICatalogImageRepository } from '../../domain/catalog-entry';
import credits from '../../infrastructure/data/catalog-inspirations.json';
import { EngineCatalogSource } from '../../infrastructure/engine-catalog.source';

const image: CatalogImage = { mediaId: 'm-cat', bucket: 'pattern-inspirations', objectKey: 'catalog/tournure.jpg', url: 'http://minio/x.jpg', mimeType: 'image/jpeg', sizeBytes: 1234 };
const images = (map: Record<string, CatalogImage> = {}): ICatalogImageRepository => ({ findAll: jest.fn().mockResolvedValue(new Map(Object.entries(map))) });

describe('EngineCatalogSource', () => {
  const source = new EngineCatalogSource();

  it('serves every catalogue dress with its generated pieces, yardage and shelf', () => {
    const list = source.list();
    expect(list.length).toBeGreaterThanOrEqual(30);
    for (const e of list) {
      expect(e.pieceCount).toBe(e.pieces.length);
      expect(e.pieceCount).toBeGreaterThan(3);
      expect(['MODERNE', 'HISTORIQUE', 'MARIEE']).toContain(e.group);
      // What a project starts with passes the same validation as the wizard's.
      expect(validatePatternExtParameters(e.template.parametersExt).issues).toEqual([]);
    }
    expect(source.find('mariee-bal')?.group).toBe('MARIEE');
    expect(source.find('francaise-1750')?.group).toBe('HISTORIQUE');
    expect(source.find('nope')).toBeNull();
  });
});

describe('catalog-inspirations.json', () => {
  it('credits a free-licence photo, with its source page, for every catalogue dress', () => {
    const ids = new EngineCatalogSource().list().map((e) => e.id);
    for (const id of ids) {
      const credit = (credits as Record<string, { title: string; source: string; page: string; license: string }>)[id];
      expect({ id, credited: Boolean(credit?.title && credit.source && credit.page.startsWith('https://')) }).toEqual({ id, credited: true });
      // No NC / ND: the photo is shown in the shop next to the pattern.
      expect(credit.license).toMatch(/^(CC0|CC BY(-SA)? \d\.\d|Public domain)/);
    }
  });
});

describe('ListPatternCatalogUseCase', () => {
  it('adds the seeded photo URL and hides the project template', async () => {
    const list = await new ListPatternCatalogUseCase(new EngineCatalogSource(), images({ 'tournure-1885': image })).execute();
    const tournure = list.find((e) => e.id === 'tournure-1885')!;
    expect(tournure.imageUrl).toBe(image.url);
    expect(tournure.garmentType).toBe('ROBE');
    expect(tournure).not.toHaveProperty('template');
    expect(list.find((e) => e.id === 'qipao')!.imageUrl).toBeNull();
  });
});

describe('CreateProjectFromCatalogUseCase', () => {
  const setup = (map: Record<string, CatalogImage> = {}) => {
    const createProject = { execute: jest.fn().mockResolvedValue({ id: 'p-1' }) };
    const projects = { update: jest.fn().mockResolvedValue({}) };
    const useCase = new CreateProjectFromCatalogUseCase(new EngineCatalogSource(), images(map), createProject as never, projects as never);
    return { useCase, createProject, projects };
  };

  it('creates the project with the dress’s cut, details, extended parameters, look and the catalogue’s photo', async () => {
    const { useCase, createProject, projects } = setup({ 'tournure-1885': image });
    await expect(useCase.execute({ entryId: 'tournure-1885', customerId: 'c-1', userId: 'u-1' })).resolves.toEqual({ projectId: 'p-1' });
    expect(createProject.execute).toHaveBeenCalledWith('c-1', expect.objectContaining({ garmentType: 'ROBE', cutType: 'AJUSTEE', detailsJson: expect.objectContaining({ jupe: 'EN_LES' }) }));
    const patch = projects.update.mock.calls[0][1];
    expect(patch.inspirationMediaId).toBe('m-cat');
    expect(patch.inspirationAnalysisJson.profile.fit).toMatchObject({ fabricColor: expect.stringMatching(/^#/) });
    expect(patch.parametersExtJson.construction.items.map((i: { kind: string }) => i.kind)).toContain('BUSTLE');
    expect(patch.inspirationAnalysisJson.profile).toMatchObject({ isGarment: true, garmentType: 'ROBE', cutType: 'AJUSTEE' });
  });

  it('works without a seeded photo, and refuses an unknown dress', async () => {
    const { useCase, projects } = setup();
    await useCase.execute({ entryId: 'qipao', customerId: 'c-1', userId: 'u-1' });
    expect(projects.update.mock.calls[0][1]).not.toHaveProperty('inspirationMediaId');
    await expect(useCase.execute({ entryId: 'nope', customerId: 'c-1', userId: 'u-1' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
