import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { BlogPostDetailDto, BlogPostDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { JournalArticlePage } from '../ui/JournalArticlePage';

const API_BASE_URL = 'http://localhost:3003/api';

function makeArticle(overrides: Partial<BlogPostDetailDto> = {}): BlogPostDetailDto {
  return {
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Comment choisir sa robe de mariée à Madagascar',
    excerpt: 'Excerpt',
    content: 'Premier paragraphe.\n\nDeuxième paragraphe.',
    publishedAt: '2026-03-01T00:00:00.000Z',
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'admin@angaly.mg' },
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRelated(overrides: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id: 'post-2',
    slug: 'post-2',
    title: 'Article similaire',
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

describe('JournalArticlePage', () => {
  it('renders the breadcrumb, header, body, author box, related articles, and CTA band', async () => {
    server.use(
      http.get(`${API_BASE_URL}/blog-posts/choisir-sa-robe-de-mariee`, () =>
        HttpResponse.json({ success: true, data: makeArticle() }),
      ),
      http.get(`${API_BASE_URL}/blog-posts/choisir-sa-robe-de-mariee/related`, () =>
        HttpResponse.json({ success: true, data: [makeRelated()] }),
      ),
    );

    const Wrapper = withQueryClient();
    render(<JournalArticlePage slug="choisir-sa-robe-de-mariee" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Comment choisir sa robe de mariée à Madagascar' }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('href', '/journal');
    expect(screen.getByText('Premier paragraphe.')).toBeInTheDocument();
    expect(screen.getByText('Mme. Fanja')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Article similaire' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Envie de concrétiser votre projet ?' })).toBeInTheDocument();
  });

  it('shows a not-found state with a link back to the journal on error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/blog-posts/unknown-slug`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
      http.get(`${API_BASE_URL}/blog-posts/unknown-slug/related`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );

    const Wrapper = withQueryClient();
    render(<JournalArticlePage slug="unknown-slug" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Cet article est introuvable.')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Retour au journal' })).toHaveAttribute('href', '/journal');
  });
});
