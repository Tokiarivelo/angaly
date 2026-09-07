import { useState } from 'react';

/** Shared pin↔card hover state — the only interactive state the map/list split needs. */
export function useAteliersMap(): {
  activeSlug: string | null;
  setActiveSlug: (slug: string | null) => void;
} {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  return { activeSlug, setActiveSlug };
}
