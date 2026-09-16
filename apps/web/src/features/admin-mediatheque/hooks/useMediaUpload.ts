'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MediaEntityType } from '@angaly/types';

import { confirmUpload, createPresignedUpload } from '../api/media.api';

export interface UploadEntry {
  id: string;
  fileName: string;
  status: 'uploading' | 'done' | 'error';
  mediaId?: string;
  errorMessage?: string;
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

    void queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
  }

  const isUploading = entries.some((entry) => entry.status === 'uploading');

  return { entries, uploadFiles, isUploading };
};
