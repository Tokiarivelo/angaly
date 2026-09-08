import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { BlogPostDetailDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useJournalArticle } from '../hooks/useJournalArticle';

const API_BASE_URL = 'http://localhost:3003/api';

function makeArticle(overrides: Partial<BlogPostDetailDto> = {}): BlogPostDetailDto {
  return {
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Comment choisir sa robe de mariée à Madagascar',
    excerpt: 'Excerpt',
    content: 'Paragraphe un.\n\nParagraphe deux.',
    publishedAt: '2026-03-01T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useJournalArticle', () => {
  it('resolves the article matching the requested slug', async () => {
    server.use(
      http.get(`${API_BASE_URL}/blog-posts/choisir-sa-robe-de-mariee`, () =>
        HttpResponse.json({ success: true, data: makeArticle() }),
      ),
    );

    const { result } = renderHook(() => useJournalArticle('choisir-sa-robe-de-mariee'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.slug).toBe('choisir-sa-robe-de-mariee');
    expect(result.current.error).toBeNull();
  });

  it('surfaces a 404 as an error rather than throwing', async () => {
    server.use(
      http.get(`${API_BASE_URL}/blog-posts/does-not-exist`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useJournalArticle('does-not-exist'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).not.toBeNull();
  });
});
