import { render, screen } from '@testing-library/react';
import { ProductAvailability } from '@angaly/types';
import { describe, expect, it } from 'vitest';

import { ProductStatusBadge } from '../ui/ProductStatusBadge';

describe('ProductStatusBadge', () => {
  it('renders nothing for AVAILABLE', () => {
    const { container } = render(<ProductStatusBadge status={ProductAvailability.AVAILABLE} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a centered "Épuisé" overlay for OUT_OF_STOCK', () => {
    render(<ProductStatusBadge status={ProductAvailability.OUT_OF_STOCK} />);
    expect(screen.getByText('Épuisé')).toBeInTheDocument();
  });

  it('renders "Dernière pièce" for LAST_PIECE', () => {
    render(<ProductStatusBadge status={ProductAvailability.LAST_PIECE} />);
    expect(screen.getByText('Dernière pièce')).toBeInTheDocument();
  });

  it('renders the delay copy for ON_ORDER', () => {
    render(<ProductStatusBadge status={ProductAvailability.ON_ORDER} />);
    expect(screen.getByText('Sur commande — délai 3 semaines')).toBeInTheDocument();
  });

  it('renders "Réservé" for RESERVED', () => {
    render(<ProductStatusBadge status={ProductAvailability.RESERVED} />);
    expect(screen.getByText('Réservé')).toBeInTheDocument();
  });
});
