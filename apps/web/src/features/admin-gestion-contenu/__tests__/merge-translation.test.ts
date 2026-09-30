import { describe, expect, it } from 'vitest';

import { mergeTranslatedData, pickText } from '../utils/merge-translation';

describe('merge-translation (editor mirror of the API localizeSection)', () => {
  it('pickText prefers translated copy and falls back to the base for blanks', () => {
    expect(pickText('Salama', 'Bonjour')).toBe('Salama');
    expect(pickText('  ', 'Bonjour')).toBe('Bonjour');
    expect(pickText(null, 'Bonjour')).toBe('Bonjour');
    expect(pickText(undefined, undefined)).toBeNull();
  });

  it('keeps the base list length/order and images, overlaying translated copy by index', () => {
    const base = { items: [{ label: 'Mariage', imageUrl: 'https://cdn/a.jpg' }, { label: 'Costumes', imageUrl: 'https://cdn/b.jpg' }] };
    const translated = { items: [{ label: 'Fanambadiana', imageUrl: 'https://cdn/HACK.jpg' }] };

    expect(mergeTranslatedData(base, translated)).toEqual({
      items: [
        { label: 'Fanambadiana', imageUrl: 'https://cdn/a.jpg' },
        { label: 'Costumes', imageUrl: 'https://cdn/b.jpg' },
      ],
    });
  });

  it('overlays translated scalars only when non-blank', () => {
    expect(mergeTranslatedData({ eyebrow: 'MAISON', quote: 'Q' }, { eyebrow: 'TRANO', quote: '' })).toEqual({ eyebrow: 'TRANO', quote: 'Q' });
  });

  it('returns the base when there is no translated data', () => {
    expect(mergeTranslatedData({ eyebrow: 'MAISON' }, null)).toEqual({ eyebrow: 'MAISON' });
  });
});
