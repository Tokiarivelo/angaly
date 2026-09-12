import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MediaEntityType, type MediaDto } from '@angaly/types';
import { apiClient } from '@/lib/api-client';

interface PresignedUploadResponse {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

interface ConfirmUploadInput {
  bucket: string;
  objectKey: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
}

export function useInspirationUpload() {
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<{ id: string; url: string; file: File }[]>([]);

  const presignedMutation = useMutation({
    mutationFn: (input: { originalFilename: string; mimeType: string }) =>
      apiClient.post<PresignedUploadResponse>('/media/presigned-upload', {
        entityType: MediaEntityType.CREATION,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (input: ConfirmUploadInput) =>
      apiClient.post<MediaDto>('/media/confirm', { ...input, entityType: MediaEntityType.CREATION }),
  });

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          // File too large
          continue; // skip files > 10MB
        }

        const presigned = await presignedMutation.mutateAsync({
          originalFilename: file.name,
          mimeType: file.type,
        });

        // Direct upload to MinIO
        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload to MinIO failed');
        }

        const mediaRecord = await confirmMutation.mutateAsync({
          bucket: presigned.bucket,
          objectKey: presigned.objectKey,
          altText: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });

        setUploadedMediaIds((prev) => [...prev, mediaRecord.id]);
        setPreviews((prev) => [
          ...prev,
          { id: mediaRecord.id, url: URL.createObjectURL(file), file },
        ]);
      }
    } catch (_err) {
      // Upload error, swallow for now
    } finally {
      setIsUploading(false);
    }
  };

  const removeUpload = (id: string) => {
    setUploadedMediaIds((prev) => prev.filter((mId) => mId !== id));
    setPreviews((prev) => prev.filter((p) => p.id !== id));
    // Note: To be fully clean we should call DELETE /api/media/:id here, but simple remove from array is ok for draft.
  };

  return {
    uploadedMediaIds,
    previews,
    isUploading,
    handleUpload,
    removeUpload,
  };
}
