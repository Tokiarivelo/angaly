import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { PopularArticlesWidget } from '../ui/PopularArticlesWidget';

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

describe('PopularArticlesWidget', () => {
  it('renders every popular article with a link to its detail page', () => {
    render(
      <PopularArticlesWidget
        articles={[
          makeArticle({ id: 'p1', slug: 'p1', title: 'P1' }),
          makeArticle({ id: 'p2', slug: 'p2', title: 'P2' }),
        ]}
      />,
    );

    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /P2/ })).toHaveAttribute('href', '/journal/p2');
  });

  it('renders nothing when there are no articles', () => {
    const { container } = render(<PopularArticlesWidget articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the real photo when media is present', () => {
    render(
      <PopularArticlesWidget
        articles={[
          makeArticle({
            id: 'p1',
            slug: 'p1',
            media: [{ id: 'm1', url: 'https://cdn.example/thumb.jpg', altText: 'Miniature', sortOrder: 0 }],
          }),
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: 'Miniature' })).toBeInTheDocument();
  });
});
