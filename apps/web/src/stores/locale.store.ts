import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Active site locale — routing/UI state only in Phase 1 (no `content` module
 * yet to actually translate page copy, see docs/pages/navigation-mobile.md
 * "Points d'attention"). Persisted so the choice survives navigation/reload.
 */
export type Locale = 'FR' | 'MG';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'FR',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'angaly-locale' },
  ),
);
