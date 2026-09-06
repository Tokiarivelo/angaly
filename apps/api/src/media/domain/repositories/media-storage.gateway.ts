export const MEDIA_STORAGE_GATEWAY = Symbol('IMediaStorageGateway');

export interface PresignedUploadResult {
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface BufferUploadResult {
  objectKey: string;
  sizeBytes: number;
}

/**
 * Port for MinIO I/O (`@angaly/storage`). Kept in the Domain layer, isolated
 * from Prisma/NestJS, so the Application layer never imports Infrastructure
 * types directly (see .cursor/rules/003-nestjs-clean-arch.mdc — "dépendances
 * unidirectionnelles"). Implemented by infrastructure/services/storage.service.ts.
 */
export interface IMediaStorageGateway {
  createPresignedUploadUrl: (
    bucket: string,
    objectKey: string,
    expiresInSeconds?: number,
  ) => Promise<PresignedUploadResult>;
  uploadBuffer: (
    bucket: string,
    buffer: Buffer,
    options: { originalFilename: string; mimeType: string; keyPrefix?: string },
  ) => Promise<BufferUploadResult>;
  buildPublicUrl: (bucket: string, objectKey: string) => string;
  deleteObject: (bucket: string, objectKey: string) => Promise<void>;
}
