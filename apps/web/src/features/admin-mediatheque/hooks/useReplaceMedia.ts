'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MediaEntityType } from '@angaly/types';

import { createPresignedUpload, updateMedia } from '../api/media.api';
import { mediaDetailKey } from '../consts/queryKeys';

/** Replaces the binary in place: new bucket/objectKey uploaded, then PATCHed onto the SAME Media id — every existing reference stays valid (docs/pages/admin-mediatheque.md). */
export const useReplaceMedia = (id: string, entityType: MediaEntityType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const presigned = await createPresignedUpload(entityType, file.name, file.type);
      await fetch(presigned.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      return updateMedia(id, {
        bucket: presigned.bucket,
        objectKey: presigned.objectKey,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaDetailKey(id) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'list'] });
    },
  });
};
