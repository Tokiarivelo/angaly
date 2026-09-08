import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SocialShareBar } from '../ui/SocialShareBar';

describe('SocialShareBar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Facebook, WhatsApp, and copy-link buttons', () => {
    render(<SocialShareBar article={{ title: 'Mon Article' }} />);
    expect(screen.getByTitle('Facebook')).toBeInTheDocument();
    expect(screen.getByTitle('WhatsApp')).toBeInTheDocument();
    expect(screen.getByTitle('Copier le lien')).toBeInTheDocument();
  });

  it('shows "Lien copié !" feedback after copying the link', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<SocialShareBar article={{ title: 'Mon Article' }} />);

    await user.click(screen.getByTitle('Copier le lien'));

    expect(await screen.findByText('Lien copié !')).toBeInTheDocument();
  });

  it('opens Facebook share on click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();
    render(<SocialShareBar article={{ title: 'Mon Article' }} />);

    await user.click(screen.getByTitle('Facebook'));

    expect(openSpy).toHaveBeenCalled();
  });
});
