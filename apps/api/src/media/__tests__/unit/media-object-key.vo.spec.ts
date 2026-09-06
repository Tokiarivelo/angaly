import { buildObjectKey } from '../../domain/value-objects/media-object-key.vo';

describe('buildObjectKey', () => {
  it('builds an object key from the filename extension and a unique token', () => {
    expect(buildObjectKey('robe-eternelle.JPG', 'token-1')).toBe('token-1.jpg');
  });

  it('prefixes the key when keyPrefix is given', () => {
    expect(buildObjectKey('robe-eternelle.png', 'token-1', 'creations')).toBe(
      'creations/token-1.png',
    );
  });

  it('keeps only the last segment when the filename has multiple dots', () => {
    expect(buildObjectKey('robe.eternelle.v2.png', 'token-1')).toBe('token-1.png');
  });

  it('falls back to "bin" when the filename has no extension', () => {
    expect(buildObjectKey('no-extension', 'token-1')).toBe('token-1.bin');
  });

  it('falls back to "bin" for a dotfile with no real extension', () => {
    expect(buildObjectKey('.gitignore', 'token-1')).toBe('token-1.bin');
  });
});
