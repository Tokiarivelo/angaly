import type { AtelierDto } from '@angaly/types';

import { useAteliersListQuery } from '../api/nos-ateliers-liste.api';
import { FLAGSHIP_ATELIER_SLUG } from '../consts/flagship.const';

/**
 * Unlike `useCollectionsList`, the flagship atelier is NOT excluded from `ateliers` — the
 * real Stitch screen repeats it as the first card in the list below its own banner.
 */
export function useAteliersList(): {
  flagship: AtelierDto | null;
  ateliers: AtelierDto[];
  isLoading: boolean;
} {
  const { data, isLoading } = useAteliersListQuery();

  const ateliers = data ?? [];
  const flagship = ateliers.find((atelier) => atelier.slug === FLAGSHIP_ATELIER_SLUG) ?? null;

  return { flagship, ateliers, isLoading };
}
