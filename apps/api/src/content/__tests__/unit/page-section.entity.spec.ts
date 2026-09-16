import { PageSectionEntity } from '../../domain/entities/page-section.entity';

function validProps(overrides: Partial<Parameters<typeof PageSectionEntity.create>[0]> = {}) {
  return {
    id: 'section-1',
    page: 'accueil',
    sectionKey: 'hero',
    locale: 'FR' as const,
    titleText: 'Bienvenue',
    subtitleText: null,
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: null,
    mediaId: null,
    status: 'DRAFT' as const,
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('PageSectionEntity', () => {
  it('creates a valid section', () => {
    const entity = PageSectionEntity.create(validProps());
    expect(entity.page).toBe('accueil');
    expect(entity.sectionKey).toBe('hero');
    expect(entity.locale).toBe('FR');
  });

  it('rejects an empty page', () => {
    expect(() => PageSectionEntity.create(validProps({ page: '  ' }))).toThrow(
      'PageSection.page must not be empty',
    );
  });

  it('rejects an empty sectionKey', () => {
    expect(() => PageSectionEntity.create(validProps({ sectionKey: '' }))).toThrow(
      'PageSection.sectionKey must not be empty',
    );
  });

  it('rejects an invalid locale', () => {
    // @ts-expect-error deliberately invalid for the test
    expect(() => PageSectionEntity.create(validProps({ locale: 'EN' }))).toThrow(
      'PageSection.locale must be FR or MG',
    );
  });

  it('rejects an invalid status', () => {
    // @ts-expect-error deliberately invalid for the test
    expect(() => PageSectionEntity.create(validProps({ status: 'ARCHIVED' }))).toThrow(
      'PageSection.status must be DRAFT or PUBLISHED',
    );
  });

  it('toSnapshot() returns every editable field, excluding id/timestamps', () => {
    const entity = PageSectionEntity.create(validProps({ titleText: 'Titre', mediaId: 'media-1' }));

    expect(entity.toSnapshot()).toEqual({
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      titleText: 'Titre',
      subtitleText: null,
      bodyText: null,
      ctaPrimaryLabel: null,
      ctaSecondaryLabel: null,
      dataJson: null,
      mediaId: 'media-1',
      status: 'DRAFT',
    });
  });
});
