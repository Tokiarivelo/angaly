import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { serveCmsPage } from '@/lib/msw/cms-test-utils';
import { withQueryClient } from '@/lib/test-utils';

import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders the built-in default copy and links when the CMS has no rows', () => {
    render(<Footer />, { wrapper: withQueryClient() });

    expect(screen.getByRole('heading', { name: 'ANGALY' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mentions Légales' })).toHaveAttribute('href', '/mentions-legales');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Angaly Madagascar`))).toBeInTheDocument();
  });

  it('uses CMS copy, link lists and the {year} placeholder, keeping defaults for what is missing', async () => {
    serveCmsPage('footer', [
      { sectionKey: 'brand', bodyText: 'Nouvelle description.' },
      { sectionKey: 'informations', titleText: 'Infos', dataJson: { links: [{ label: 'FAQ', href: '/faq' }, { label: 'sans lien' }] } },
      { sectionKey: 'legal', titleText: '© {year} Maison Angaly' },
    ]);

    render(<Footer />, { wrapper: withQueryClient() });

    await waitFor(() => expect(screen.getByText('Nouvelle description.')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Infos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    expect(screen.queryByRole('link', { name: 'Mentions Légales' })).not.toBeInTheDocument();
    expect(screen.queryByText('sans lien')).not.toBeInTheDocument();
    expect(screen.getByText(`© ${new Date().getFullYear()} Maison Angaly`)).toBeInTheDocument();
    // Untouched section keeps its default column.
    expect(screen.getByRole('link', { name: 'Presse' })).toBeInTheDocument();
  });
});
