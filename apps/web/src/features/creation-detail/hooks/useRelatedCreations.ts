import type { CreationDto } from '@angaly/types';

import { useCategoryCreationsQuery, useCollectionCreationsQuery } from '../api/creation-detail.api';

const RELATED_LIMIT = 4;

/**
 * Real Stitch screen's "Fait partie de la collection" and "Vous aimerez
 * aussi" sections — both real data, current creation excluded client-side
 * (no `excludeId` server param), capped to 4 each.
 */
export function useRelatedCreations(current: CreationDto | undefined): {
  sameCollection: CreationDto[];
  sameCategory: CreationDto[];
} {
  const collectionQuery = useCollectionCreationsQuery(current?.collection?.id ?? null);
  const categoryQuery = useCategoryCreationsQuery(current?.category.id ?? null);

  const excludeCurrent = (creations: CreationDto[]) => creations.filter((creation) => creation.id !== current?.id);

  return {
    sameCollection: excludeCurrent(collectionQuery.data?.data ?? []).slice(0, RELATED_LIMIT),
    sameCategory: excludeCurrent(categoryQuery.data?.data ?? []).slice(0, RELATED_LIMIT),
  };
}
