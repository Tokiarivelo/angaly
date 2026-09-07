import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierDto } from '@angaly/types';

import { AtelierInfoPanel } from '../ui/AtelierInfoPanel';

function makeAtelier(overrides: Partial<AtelierDto> = {}): AtelierDto {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: "12 Rue de l'Artisanat, Ankorondrano",
    city: 'Antananarivo',
    phone: '+261 20 22 123 45',
    openingHours: {
      monday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      tuesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      wednesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      thursday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      friday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
      saturday: { isOpen: true, slots: [{ open: '10:00', close: '17:00' }] },
      sunday: { isOpen: false, slots: [] },
    },
    services: ['Essayages', 'Retouches'],
    latitude: -18.8827,
    longitude: 47.5177,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AtelierInfoPanel', () => {
  it('renders the address, a click-to-call phone link, and both action links', () => {
    render(<AtelierInfoPanel atelier={makeAtelier()} />);

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'SPAN' &&
          element.textContent === "12 Rue de l'Artisanat, AnkorondranoAntananarivo",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+261 20 22 123 45' })).toHaveAttribute(
      'href',
      'tel:+261 20 22 123 45',
    );
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous dans cet atelier' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous?atelierId=atelier-1',
    );
    expect(screen.getByRole('link', { name: "Voir l'itinéraire" })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=-18.8827,47.5177',
    );
  });

  it('omits the phone line entirely when phone is null, rather than a dead tel: link', () => {
    render(<AtelierInfoPanel atelier={makeAtelier({ phone: null })} />);
    expect(screen.queryByRole('link', { name: /^\+/ })).not.toBeInTheDocument();
  });
});
