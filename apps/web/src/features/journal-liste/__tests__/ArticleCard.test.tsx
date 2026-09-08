import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { ArticleCard } from '../ui/ArticleCard';

function makeArticle(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-1',
    slug: 'porter-bleu-nuit-elegance',
    title: 'Comment porter le bleu nuit avec élégance',
    excerpt: 'Couleur signature…',
    publishedAt: '2026-02-20T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ArticleCard', () => {
  it('renders the category, title, and excerpt', () => {
    render(<ArticleCard article={makeArticle()} isWide={false} />);
    expect(screen.getByText('Conseils mode')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comment porter le bleu nuit avec élégance' })).toBeInTheDocument();
  });

  it('links to the article detail route', () => {
    render(<ArticleCard article={makeArticle()} isWide={false} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/journal/porter-bleu-nuit-elegance');
  });

  it('shows the "Lire l\'article" link and spans both columns only when isWide is true', () => {
    render(<ArticleCard article={makeArticle()} isWide={true} />);
    expect(screen.getByText("Lire l'article")).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveClass('md:col-span-2');
  });

  it('hides the "Lire l\'article" link for a normal (non-wide) card', () => {
    render(<ArticleCard article={makeArticle()} isWide={false} />);
    expect(screen.queryByText("Lire l'article")).not.toBeInTheDocument();
  });

  it('renders the real photo when media is present', () => {
    render(
      <ArticleCard
        article={makeArticle({
          media: [{ id: 'm1', url: 'https://cdn.example/cover.jpg', altText: 'Couverture', sortOrder: 0 }],
        })}
        isWide={false}
      />,
    );
    expect(screen.getByRole('img', { name: 'Couverture' })).toBeInTheDocument();
  });

  it('renders the real photo for a wide card too', () => {
    render(
      <ArticleCard
        article={makeArticle({
          media: [{ id: 'm1', url: 'https://cdn.example/cover.jpg', altText: 'Couverture', sortOrder: 0 }],
        })}
        isWide={true}
      />,
    );
    expect(screen.getByRole('img', { name: 'Couverture' })).toBeInTheDocument();
  });
});
