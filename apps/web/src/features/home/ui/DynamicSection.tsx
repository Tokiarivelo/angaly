'use client';

import React from 'react';
import type { PublicPageSectionDto } from '../api/home.api';
import { CmsComponentRenderer } from '@/features/admin-gestion-contenu/ui/components/CmsComponentRenderer';

interface DynamicSectionProps {
  section: PublicPageSectionDto;
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  return (
    <div data-testid={`dynamic-section-${section.sectionKey}`} className="w-full">
      <CmsComponentRenderer
        page={section.page}
        sectionKey={section.sectionKey}
        content={{
          titleText: section.titleText,
          subtitleText: section.subtitleText,
          bodyText: section.bodyText,
          ctaPrimaryLabel: section.ctaPrimaryLabel,
          ctaSecondaryLabel: section.ctaSecondaryLabel,
          dataJson: section.dataJson as Record<string, unknown> | null,
        }}
        image={section.media ? { url: section.media.url, altText: section.media.altText } : null}
      />
    </div>
  );
};
