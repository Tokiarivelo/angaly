import { useEffect, useState } from 'react';
import type { BlogPostDto } from '@angaly/types';

import { useJournalArticlesQuery } from '../api/journal-liste.api';
import { ARTICLES_PAGE_SIZE, type JournalCategorySlug } from '../consts/journal-categories.const';

const POPULAR_COUNT = 3;

/**
 * The featured article (most recent overall) is excluded from both the popular widget and
 * the grid — same "featured never repeats below itself" rule as `useCollectionsList`. The
 * grid is a client-side "load more" reveal over the already-fetched, category-filtered
 * list (see docs/pages/journal-liste.md "Points d'attention").
 */
export function useJournalArticles(activeSlug: JournalCategorySlug): {
  featured: BlogPostDto | null;
  popular: BlogPostDto[];
  grid: BlogPostDto[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
} {
  const query = useJournalArticlesQuery();
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PAGE_SIZE);

  const allArticles = query.data?.data ?? [];
  const featured = allArticles[0] ?? null;
  const rest = allArticles.slice(1);
  const popular = rest.slice(0, POPULAR_COUNT);

  const filtered = activeSlug === null ? rest : rest.filter((article) => article.category.slug === activeSlug);

  useEffect(() => {
    setVisibleCount(ARTICLES_PAGE_SIZE);
  }, [activeSlug]);

  return {
    featured,
    popular,
    grid: filtered.slice(0, visibleCount),
    hasMore: visibleCount < filtered.length,
    isLoading: query.isLoading,
    loadMore: () => setVisibleCount((current) => current + ARTICLES_PAGE_SIZE),
  };
}
