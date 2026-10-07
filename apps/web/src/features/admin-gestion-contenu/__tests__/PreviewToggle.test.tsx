import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PreviewToggle } from '../ui/PreviewToggle';

describe('PreviewToggle', () => {
  const DEFAULT_PROPS = {
    isOpen: true,
    onToggle: vi.fn(),
    content: {
      titleText: 'ANGALY COUTURE',
      subtitleText: 'Collection 2026',
      bodyText: 'Lignes épurées et soies sauvages.',
      ctaPrimaryLabel: 'Prendre rendez-vous',
    },
    image: { url: 'https://cdn.example/image.jpg', altText: 'Hero' },
    page: 'accueil',
    sectionKey: 'hero',
    publicHref: '/',
  };

  it('renders high-fidelity hero preview for page="accueil" section="hero"', () => {
    render(<PreviewToggle {...DEFAULT_PROPS} />);

    const preview = screen.getByTestId('section-preview');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveTextContent('ANGALY COUTURE');
    expect(preview).toHaveTextContent('Collection 2026');
    expect(preview).toHaveTextContent('Prendre rendez-vous');
  });

  it('allows switching to mobile format', async () => {
    const user = userEvent.setup();
    render(<PreviewToggle {...DEFAULT_PROPS} />);

    const mobileBtn = screen.getByRole('button', { name: 'Mobile' });
    await user.click(mobileBtn);

    expect(mobileBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows switching between isolated component and full landing page context', async () => {
    const user = userEvent.setup();
    render(<PreviewToggle {...DEFAULT_PROPS} />);

    const landingPageContextBtn = screen.getByRole('button', { name: /Contexte Accueil/i });
    await user.click(landingPageContextBtn);

    expect(screen.getByTestId('live-landing-page-preview')).toBeInTheDocument();
  });
});
