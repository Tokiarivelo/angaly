import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { AUTHOR_DISPLAY_NAME } from '../consts/journal-categories.const';
import { FeaturedArticleCard } from '../ui/FeaturedArticleCard';

function makeArticle(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-1',
    slug: 'eternite-nouvelle-collection',
    title: "L'Éternité : Au cœur de notre nouvelle collection",
    excerpt: 'Découvrez l’inspiration…',
    publishedAt: '2026-03-01T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'haute-couture', name: 'Haute Couture' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('FeaturedArticleCard', () => {
  it('renders the category tag, title, excerpt, a generic byline, and the real date', () => {
    render(<FeaturedArticleCard article={makeArticle()} />);

    expect(screen.getByText('Haute Couture')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: "L'Éternité : Au cœur de notre nouvelle collection" }),
    ).toBeInTheDocument();
    expect(screen.getByText(AUTHOR_DISPLAY_NAME)).toBeInTheDocument();
    expect(screen.getByText('1 mars 2026')).toBeInTheDocument();
  });

  it('links to the article detail route', () => {
    render(<FeaturedArticleCard article={makeArticle()} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/journal/eternite-nouvelle-collection');
  });

  it('renders the real photo when media is present', () => {
    render(
      <FeaturedArticleCard
        article={makeArticle({
          media: [{ id: 'm1', url: 'https://cdn.example/cover.jpg', altText: 'Couverture', sortOrder: 0 }],
        })}
      />,
    );
    expect(screen.getByRole('img', { name: 'Couverture' })).toBeInTheDocument();
  });

  it('does not render a date when publishedAt is null', () => {
    render(<FeaturedArticleCard article={makeArticle({ publishedAt: null })} />);
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
  });
});
