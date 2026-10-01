'use client';

import React from 'react';
import { Locale } from '@angaly/types';

const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.FR]: 'Français',
  [Locale.MG]: 'Malagasy',
};

interface LocaleTabsProps {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
  availableLocales?: Locale[];
}

export const LocaleTabs: React.FC<LocaleTabsProps> = ({ activeLocale, onChange, availableLocales }) => {
  return (
    <div className="flex items-center bg-angaly-ivory/80 border border-angaly-border rounded-sm p-0.5 shadow-sm" role="tablist" aria-label="Langue">
      {Object.values(Locale).map((locale) => {
        const hasContent = availableLocales?.includes(locale) ?? true;
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(locale)}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all ${
              isActive
                ? 'bg-angaly-navy text-white shadow-sm'
                : 'text-angaly-slate hover:text-angaly-navy hover:bg-white/60'
            }`}
          >
            <span>{LOCALE_LABELS[locale]}</span>
            {!hasContent && <span className="ml-1 text-angaly-warning" title="Traduction non renseignée">•</span>}
          </button>
        );
      })}
    </div>
  );
};
