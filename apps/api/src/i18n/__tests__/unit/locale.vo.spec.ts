import {
  DEFAULT_LOCALE,
  isLocale,
  normalizeLocale,
  parseAcceptLanguage,
  SUPPORTED_LOCALES,
} from '../../domain/value-objects/locale.vo';

describe('SUPPORTED_LOCALES / DEFAULT_LOCALE', () => {
  it('lists FR and MG, defaulting to FR', () => {
    expect(SUPPORTED_LOCALES).toEqual(['FR', 'MG']);
    expect(DEFAULT_LOCALE).toBe('FR');
  });
});

describe('isLocale', () => {
  it('accepts an exact supported locale', () => {
    expect(isLocale('FR')).toBe(true);
    expect(isLocale('MG')).toBe(true);
  });

  it('rejects lowercase or unsupported values (exact match only)', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('EN')).toBe(false);
  });
});

describe('normalizeLocale', () => {
  it('uppercases and matches a supported locale', () => {
    expect(normalizeLocale('fr')).toBe('FR');
    expect(normalizeLocale(' mg ')).toBe('MG');
  });

  it('returns null for undefined, empty, or unsupported input', () => {
    expect(normalizeLocale(undefined)).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
    expect(normalizeLocale('')).toBeNull();
    expect(normalizeLocale('en')).toBeNull();
  });
});

describe('parseAcceptLanguage', () => {
  it('picks the first supported locale, ignoring quality values', () => {
    expect(parseAcceptLanguage('fr-FR,fr;q=0.9,mg;q=0.8')).toBe('FR');
  });

  it('skips unsupported entries to find a supported one', () => {
    expect(parseAcceptLanguage('en-US,en;q=0.9,mg;q=0.5')).toBe('MG');
  });

  it('returns null when nothing matches, or the header is absent', () => {
    expect(parseAcceptLanguage('en-US,de;q=0.9')).toBeNull();
    expect(parseAcceptLanguage(undefined)).toBeNull();
    expect(parseAcceptLanguage('')).toBeNull();
  });
});
