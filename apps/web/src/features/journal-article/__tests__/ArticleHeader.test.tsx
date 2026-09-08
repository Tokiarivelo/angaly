import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BlogPostDetailDto } from '@angaly/types';

import { ArticleHeader } from '../ui/ArticleHeader';

vi.mock('@/lib/author-profiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/author-profiles')>();
  return {
    ...actual,
    getAuthorProfile: vi.fn(actual.getAuthorProfile),
  };
});

function makeArticle(overrides: Partial<BlogPostDetailDto> = {}): BlogPostDetailDto {
  return {
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Comment choisir sa robe de mariée à Madagascar',
    excerpt: 'Excerpt',
    content: Array.from({ length: 400 }, () => 'mot').join(' '),
    publishedAt: '2026-03-01T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ArticleHeader', () => {
  it('renders the category tag, title, resolved author, date, and estimated reading time', () => {
    render(<ArticleHeader article={makeArticle()} />);

    expect(screen.getByText('Conseils mode')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Comment choisir sa robe de mariée à Madagascar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Par Mme. Fanja')).toBeInTheDocument();
    expect(screen.getByText('Maître Tailleur, ANGALY • 1 mars 2026 • 2 min de lecture')).toBeInTheDocument();
  });

  it('renders the real cover photo when media is present', () => {
    const { container } = render(
      <ArticleHeader
        article={makeArticle({
          media: [{ id: 'm1', url: 'https://cdn.example/cover.jpg', altText: '', sortOrder: 0 }],
        })}
      />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', expect.stringContaining('cdn.example'));
  });

  it('falls back to a gradient background when there is no cover photo', () => {
    const { container } = render(<ArticleHeader article={makeArticle({ media: [] })} />);
    expect(container.querySelector('img[alt=""]')).not.toBeInTheDocument();
  });

  it('renders the author avatar when the resolved profile has a photo', async () => {
    const { getAuthorProfile } = await import('@/lib/author-profiles');
    vi.mocked(getAuthorProfile).mockReturnValueOnce({
      displayName: 'Mme. Fanja',
      role: 'Maître Tailleur, ANGALY',
      bio: 'Bio',
      photoUrl: 'https://cdn.example/fanja.jpg',
    });

    render(<ArticleHeader article={makeArticle()} />);

    expect(screen.getByRole('img', { name: 'Mme. Fanja' })).toBeInTheDocument();
  });

  it('omits the role/date segments cleanly when publishedAt is null and author has no role', () => {
    render(
      <ArticleHeader
        article={makeArticle({ publishedAt: null, author: { id: 'user-2', email: 'someone@angaly.mg' } })}
      />,
    );
    expect(screen.getByText('2 min de lecture')).toBeInTheDocument();
  });
});
