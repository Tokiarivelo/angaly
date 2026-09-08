import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { BlogPostDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useRelatedArticles } from '../hooks/useRelatedArticles';

const API_BASE_URL = 'http://localhost:3003/api';

function makeArticle(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-2',
    slug: 'post-2',
    title: 'Post 2',
    excerpt: 'Excerpt',
    publishedAt: '2026-02-01T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useRelatedArticles', () => {
  it('resolves the plain array returned by the related endpoint', async () => {
    server.use(
      http.get(`${API_BASE_URL}/blog-posts/post-1/related`, () =>
        HttpResponse.json({ success: true, data: [makeArticle(), makeArticle({ id: 'post-3', slug: 'post-3' })] }),
      ),
    );

    const { result } = renderHook(() => useRelatedArticles('post-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.articles.map((a) => a.id)).toEqual(['post-2', 'post-3']);
  });

  it('defaults to an empty array before data resolves', () => {
    server.use(http.get(`${API_BASE_URL}/blog-posts/post-1/related`, () => HttpResponse.json({ success: true, data: [] })));

    const { result } = renderHook(() => useRelatedArticles('post-1'), { wrapper: withQueryClient() });

    expect(result.current.articles).toEqual([]);
  });
});
