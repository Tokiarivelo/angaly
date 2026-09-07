import { useMutation, useQuery } from '@tanstack/react-query';
import type { AtelierDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

import { QUERY_KEYS } from '../consts/queryKeys';
import type { ContactFormValues } from '../schemas/contact-form.schema';

/** Real endpoint — see docs/features/ateliers.md. Same list used by nos-ateliers-liste. */
export function useAteliersForMapQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ateliersForMap,
    queryFn: () => apiClient.get<AtelierDto[]>('/ateliers'),
  });
}

/**
 * Mocked via MSW — `POST /api/ateliers/contact-messages` doesn't exist in `apps/api` yet
 * (no `ContactMessage` model, see docs/pages/contact.md "Points d'attention"). Same
 * treatment as home's `useNewsletterSubscribeMutation` for an endpoint whose backend
 * module isn't built this session.
 */
export function useSendContactMessageMutation() {
  return useMutation({
    mutationFn: (values: ContactFormValues) =>
      apiClient.post<{ received: boolean }>('/ateliers/contact-messages', values),
  });
}
