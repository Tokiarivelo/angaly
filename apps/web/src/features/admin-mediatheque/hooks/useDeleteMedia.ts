'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteMedia } from '../api/media.api';

/** Refused by the API (409) while the media is still referenced — the caller reads mutation.error. */
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });
};
