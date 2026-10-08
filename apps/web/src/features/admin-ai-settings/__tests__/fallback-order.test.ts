import { describe, expect, it } from 'vitest';
import { AiProviderId } from '@angaly/types';
import { MAX_FALLBACKS, moveFallback, toggleFallback } from '../utils/fallback-order';

const { OPENAI, ANTHROPIC, GROQ, GEMINI } = AiProviderId;

describe('toggleFallback', () => {
  it('appends in selection order and removes on a second toggle', () => {
    expect(toggleFallback([], OPENAI)).toEqual([OPENAI]);
    expect(toggleFallback([OPENAI], ANTHROPIC)).toEqual([OPENAI, ANTHROPIC]);
    expect(toggleFallback([OPENAI, ANTHROPIC], OPENAI)).toEqual([ANTHROPIC]);
  });

  it(`refuses a ${MAX_FALLBACKS + 1}th entry but still allows removing`, () => {
    const full = [OPENAI, ANTHROPIC, GROQ];
    expect(toggleFallback(full, GEMINI)).toBe(full);
    expect(toggleFallback(full, GROQ)).toEqual([OPENAI, ANTHROPIC]);
  });
});

describe('moveFallback', () => {
  it('swaps with the neighbour and ignores out-of-range moves', () => {
    expect(moveFallback([OPENAI, ANTHROPIC], ANTHROPIC, -1)).toEqual([ANTHROPIC, OPENAI]);
    expect(moveFallback([OPENAI, ANTHROPIC], OPENAI, 1)).toEqual([ANTHROPIC, OPENAI]);
    const chain = [OPENAI, ANTHROPIC];
    expect(moveFallback(chain, OPENAI, -1)).toBe(chain);
    expect(moveFallback(chain, ANTHROPIC, 1)).toBe(chain);
    expect(moveFallback(chain, GROQ, 1)).toBe(chain);
  });
});
