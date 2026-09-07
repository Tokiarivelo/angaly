import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AtelierOpeningHours } from '@angaly/types';

import { AtelierOpeningHoursList } from '../ui/AtelierOpeningHoursList';

const HOURS: AtelierOpeningHours = {
  monday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  tuesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  wednesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  thursday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  friday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  saturday: { isOpen: true, slots: [{ open: '10:00', close: '17:00' }] },
  sunday: { isOpen: false, slots: [] },
};

describe('AtelierOpeningHoursList', () => {
  it('renders each grouped row, with Dimanche shown as Fermé', () => {
    render(<AtelierOpeningHoursList openingHours={HOURS} />);

    expect(screen.getByText('Lundi - Vendredi')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('Samedi')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 17:00')).toBeInTheDocument();
    expect(screen.getByText('Dimanche')).toBeInTheDocument();
    expect(screen.getByText('Fermé')).toBeInTheDocument();
  });

  it('applies the muted style to the closed row', () => {
    render(<AtelierOpeningHoursList openingHours={HOURS} />);
    const closedRow = screen.getByText('Dimanche').closest('li');
    expect(closedRow).toHaveClass('text-angaly-warm-gray');
  });
});
