import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QuickLinksRow } from '../ui/QuickLinksRow';

describe('QuickLinksRow', () => {
  it('renders the real 3 quick links (not the originally planned Sur Mesure/Contact)', () => {
    render(<QuickLinksRow />);

    expect(screen.getByRole('link', { name: 'Nos Créations' })).toHaveAttribute('href', '/creations');
    expect(screen.getByRole('link', { name: 'Le Journal' })).toHaveAttribute('href', '/journal');
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
  });
});
