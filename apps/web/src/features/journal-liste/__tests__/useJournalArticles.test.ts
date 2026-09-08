import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useJournalArticles } from '../hooks/useJournalArticles';
import type { JournalCategorySlug } from '../consts/journal-categories.const';

const API_BASE_URL = 'http://localhost:3003/api';

function makeArticle(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-1',
    slug: 'post-1',
    title: 'Post 1',
    excerpt: 'Excerpt 1',
    publishedAt: '2026-03-01T00:00:00.000Z',
    category: { id: 'cat-mode', slug: 'conseils-mode', name: 'Conseils mode' },
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

describe('useJournalArticles', () => {
  it('resolves the most recent article as featured, excluded from popular and grid', async () => {
    const articles = [
      makeArticle({ id: 'p1', slug: 'p1' }),
      makeArticle({ id: 'p2', slug: 'p2' }),
      makeArticle({ id: 'p3', slug: 'p3' }),
    ];
    mockArticles(articles);

    const { result } = renderHook(() => useJournalArticles(null), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.featured?.id).toBe('p1');
    expect(result.current.popular.map((a) => a.id)).toEqual(['p2', 'p3']);
    expect(result.current.grid.map((a) => a.id)).toEqual(['p2', 'p3']);
  });

  it('filters the grid client-side by the active category slug, still excluding featured', async () => {
    const articles = [
      makeArticle({ id: 'p1', slug: 'p1', category: { id: 'cat-a', slug: 'tendances', name: 'Tendances' } }),
      makeArticle({ id: 'p2', slug: 'p2', category: { id: 'cat-b', slug: 'conseils-mode', name: 'Conseils mode' } }),
      makeArticle({ id: 'p3', slug: 'p3', category: { id: 'cat-a', slug: 'tendances', name: 'Tendances' } }),
    ];
    mockArticles(articles);

    const { result } = renderHook(() => useJournalArticles('tendances'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.grid.map((a) => a.id)).toEqual(['p3']);
  });

  it('reveals more articles on loadMore and resets to the first page when the category changes', async () => {
    const articles = Array.from({ length: 6 }, (_, i) =>
      makeArticle({ id: `p${i}`, slug: `p${i}` }),
    );
    mockArticles(articles);

    const { result, rerender } = renderHook(({ slug }) => useJournalArticles(slug), {
      wrapper: withQueryClient(),
      initialProps: { slug: null as JournalCategorySlug },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.grid).toHaveLength(3);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.grid).toHaveLength(5));
    expect(result.current.hasMore).toBe(false);

    rerender({ slug: 'conseils-mode' });
    await waitFor(() => expect(result.current.grid).toHaveLength(3));
  });
});
