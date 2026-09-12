import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { QuoteDto } from '@angaly/types';

export const QUOTE_QUERY_KEYS = {
  all: ['quotes'] as const,
  detail: (quoteNumber: string) => [...QUOTE_QUERY_KEYS.all, 'detail', quoteNumber] as const,
};

export const useQuoteQuery = (quoteNumber: string) => {
  return useQuery({
    queryKey: QUOTE_QUERY_KEYS.detail(quoteNumber),
    queryFn: async () => {
      const data = await apiClient.get<QuoteDto>(`/api/quotes/${quoteNumber}`);
      return data;
    },
    enabled: !!quoteNumber,
  });
};

export const useAcceptQuoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteNumber: string) => {
      const data = await apiClient.post<QuoteDto>(`/api/quotes/${quoteNumber}/accept`);
      return data;
    },
    onSuccess: (data, quoteNumber) => {
      queryClient.setQueryData(QUOTE_QUERY_KEYS.detail(quoteNumber), data);
    },
  });
};

export const useRejectQuoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteNumber: string) => {
      const data = await apiClient.post<QuoteDto>(`/api/quotes/${quoteNumber}/reject`);
      return data;
    },
    onSuccess: (data, quoteNumber) => {
      queryClient.setQueryData(QUOTE_QUERY_KEYS.detail(quoteNumber), data);
    },
  });
};

export const useRequestQuoteChangeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteNumber, message }: { quoteNumber: string; message: string }) => {
      const data = await apiClient.post<QuoteDto>(`/api/quotes/${quoteNumber}/request-change`, { message });
      return data;
    },
    onSuccess: (data, { quoteNumber }) => {
      queryClient.setQueryData(QUOTE_QUERY_KEYS.detail(quoteNumber), data);
    },
  });
};
