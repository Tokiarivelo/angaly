export const RENDER_STORAGE_GATEWAY = Symbol('IRenderStorageGateway');

export interface RenderUploadTarget {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface StoredRenderFile {
  mediaId: string;
  url: string;
}

/**
 * MinIO side of a render, implemented through the `media` module (the only consumer of `@angaly/storage`,
 * .cursor/rules/009-storage-minio.mdc): a presigned PUT for the worker, then the Media row once uploaded.
 */
export interface IRenderStorageGateway {
  createUploadTarget(keyPrefix: string): Promise<RenderUploadTarget>;
  confirmUpload(input: {
    objectKey: string;
    sizeBytes: number;
    versionId: string;
    altText: string;
  }): Promise<StoredRenderFile>;
}
