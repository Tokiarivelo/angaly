'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { MediaEntityType, type CustomerDto, type MediaDto, type QuoteDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';

const CUSTOMER_PROFILE_QUERY_KEY = ['demande-sur-mesure', 'customer-profile'];

/** Real endpoint — see docs/features/customers.md. Powers the read-only "Vos coordonnées" step. */
export function useCustomerProfileQuery() {
  const { status } = useSession();
  return useQuery({
    queryKey: CUSTOMER_PROFILE_QUERY_KEY,
    queryFn: () => apiClient.get<CustomerDto>('/customers/me'),
    enabled: status === 'authenticated',
  });
}

export interface PresignedUploadResponse {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

/** Real endpoint — see docs/features/media.md. `entityType: QUOTE_DOCUMENT` (bucket `quotes`) — no dedicated inspiration-photo bucket exists. */
export function useCreatePresignedUploadMutation() {
  return useMutation({
    mutationFn: (input: { originalFilename: string; mimeType: string }) =>
      apiClient.post<PresignedUploadResponse>('/media/presigned-upload', {
        entityType: MediaEntityType.QUOTE_DOCUMENT,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
      }),
  });
}

export interface ConfirmUploadInput {
  bucket: string;
  objectKey: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
}

/** Real endpoint — see docs/features/media.md. Registers the `Media` row once the direct PUT to MinIO succeeds. */
export function useConfirmUploadMutation() {
  return useMutation({
    mutationFn: (input: ConfirmUploadInput) =>
      apiClient.post<MediaDto>('/media/confirm', { ...input, entityType: MediaEntityType.QUOTE_DOCUMENT }),
  });
}

export interface SubmitQuoteRequestPayload {
  garmentType: string;
  occasion?: string;
  eventDate?: string;
  budgetRange?: string;
  fabricPreference?: string;
  message?: string;
  inspirationMediaIds: string[];
}

/** Real endpoint — see docs/features/quotes.md (`create-quote-from-sur-mesure-request`, requires an authenticated CLIENT). */
export function useSubmitQuoteRequestMutation() {
  return useMutation({
    mutationFn: (payload: SubmitQuoteRequestPayload) => apiClient.post<QuoteDto>('/quotes/requests', payload),
  });
}
