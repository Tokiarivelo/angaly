import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AtelierMiniMap } from '../ui/AtelierMiniMap';

describe('AtelierMiniMap', () => {
  it('renders a single centered pin marker', () => {
    const { container } = render(<AtelierMiniMap />);
    expect(container.querySelector('.bg-angaly-navy.rounded-full')).toBeInTheDocument();
  });
});
