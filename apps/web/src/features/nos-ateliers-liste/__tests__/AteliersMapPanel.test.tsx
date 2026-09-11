import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { AteliersMapPanel } from '../ui/AteliersMapPanel';

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat",
    city: 'Antananarivo',
    phone: null,
    openingHours: {
      monday: { isOpen: false, slots: [] },
      tuesday: { isOpen: false, slots: [] },
      wednesday: { isOpen: false, slots: [] },
      thursday: { isOpen: false, slots: [] },
      friday: { isOpen: false, slots: [] },
      saturday: { isOpen: false, slots: [] },
      sunday: { isOpen: false, slots: [] },
    },
    services: [],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AteliersMapPanel', () => {
  it('renders one pin with a tooltip per atelier', () => {
    render(
      <AteliersMapPanel
        ateliers={[makeAtelier(), makeAtelier({ id: 'atelier-2', slug: 'ivandry', name: 'Ivandry' })]}
        activeSlug={null}
        onHoverChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Atelier Antananarivo Centre')).toBeInTheDocument();
    expect(screen.getByText('Ivandry')).toBeInTheDocument();
  });

  it('makes the active pin tooltip visible and reports hover changes', async () => {
    const user = userEvent.setup();
    const onHoverChange = vi.fn();
    render(
      <AteliersMapPanel ateliers={[makeAtelier()]} activeSlug={null} onHoverChange={onHoverChange} />,
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('opacity-0');

    await user.hover(tooltip.parentElement!);
    expect(onHoverChange).toHaveBeenCalledWith('antananarivo-centre');

    await user.unhover(tooltip.parentElement!);
    expect(onHoverChange).toHaveBeenCalledWith(null);
  });

  it('shows the tooltip at full opacity when the pin is the active one', () => {
    render(
      <AteliersMapPanel ateliers={[makeAtelier()]} activeSlug="antananarivo-centre" onHoverChange={vi.fn()} />,
    );
    expect(screen.getByRole('tooltip')).toHaveClass('opacity-100');
  });

  describe('with Google Maps configured', () => {
    const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaSyTestKey';
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      }
    });

    it('renders view mode buttons and toggles between Google Maps and editorial views', async () => {
      const user = userEvent.setup();
      render(
        <AteliersMapPanel
          ateliers={[makeAtelier(), makeAtelier({ id: 'atelier-2', slug: 'ivandry', name: 'Ivandry' })]}
          activeSlug={null}
          onHoverChange={vi.fn()}
        />,
      );

      const gmapBtn = screen.getByRole('button', { name: /Google Maps/i });
      const editorialBtn = screen.getByRole('button', { name: /Plan Éditorial/i });
      expect(gmapBtn).toBeInTheDocument();
      expect(editorialBtn).toBeInTheDocument();

      // Switch to editorial view
      await user.click(editorialBtn);
      expect(screen.getByText('Atelier Antananarivo Centre')).toBeInTheDocument();

      // Switch back to Google Maps
      await user.click(gmapBtn);
      expect(gmapBtn).toHaveClass('bg-angaly-navy');
    });
  });
});

