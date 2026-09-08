import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundIllustration } from '../ui/NotFoundIllustration';

describe('NotFoundIllustration', () => {
  it('renders as a purely decorative element, hidden from assistive tech', () => {
    const { container } = render(<NotFoundIllustration />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
