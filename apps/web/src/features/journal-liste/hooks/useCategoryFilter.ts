import { useState } from 'react';

import type { JournalCategorySlug } from '../consts/journal-categories.const';

/** Active category pill — `null` means "Tout". */
export function useCategoryFilter(): {
  activeSlug: JournalCategorySlug;
  setActiveSlug: (slug: JournalCategorySlug) => void;
} {
  const [activeSlug, setActiveSlug] = useState<JournalCategorySlug>(null);
  return { activeSlug, setActiveSlug };
}
