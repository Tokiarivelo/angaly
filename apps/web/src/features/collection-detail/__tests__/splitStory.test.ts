import { describe, expect, it } from 'vitest';

import { splitStory } from '../utils/splitStory';

describe('splitStory', () => {
  it('splits a story on blank lines into paragraphs', () => {
    const story = 'Premier paragraphe.\n\nDeuxième paragraphe.';
    expect(splitStory(story, null)).toEqual(['Premier paragraphe.', 'Deuxième paragraphe.']);
  });

  it('falls back to the description when there is no story', () => {
    expect(splitStory(null, 'Une description.')).toEqual(['Une description.']);
  });

  it('returns an empty array when neither story nor description exist', () => {
    expect(splitStory(null, null)).toEqual([]);
  });

  it('ignores extra blank lines and whitespace', () => {
    const story = '  Premier.  \n\n\n  Deuxième.  ';
    expect(splitStory(story, null)).toEqual(['Premier.', 'Deuxième.']);
  });
});
