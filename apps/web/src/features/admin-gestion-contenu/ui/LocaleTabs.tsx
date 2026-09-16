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
    <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Langue">
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
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-angaly-navy text-angaly-navy'
                : 'border-transparent text-angaly-slate hover:text-angaly-navy'
            }`}
          >
            {LOCALE_LABELS[locale]}
            {!hasContent && <span className="ml-1 text-angaly-warning">•</span>}
          </button>
        );
      })}
    </div>
  );
};
