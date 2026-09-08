import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoadMoreButton } from '../ui/LoadMoreButton';

describe('LoadMoreButton', () => {
  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<LoadMoreButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: "Voir plus d'articles" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
