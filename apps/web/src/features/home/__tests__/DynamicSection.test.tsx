import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Locale } from '@angaly/types';

import { DynamicSection } from '../ui/DynamicSection';
import type { PublicPageSectionDto } from '../api/home.api';

describe('DynamicSection', () => {
  it('renders a custom hero section with high-fidelity component styling', () => {
    const section: PublicPageSectionDto = {
      page: 'accueil',
      sectionKey: 'collection-capsule',
      locale: Locale.FR,
      titleText: 'Capsule Étoilée',
      subtitleText: 'ÉDITION LIMITÉE',
      bodyText: 'Soies précieuses brodées à la main.',
      ctaPrimaryLabel: 'Découvrir la capsule',
      ctaSecondaryLabel: null,
      dataJson: { templateKind: 'hero-cinematic', eyebrow: 'ÉDITION EXCLUSIVE' },
      mediaId: 'm-1',
      media: { id: 'm-1', url: 'https://cdn.example/capsule.jpg', altText: 'Capsule Étoilée' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    render(<DynamicSection section={section} />);

    expect(screen.getByTestId('dynamic-section-collection-capsule')).toBeInTheDocument();
    expect(screen.getByText('Capsule Étoilée')).toBeInTheDocument();
    expect(screen.getByText('ÉDITION EXCLUSIVE')).toBeInTheDocument();
    expect(screen.getByText('Découvrir la capsule')).toBeInTheDocument();
  });

  it('renders a custom cards-grid section with high-fidelity cards', () => {
    const section: PublicPageSectionDto = {
      page: 'accueil',
      sectionKey: 'univers-accessoires',
      locale: Locale.FR,
      titleText: 'Accessoires Précieux',
      subtitleText: 'DETAILS COUTURE',
      bodyText: null,
      ctaPrimaryLabel: null,
      ctaSecondaryLabel: null,
      dataJson: {
        templateKind: 'cards-grid',
        items: [
          { label: 'Voiles & Écharpes', imageUrl: 'https://cdn.example/voile.jpg' },
          { label: 'Bijoux de Tête', imageUrl: 'https://cdn.example/bijou.jpg' },
        ],
      },
      mediaId: null,
      media: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    render(<DynamicSection section={section} />);

    expect(screen.getByTestId('dynamic-section-univers-accessoires')).toBeInTheDocument();
    expect(screen.getByText('Accessoires Précieux')).toBeInTheDocument();
    expect(screen.getByText('Voiles & Écharpes')).toBeInTheDocument();
    expect(screen.getByText('Bijoux de Tête')).toBeInTheDocument();
  });
});
