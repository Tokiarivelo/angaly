import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WhatsAppFab } from '../WhatsAppFab';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('WhatsAppFab', () => {
  it('links to wa.me with the configured number when set', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '261202212345');
    render(<WhatsAppFab />);

    expect(screen.getByRole('link', { name: 'Contacter ANGALY sur WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/261202212345',
    );
  });

  it('renders nothing when the number is not configured (never a hardcoded fallback)', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    const { container } = render(<WhatsAppFab />);
    expect(container).toBeEmptyDOMElement();
  });
});
