import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import type { PageSectionProps } from '../../domain/entities/page-section.entity';
import { localizeSection, mergeDataJson } from '../../domain/services/localize-section';

function section(overrides: Partial<PageSectionProps>): PageSectionEntity {
  return PageSectionEntity.create({
    id: 's',
    page: 'accueil',
    sectionKey: 'univers',
    locale: 'FR',
    titleText: null,
    subtitleText: null,
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: null,
    mediaId: null,
    media: null,
    status: 'PUBLISHED',
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('localizeSection', () => {
  it('returns the base section untouched when there is no translation', () => {
    const base = section({ titleText: 'Univers' });
    expect(localizeSection(base, undefined)).toBe(base);
  });

  it('returns the translation alone when there is no base', () => {
    const localized = section({ locale: 'MG', titleText: 'Tontolo' });
    expect(localizeSection(undefined, localized)).toBe(localized);
  });

  it('uses translated text but falls back to the base for empty fields', () => {
    const base = section({ titleText: 'Univers', subtitleText: 'Sous-titre', bodyText: 'Corps' });
    const localized = section({ locale: 'MG', titleText: 'Tontolo', subtitleText: '  ', bodyText: null });

    const result = localizeSection(base, localized)!;

    expect(result.locale).toBe('MG');
    expect(result.titleText).toBe('Tontolo');
    expect(result.subtitleText).toBe('Sous-titre');
    expect(result.bodyText).toBe('Corps');
  });

  it('always takes the image (mediaId + media) from the base, whatever the translation holds', () => {
    const media = { id: 'm1', url: 'https://cdn/fr.jpg', altText: 'FR' };
    const base = section({ mediaId: 'm1', media });
    const localized = section({ locale: 'MG', mediaId: 'other', media: { id: 'other', url: 'https://cdn/mg.jpg', altText: null } });

    const result = localizeSection(base, localized)!;

    expect(result.mediaId).toBe('m1');
    expect(result.media).toEqual(media);
  });
});

describe('mergeDataJson', () => {
  const baseItems = [
    { label: 'Mariage', imageUrl: 'https://cdn/a.jpg', href: '/creations' },
    { label: 'Costumes', imageUrl: 'https://cdn/b.jpg', href: '/creations' },
  ];

  it('keeps the base list structure and images, applying translated copy by index', () => {
    const merged = mergeDataJson(
      { items: baseItems },
      { items: [{ label: 'Fanambadiana', imageUrl: 'https://cdn/HACK.jpg' }, { label: 'Akanjo' }] },
    ) as { items: Record<string, unknown>[] };

    expect(merged.items).toEqual([
      { label: 'Fanambadiana', imageUrl: 'https://cdn/a.jpg', href: '/creations' },
      { label: 'Akanjo', imageUrl: 'https://cdn/b.jpg', href: '/creations' },
    ]);
  });

  it('falls back to the base item when the translation has fewer items or blank copy', () => {
    const merged = mergeDataJson({ items: baseItems }, { items: [{ label: '' }] }) as { items: Record<string, unknown>[] };

    expect(merged.items).toEqual(baseItems);
  });

  it('ignores extra translated items the base does not have (structure is edited in the base locale)', () => {
    const merged = mergeDataJson({ items: baseItems }, { items: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] }) as {
      items: unknown[];
    };

    expect(merged.items).toHaveLength(2);
  });

  it('overlays translated scalars and keeps untranslated base scalars', () => {
    expect(mergeDataJson({ eyebrow: 'MAISON', quote: 'Q' }, { eyebrow: 'TRANO' })).toEqual({ eyebrow: 'TRANO', quote: 'Q' });
  });

  it('returns the base when the translation has no dataJson', () => {
    expect(mergeDataJson({ eyebrow: 'MAISON' }, null)).toEqual({ eyebrow: 'MAISON' });
  });
});
