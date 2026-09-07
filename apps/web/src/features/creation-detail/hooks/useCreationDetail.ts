import type { CreationDto } from '@angaly/types';

import { useCreationDetailQuery } from '../api/creation-detail.api';

export function useCreationDetail(slug: string): {
  data: CreationDto | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const query = useCreationDetailQuery(slug);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
