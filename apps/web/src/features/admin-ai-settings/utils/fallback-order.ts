import type { AiProviderId } from '@angaly/types';

/** Same cap as the API (`UpdateAiRoutingDto`). */
export const MAX_FALLBACKS = 3;

/** Adds the provider at the end of the chain, or removes it. A full chain refuses further additions. */
export const toggleFallback = (chain: AiProviderId[], provider: AiProviderId): AiProviderId[] => {
  if (chain.includes(provider)) return chain.filter((p) => p !== provider);
  return chain.length >= MAX_FALLBACKS ? chain : [...chain, provider];
};

/** Moves one entry up (-1) or down (+1); out-of-range moves leave the chain unchanged. */
export const moveFallback = (
  chain: AiProviderId[],
  provider: AiProviderId,
  direction: -1 | 1,
): AiProviderId[] => {
  const from = chain.indexOf(provider);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= chain.length) return chain;
  const next = [...chain];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
};
