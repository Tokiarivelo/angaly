import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { NewsletterFormValues } from './newsletter.schema';

/**
 * Mocked via MSW — `notifications`/`customers` don't exist yet (Phase 2), see
 * docs/pages/home.md. Shared across every page embedding the newsletter card
 * (`home`, `journal-liste`) — see docs/pages/journal-liste.md "Points d'attention"
 * ("ne pas dupliquer la logique de validation/mutation").
 */
export function useNewsletterSubscribeMutation() {
  return useMutation({
    mutationFn: (values: NewsletterFormValues) =>
      apiClient.post<{ subscribed: boolean }>('/newsletter/subscribe', { email: values.email }),
  });
}
