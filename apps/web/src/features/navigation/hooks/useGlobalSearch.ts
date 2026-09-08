import type { SearchResultsResponseDto } from '@angaly/types';

import { useGlobalSearchQuery } from '../api/navigation.api';

const EMPTY_RESULTS: SearchResultsResponseDto = {
  creations: [],
  products: [],
  collections: [],
  blogPosts: [],
  ateliers: [],
};

export function useGlobalSearch(query: string): {
  results: SearchResultsResponseDto;
  isLoading: boolean;
  hasResults: boolean;
} {
  const { data, isLoading } = useGlobalSearchQuery(query);
  const results = data ?? EMPTY_RESULTS;
  const hasResults =
    results.creations.length > 0 ||
    results.products.length > 0 ||
    results.collections.length > 0 ||
    results.blogPosts.length > 0 ||
    results.ateliers.length > 0;

  return { results, isLoading, hasResults };
}
