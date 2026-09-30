import { describe, expect, it } from 'vitest';
import { Locale } from '@angaly/types';

import { resolveDataJson, sectionEditorSchema } from '../schemas/section-editor.schema';

const base = { locale: Locale.FR };

describe('sectionEditorSchema / resolveDataJson', () => {
  it('rejects malformed raw JSON', () => {
    const result = sectionEditorSchema.safeParse({ ...base, dataJsonRaw: '{ nope' });
    expect(result.success).toBe(false);
  });

  it('rejects raw JSON that is not an object', () => {
    expect(sectionEditorSchema.safeParse({ ...base, dataJsonRaw: '[1,2]' }).success).toBe(false);
  });

  it('parses valid raw JSON into the object to persist', () => {
    const parsed = sectionEditorSchema.parse({ ...base, dataJsonRaw: '{"eyebrow":"A"}' });
    expect(resolveDataJson(parsed)).toEqual({ eyebrow: 'A' });
  });

  it('clears dataJson when the raw box is emptied', () => {
    expect(resolveDataJson(sectionEditorSchema.parse({ ...base, dataJsonRaw: '  ' }))).toBeNull();
  });

  it('uses the structured object when there is no raw box', () => {
    expect(resolveDataJson(sectionEditorSchema.parse({ ...base, dataJson: { quote: 'Q' } }))).toEqual({ quote: 'Q' });
  });

  it('leaves dataJson undefined (= keep stored value) when nothing was provided', () => {
    expect(resolveDataJson(sectionEditorSchema.parse(base))).toBeUndefined();
  });
});
