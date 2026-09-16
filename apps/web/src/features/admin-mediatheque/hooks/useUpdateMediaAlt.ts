'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateMedia } from '../api/media.api';
import { mediaDetailKey } from '../consts/queryKeys';

export const useUpdateMediaAlt = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (altText: string) => updateMedia(id, { altText }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaDetailKey(id) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'list'] });
    },
  });
};
