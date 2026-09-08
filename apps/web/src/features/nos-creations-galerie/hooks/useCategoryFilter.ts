import type { CategoryDto } from '@angaly/types';

import { useCategoriesQuery } from '../api/nos-creations-galerie.api';

/** Real CREATION categories for the "Catégorie" filter dropdown — see docs/features/categories.md. */
export function useCategoryFilter(): { categories: CategoryDto[]; isLoading: boolean } {
  const { data, isLoading } = useCategoriesQuery();
  return { categories: data ?? [], isLoading };
}
