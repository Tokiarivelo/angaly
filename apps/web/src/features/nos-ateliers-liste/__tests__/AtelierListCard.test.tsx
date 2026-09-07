import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { AtelierListCard } from '../ui/AtelierListCard';

const CLOSED = { isOpen: false, slots: [] };

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat, Ankorondrano",
    city: 'Antananarivo',
    phone: null,
    openingHours: {
      monday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      tuesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      wednesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      thursday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      friday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      saturday: CLOSED,
      sunday: CLOSED,
    },
    services: ['Essayage'],
    latitude: -18.8827,
    longitude: 47.5177,
    media: [{ id: 'm1', url: 'https://cdn.example/atelier.jpg', altText: 'Photo atelier', sortOrder: 0 }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AtelierListCard', () => {
  it('renders the photo, address, services, and a Google Maps directions link', () => {
    render(
      <AtelierListCard atelier={makeAtelier()} isFlagship={false} isActive={false} onHoverChange={vi.fn()} />,
    );

    expect(screen.getByRole('img', { name: 'Photo atelier' })).toBeInTheDocument();
    expect(screen.getByText('Essayage')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /itinéraire/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=-18.8827,47.5177',
    );
  });

  it('applies the active border/shadow styling when isActive is true', () => {
    const { container } = render(
      <AtelierListCard atelier={makeAtelier()} isFlagship={false} isActive={true} onHoverChange={vi.fn()} />,
    );
    expect(container.querySelector('article')).toHaveClass('border-angaly-navy', 'shadow-soft');
  });

  it('appends "(Flagship)" to the name when isFlagship is true', () => {
    render(
      <AtelierListCard atelier={makeAtelier()} isFlagship={true} isActive={false} onHoverChange={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: 'Atelier Antananarivo Centre (Flagship)' })).toBeInTheDocument();
  });

  it('renders no image and a fallback hours message when there is no photo and every day is closed', () => {
    render(
      <AtelierListCard
        atelier={makeAtelier({
          media: [],
          openingHours: {
            monday: CLOSED,
            tuesday: CLOSED,
            wednesday: CLOSED,
            thursday: CLOSED,
            friday: CLOSED,
            saturday: CLOSED,
            sunday: CLOSED,
          },
        })}
        isFlagship={false}
        isActive={false}
        onHoverChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Horaires non communiqués')).toBeInTheDocument();
  });

  it('notifies the parent on hover and unhover', async () => {
    const user = userEvent.setup();
    const onHoverChange = vi.fn();
    render(
      <AtelierListCard atelier={makeAtelier()} isFlagship={false} isActive={false} onHoverChange={onHoverChange} />,
    );

    await user.hover(screen.getByRole('heading', { name: 'Atelier Antananarivo Centre' }));
    expect(onHoverChange).toHaveBeenCalledWith('antananarivo-centre');

    await user.unhover(screen.getByRole('heading', { name: 'Atelier Antananarivo Centre' }));
    expect(onHoverChange).toHaveBeenCalledWith(null);
  });
});
