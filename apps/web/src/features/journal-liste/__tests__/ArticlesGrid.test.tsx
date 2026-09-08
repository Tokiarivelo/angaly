import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { ArticlesGrid } from '../ui/ArticlesGrid';

function makeArticle(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-1',
    slug: 'post-1',
    title: 'Post 1',
    excerpt: 'Excerpt',
    publishedAt: '2026-02-20T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ArticlesGrid', () => {
  it('renders every article and makes every 3rd one wide', () => {
    render(
      <ArticlesGrid
        articles={[
          makeArticle({ id: 'p1', slug: 'p1', title: 'P1' }),
          makeArticle({ id: 'p2', slug: 'p2', title: 'P2' }),
          makeArticle({ id: 'p3', slug: 'p3', title: 'P3' }),
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: /P3/ })).toHaveClass('md:col-span-2');
    expect(screen.getByRole('link', { name: /P1/ })).not.toHaveClass('md:col-span-2');
  });

  it('shows an empty-category message when there are no articles', () => {
    render(<ArticlesGrid articles={[]} />);
    expect(screen.getByText('Aucun article dans cette catégorie pour le moment.')).toBeInTheDocument();
  });
});
