import { ListSectionsUseCase } from '../../application/use-cases/list-sections.use-case';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

function buildRepository(rows: PageSectionEntity[]): jest.Mocked<IPageSectionRepository> {
  return {
    listAll: jest.fn().mockResolvedValue(rows),
    findAllLocales: jest.fn(),
    findById: jest.fn(),
    findByKey: jest.fn(),
    saveWithSnapshot: jest.fn(),
    listVersions: jest.fn(),
    findVersionById: jest.fn(),
    restoreVersion: jest.fn(),
  };
}

function buildSection(overrides: Partial<Parameters<typeof PageSectionEntity.create>[0]> = {}) {
  return PageSectionEntity.create({
    id: 'section-1',
    page: 'accueil',
    sectionKey: 'hero',
    locale: 'FR',
    titleText: null,
    subtitleText: null,
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: null,
    mediaId: null,
    status: 'DRAFT',
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('ListSectionsUseCase', () => {
  it('groups sections by page', async () => {
    const rows = [
      buildSection({ page: 'accueil', sectionKey: 'hero', locale: 'FR' }),
      buildSection({ page: 'accueil', sectionKey: 'footer', locale: 'FR' }),
      buildSection({ page: 'a-propos', sectionKey: 'hero', locale: 'FR' }),
    ];
    const useCase = new ListSectionsUseCase(buildRepository(rows));

    const groups = await useCase.execute();

    expect(groups).toHaveLength(2);
    const accueil = groups.find((g) => g.page === 'accueil');
    expect(accueil?.sections).toHaveLength(2);
  });

  it('merges locale rows of the same sectionKey into one summary, tracking every locale', async () => {
    const rows = [
      buildSection({ page: 'accueil', sectionKey: 'hero', locale: 'FR', status: 'PUBLISHED', updatedAt: new Date('2026-01-01') }),
      buildSection({ page: 'accueil', sectionKey: 'hero', locale: 'MG', status: 'DRAFT', updatedAt: new Date('2026-01-05') }),
    ];
    const useCase = new ListSectionsUseCase(buildRepository(rows));

    const groups = await useCase.execute();

    expect(groups).toHaveLength(1);
    const [hero] = groups[0].sections;
    expect(hero.locales).toEqual(['FR', 'MG']);
    // FR is canonical for the status pill even though MG was updated later.
    expect(hero.status).toBe('PUBLISHED');
    expect(hero.updatedAt).toEqual(new Date('2026-01-05'));
  });

  it('returns an empty array when there are no sections', async () => {
    const useCase = new ListSectionsUseCase(buildRepository([]));

    expect(await useCase.execute()).toEqual([]);
  });
});
