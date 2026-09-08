import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppointmentCtaBand } from '../ui/AppointmentCtaBand';

describe('AppointmentCtaBand', () => {
  it('renders the heading and a rendez-vous CTA link', () => {
    render(<AppointmentCtaBand />);
    expect(screen.getByRole('heading', { name: 'Envie de concrétiser votre projet ?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
  });
});
