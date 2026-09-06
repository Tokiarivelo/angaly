import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createTestQueryClient, withQueryClient } from '@/lib/test-utils';

import { TestimonialsCarousel } from '../ui/TestimonialsCarousel';

describe('TestimonialsCarousel', () => {
  it('renders nothing while testimonials are loading', () => {
    const { container } = render(<TestimonialsCarousel />, { wrapper: withQueryClient(createTestQueryClient()) });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the first testimonial once loaded, keyboard-navigable via the next/previous buttons', async () => {
    const user = userEvent.setup();
    render(<TestimonialsCarousel />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByText(/Nirina/)).toBeInTheDocument());
    expect(screen.getByText('Avis vérifié')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Témoignage suivant' }));
    expect(await screen.findByText(/Hery/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Témoignage précédent' }));
    expect(await screen.findByText(/Nirina/)).toBeInTheDocument();
  });

  it('navigates via a dot indicator', async () => {
    const user = userEvent.setup();
    render(<TestimonialsCarousel />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByText(/Nirina/)).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Témoignage 3' }));
    expect(await screen.findByText(/Fara/)).toBeInTheDocument();
  });

  it('navigates via a left-to-right swipe (previous)', async () => {
    render(<TestimonialsCarousel />, { wrapper: withQueryClient() });
    await waitFor(() => expect(screen.getByText(/Nirina/)).toBeInTheDocument());

    const carousel = screen.getByText(/Nirina/).closest('div.relative');
    if (!carousel) throw new Error('carousel container not found');

    fireEvent.touchStart(carousel, { touches: [{ clientX: 0 }] });
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 100 }] });

    expect(await screen.findByText(/Fara/)).toBeInTheDocument();
  });
});
