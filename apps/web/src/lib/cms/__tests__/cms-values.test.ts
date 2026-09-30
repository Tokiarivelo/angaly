import { describe, expect, it } from 'vitest';

import { cmsList, cmsText, dataString, readOneOf } from '../cms-values';

describe('cms-values', () => {
  it('cmsText falls back for null, undefined and blank values', () => {
    expect(cmsText('Salut', 'Défaut')).toBe('Salut');
    expect(cmsText('  ', 'Défaut')).toBe('Défaut');
    expect(cmsText(null, 'Défaut')).toBe('Défaut');
    expect(cmsText(undefined, 'Défaut')).toBe('Défaut');
  });

  it('dataString reads a non-blank string key only', () => {
    expect(dataString({ eyebrow: 'A' }, 'eyebrow')).toBe('A');
    expect(dataString({ eyebrow: ' ' }, 'eyebrow')).toBeUndefined();
    expect(dataString({ eyebrow: 3 }, 'eyebrow')).toBeUndefined();
    expect(dataString(null, 'eyebrow')).toBeUndefined();
  });

  it('cmsList parses valid items, drops malformed ones, and returns undefined when nothing is left', () => {
    const parse = (item: Record<string, unknown>) => (typeof item['label'] === 'string' ? { label: item['label'] } : undefined);

    expect(cmsList({ links: [{ label: 'A' }, { nope: 1 }, 'x', { label: 'B' }] }, 'links', parse)).toEqual([{ label: 'A' }, { label: 'B' }]);
    expect(cmsList({ links: [{ nope: 1 }] }, 'links', parse)).toBeUndefined();
    expect(cmsList({ links: 'x' }, 'links', parse)).toBeUndefined();
    expect(cmsList(null, 'links', parse)).toBeUndefined();
  });

  it('readOneOf keeps only allowed values', () => {
    expect(readOneOf('gem', ['gem', 'heart'] as const)).toBe('gem');
    expect(readOneOf('star', ['gem', 'heart'] as const)).toBeUndefined();
  });
});
