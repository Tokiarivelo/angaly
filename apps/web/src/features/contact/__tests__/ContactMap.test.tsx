import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactMap } from '../ui/ContactMap';

describe('ContactMap', () => {
  it('renders the fixed "Ateliers ANGALY" overlay card', () => {
    render(<ContactMap />);
    expect(screen.getByRole('heading', { name: 'Ateliers ANGALY' })).toBeInTheDocument();
  });
});
