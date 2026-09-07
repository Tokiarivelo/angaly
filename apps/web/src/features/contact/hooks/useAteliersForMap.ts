import type { AtelierDto } from '@angaly/types';

import { useAteliersForMapQuery } from '../api/contact.api';

export function useAteliersForMap(): { ateliers: AtelierDto[]; isLoading: boolean } {
  const { data, isLoading } = useAteliersForMapQuery();
  return { ateliers: data ?? [], isLoading };
}
