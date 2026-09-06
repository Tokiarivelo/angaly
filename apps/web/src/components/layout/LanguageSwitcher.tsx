'use client';

import { useLocaleStore } from '@/stores/locale.store';
import { cn } from '@/lib/utils';

/**
 * Functional locale toggle (persisted UI state) — page copy doesn't switch
 * yet since no `content`/MG translations exist before Phase 6, see
 * docs/pages/navigation-mobile.md "Points d'attention".
 */
export function LanguageSwitcher() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <div className="flex items-center gap-2 text-xs" role="group" aria-label="Choisir la langue">
      <button
        type="button"
        onClick={() => setLocale('FR')}
        aria-pressed={locale === 'FR'}
        className={cn('tracking-wide', locale === 'FR' ? 'text-white' : 'text-white/50 hover:text-white/80')}
      >
        Français
      </button>
      <span aria-hidden="true" className="text-white/30">
        /
      </span>
      <button
        type="button"
        onClick={() => setLocale('MG')}
        aria-pressed={locale === 'MG'}
        className={cn('tracking-wide', locale === 'MG' ? 'text-white' : 'text-white/50 hover:text-white/80')}
      >
        Malagasy
      </button>
    </div>
  );
}
