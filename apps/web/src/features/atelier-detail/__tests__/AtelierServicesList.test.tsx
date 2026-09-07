import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AtelierServicesList } from '../ui/AtelierServicesList';

describe('AtelierServicesList', () => {
  it('renders every service', () => {
    render(<AtelierServicesList services={['Essayages', 'Retouches']} />);
    expect(screen.getByText('Essayages')).toBeInTheDocument();
    expect(screen.getByText('Retouches')).toBeInTheDocument();
  });

  it('spans the last item across both columns when the count is odd', () => {
    render(<AtelierServicesList services={['Essayages', 'Retouches', 'Retrait de commandes']} />);
    const lastItem = screen.getByText('Retrait de commandes').closest('li');
    expect(lastItem).toHaveClass('sm:col-span-2');
  });

  it('does not span the last item when the count is even', () => {
    render(<AtelierServicesList services={['Essayages', 'Retouches']} />);
    const lastItem = screen.getByText('Retouches').closest('li');
    expect(lastItem).not.toHaveClass('sm:col-span-2');
  });

  it('renders nothing when there are no services', () => {
    const { container } = render(<AtelierServicesList services={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
