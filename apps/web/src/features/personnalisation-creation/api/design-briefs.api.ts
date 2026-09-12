import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DesignBrief, DesignBriefPayload } from '../types/design-brief.types';

export function useSaveDraftMutation() {
  return useMutation({
    mutationFn: (data: { id?: string; payload: DesignBriefPayload }) => {
      if (data.id) {
        return apiClient.patch<DesignBrief>(`/quotes/design-briefs/${data.id}`, data.payload);
      } else {
        return apiClient.post<DesignBrief>('/quotes/design-briefs', data.payload);
      }
    },
  });
}

export function useSubmitDesignBriefMutation() {
  return useMutation({
    mutationFn: (data: { id?: string; payload: DesignBriefPayload }) => {
      const finalPayload: DesignBriefPayload = {
        ...data.payload,
        status: 'SUBMITTED',
      };
      if (data.id) {
        return apiClient.patch<DesignBrief>(`/quotes/design-briefs/${data.id}`, finalPayload);
      } else {
        return apiClient.post<DesignBrief>('/quotes/design-briefs', finalPayload);
      }
    },
  });
}
