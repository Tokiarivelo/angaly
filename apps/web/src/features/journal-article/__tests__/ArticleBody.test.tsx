import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleBody } from '../ui/ArticleBody';

describe('ArticleBody', () => {
  it('splits content on blank lines into separate paragraphs', () => {
    render(<ArticleBody content={'Premier paragraphe.\n\nDeuxième paragraphe.\n\nTroisième paragraphe.'} />);

    expect(screen.getByText('Premier paragraphe.')).toBeInTheDocument();
    expect(screen.getByText('Deuxième paragraphe.')).toBeInTheDocument();
    expect(screen.getByText('Troisième paragraphe.')).toBeInTheDocument();
  });

  it('styles the first paragraph as the lede, distinct from the rest', () => {
    render(<ArticleBody content={'Lede.\n\nCorps.'} />);

    expect(screen.getByText('Lede.')).toHaveClass('italic');
    expect(screen.getByText('Corps.')).not.toHaveClass('italic');
  });

  it('ignores extra blank lines between paragraphs', () => {
    const { container } = render(<ArticleBody content={'A.\n\n\n\nB.'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });
});
