import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { RelatedArticlesRow } from '../ui/RelatedArticlesRow';

function makeArticle(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-2',
    slug: 'post-2',
    title: 'Post 2',
    excerpt: 'Excerpt',
    publishedAt: '2026-02-01T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'tendances', name: 'Tendances' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('RelatedArticlesRow', () => {
  it('renders every related article via the reused ArticleCard', () => {
    render(<RelatedArticlesRow articles={[makeArticle(), makeArticle({ id: 'post-3', slug: 'post-3', title: 'Post 3' })]} />);

    expect(screen.getByRole('heading', { name: 'À lire aussi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Post 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Post 3' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorer le Journal' })).toHaveAttribute('href', '/journal');
  });

  it('renders nothing when there are no related articles', () => {
    const { container } = render(<RelatedArticlesRow articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
