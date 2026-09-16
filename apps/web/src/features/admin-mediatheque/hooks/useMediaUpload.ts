'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACCEPTED_MEDIA_MIME_TYPES, MAX_MEDIA_UPLOAD_SIZE_BYTES } from '@angaly/types';
import type { MediaEntityType } from '@angaly/types';

import { formatFileSize } from '@/lib/utils';

import { confirmUpload, createPresignedUpload } from '../api/media.api';
import { mediaBaseKey } from '../consts/queryKeys';

export interface UploadEntry {
  id: string;
  fileName: string;
  status: 'uploading' | 'done' | 'error';
  mediaId?: string;
  errorMessage?: string;
}

/** Mirrors the server-side check on `ConfirmUploadRequestDto.sizeBytes` — rejected before any network call. */
function validateFile(file: File): string | null {
  if (!ACCEPTED_MEDIA_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MEDIA_MIME_TYPES)[number])) {
    return `Format non pris en charge (${file.type || 'inconnu'}).`;
  }
  if (file.size > MAX_MEDIA_UPLOAD_SIZE_BYTES) {
    return `Fichier trop volumineux (${formatFileSize(file.size)}, 20 Mo max).`;
  }
  return null;
}

function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve({});
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({});
    img.src = URL.createObjectURL(file);
  });
}

/** Presigned upload → direct PUT to MinIO → confirm, mirroring the pattern documented in docs/features/media.md. */
export const useMediaUpload = (entityType: MediaEntityType) => {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const queryClient = useQueryClient();

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);

    for (const file of list) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const validationError = validateFile(file);
      if (validationError) {
        setEntries((current) => [
          ...current,
          { id, fileName: file.name, status: 'error', errorMessage: validationError },
        ]);
        continue;
      }

      setEntries((current) => [...current, { id, fileName: file.name, status: 'uploading' }]);

      try {
        const presigned = await createPresignedUpload(entityType, file.name, file.type);
        await fetch(presigned.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        const dimensions = await readImageDimensions(file);
        const media = await confirmUpload({
          bucket: presigned.bucket,
          objectKey: presigned.objectKey,
          entityType,
          altText: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          ...dimensions,
        });
        setEntries((current) =>
          current.map((entry) => (entry.id === id ? { ...entry, status: 'done', mediaId: media.id } : entry)),
        );
      } catch (error) {
        setEntries((current) =>
          current.map((entry) =>
            entry.id === id
              ? { ...entry, status: 'error', errorMessage: error instanceof Error ? error.message : 'Échec' }
              : entry,
          ),
        );
      }
    }

    void queryClient.invalidateQueries({ queryKey: mediaBaseKey });
  }

  const isUploading = entries.some((entry) => entry.status === 'uploading');

  function clearEntries() {
    setEntries((current) => current.filter((entry) => entry.status === 'uploading'));
  }

  return { entries, uploadFiles, isUploading, clearEntries };
};
