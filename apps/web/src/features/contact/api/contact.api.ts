import { useMutation, useQuery } from '@tanstack/react-query';
import type { AtelierDto, Locale } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { publicContentPath } from '@/lib/public-content';
import { useLocaleStore } from '@/stores/locale.store';

import { QUERY_KEYS } from '../consts/queryKeys';
import type { ContactFormValues } from '../schemas/contact-form.schema';

/**
 * Local response shape mirroring `PublicPageSectionResponseDto`
 * (`apps/api/src/content`) — same duplication convention as
 * `home/api/home.api.ts#PublicPageSectionDto` /
 * `la-une/api/la-une.api.ts#PublicPageSectionDto`. No `status`/
 * `updatedById` — the public endpoint never returns them.
 */
export interface PublicPageSectionDto {
  page: string;
  sectionKey: string;
  locale: Locale;
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  updatedAt: string;
}

/**
 * Real endpoint — see docs/features/content.md ("Endpoint public"). Public,
 * unauthenticated, PUBLISHED-only sections for the `contact` page — sixth
 * page of the docs/phases/phase-6-admin-cms.md step 4 slice (after `home`,
 * `a-propos`, `la-une`, `nos-creations-galerie`, `creation-detail`).
 * `useContactContent` merges these onto the hardcoded header defaults by
 * `sectionKey`.
 */
export function useContactSectionsContentQuery() {
  const locale = useLocaleStore((state) => state.locale);
  return useQuery({
    queryKey: [...QUERY_KEYS.content, locale],
    queryFn: () => apiClient.get<PublicPageSectionDto[]>(publicContentPath('contact', locale)),
  });
}

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
