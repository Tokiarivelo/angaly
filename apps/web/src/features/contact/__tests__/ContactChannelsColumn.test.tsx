import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactChannelsColumn } from '../ui/ContactChannelsColumn';
import type { ContactChannels } from '../hooks/useContactChannels';

const CHANNELS: ContactChannels = {
  phone: { label: '+261 20 22 123 45', href: 'tel:+261202212345' },
  whatsapp: { href: 'https://wa.me/261202212345' },
  email: { label: 'contact@angaly.mg', href: 'mailto:contact@angaly.mg' },
  socials: [
    { label: 'Facebook', href: '#' },
    { label: 'Instagram', href: '#' },
  ],
  hours: [
    { label: 'Lun - Ven', value: '09:00 - 18:00' },
    { label: 'Samedi', value: '10:00 - 17:00' },
    { label: 'Dimanche', value: 'Fermé', isClosed: true },
  ],
};

describe('ContactChannelsColumn', () => {
  it('renders phone, WhatsApp, and email as real links', () => {
    render(<ContactChannelsColumn channels={CHANNELS} />);

    expect(screen.getByRole('link', { name: '+261 20 22 123 45' })).toHaveAttribute(
      'href',
      'tel:+261202212345',
    );
    expect(screen.getByRole('link', { name: 'Message WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/261202212345',
    );
    expect(screen.getByRole('link', { name: 'contact@angaly.mg' })).toHaveAttribute(
      'href',
      'mailto:contact@angaly.mg',
    );
  });

  it('renders every social channel', () => {
    render(<ContactChannelsColumn channels={CHANNELS} />);
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('renders the opening hours with the closed day styled distinctly', () => {
    render(<ContactChannelsColumn channels={CHANNELS} />);
    expect(screen.getByText('Lun - Ven')).toBeInTheDocument();
    const closedRow = screen.getByText('Dimanche').closest('li');
    expect(closedRow).toHaveClass('text-angaly-warm-gray');
  });
});
