'use client';

import { useState } from 'react';

import { useConfirmUploadMutation, useCreatePresignedUploadMutation } from '../api/quote-requests.api';
import type { InspirationPhotoEntry } from '../types/wizard-state.types';

const MAX_PHOTOS = 5;

/** Presigned upload → direct PUT to MinIO → confirm, up to 5 photos — see docs/features/media.md. */
export function useInspirationUpload() {
  const [photos, setPhotos] = useState<InspirationPhotoEntry[]>([]);
  const createPresignedUpload = useCreatePresignedUploadMutation();
  const confirmUpload = useConfirmUploadMutation();

  const remainingSlots = MAX_PHOTOS - photos.length;

  async function addFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files).slice(0, remainingSlots);

    for (const file of nextFiles) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setPhotos((current) => [...current, { id, fileName: file.name, previewUrl, status: 'uploading' }]);

      try {
        const presigned = await createPresignedUpload.mutateAsync({
          originalFilename: file.name,
          mimeType: file.type,
        });
        await fetch(presigned.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        const media = await confirmUpload.mutateAsync({
          bucket: presigned.bucket,
          objectKey: presigned.objectKey,
          altText: `Photo d'inspiration — ${file.name}`,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        setPhotos((current) => current.map((p) => (p.id === id ? { ...p, status: 'done', mediaId: media.id } : p)));
      } catch {
        setPhotos((current) => current.map((p) => (p.id === id ? { ...p, status: 'error' } : p)));
      }
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => current.filter((p) => p.id !== id));
  }

  const mediaIds = photos
    .filter((p): p is InspirationPhotoEntry & { mediaId: string } => p.status === 'done' && p.mediaId !== undefined)
    .map((p) => p.mediaId);
  const isUploading = photos.some((p) => p.status === 'uploading');

  return {
    photos,
    addFiles,
    removePhoto,
    mediaIds,
    isUploading,
    canAddMore: remainingSlots > 0,
    maxPhotos: MAX_PHOTOS,
  };
}
