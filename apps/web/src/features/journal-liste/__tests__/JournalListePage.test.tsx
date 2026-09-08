import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { JournalListePage } from '../ui/JournalListePage';

const API_BASE_URL = 'http://localhost:3003/api';

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

function mockArticles(articles: BlogPostDto[]) {
  server.use(
    http.get(`${API_BASE_URL}/blog-posts`, () =>
      HttpResponse.json({
        success: true,
        data: {
          data: articles,
          meta: { total: articles.length, page: 1, limit: 50, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        },
      }),
    ),
  );
}

describe('JournalListePage', () => {
  it('renders the header, featured article, grid, popular widget, and newsletter card', async () => {
    mockArticles([
      makeArticle({
        id: 'featured',
        slug: 'featured',
        title: 'Featured Article',
        category: { id: 'cat-hc', slug: 'haute-couture', name: 'Haute Couture' },
      }),
      makeArticle({ id: 'p1', slug: 'p1', title: 'Grid Article 1' }),
      makeArticle({ id: 'p2', slug: 'p2', title: 'Grid Article 2' }),
    ]);

    const Wrapper = withQueryClient();
    render(<JournalListePage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Le Journal Angaly' })).toBeInTheDocument(),
    );

    expect(screen.getByRole('heading', { name: 'Featured Article' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Grid Article 1' })).toBeInTheDocument();
    expect(screen.getByText('Articles Populaires')).toBeInTheDocument();
    expect(screen.getByText('La Lettre Angaly')).toBeInTheDocument();
  });

  it('reveals more articles when "Voir plus d\'articles" is clicked', async () => {
    mockArticles([
      makeArticle({ id: 'featured', slug: 'featured', title: 'Featured Article' }),
      ...Array.from({ length: 5 }, (_, i) =>
        makeArticle({ id: `p${i}`, slug: `p${i}`, title: `Grid Article ${i}` }),
      ),
    ]);

    const user = userEvent.setup();
    const Wrapper = withQueryClient();
    render(<JournalListePage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Grid Article 0' })).toBeInTheDocument(),
    );
    expect(screen.queryByRole('heading', { level: 3, name: 'Grid Article 4' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: "Voir plus d'articles" }));

    expect(screen.getByRole('heading', { level: 3, name: 'Grid Article 4' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Voir plus d'articles" })).not.toBeInTheDocument();
  });

  it('hides the featured article once a specific category pill is active', async () => {
    mockArticles([
      makeArticle({
        id: 'featured',
        slug: 'featured',
        title: 'Featured Article',
        category: { id: 'cat-hc', slug: 'haute-couture', name: 'Haute Couture' },
      }),
      makeArticle({ id: 'p1', slug: 'p1', title: 'Grid Article 1', category: { id: 'cat-mode', slug: 'conseils-mode', name: 'Conseils mode' } }),
    ]);

    const user = userEvent.setup();
    const Wrapper = withQueryClient();
    render(<JournalListePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Featured Article' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Conseils mode' }));

    expect(screen.queryByRole('heading', { name: 'Featured Article' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Grid Article 1' })).toBeInTheDocument();
  });

  it('filters the grid when a category pill with no matching articles is selected', async () => {
    mockArticles([
      makeArticle({ id: 'featured', slug: 'featured', title: 'Featured Article' }),
      makeArticle({ id: 'p1', slug: 'p1', title: 'Grid Article 1' }),
    ]);

    const user = userEvent.setup();
    const Wrapper = withQueryClient();
    render(<JournalListePage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Grid Article 1' })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Tendances' }));

    expect(screen.getByText('Aucun article dans cette catégorie pour le moment.')).toBeInTheDocument();
  });
});
