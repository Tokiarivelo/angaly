import { Injectable } from '@nestjs/common';

import { ConfirmUploadUseCase } from '../../../media/application/use-cases/confirm-upload.use-case';
import { CreatePresignedUploadUseCase } from '../../../media/application/use-cases/create-presigned-upload.use-case';
import { resolveBucketForEntityType } from '../../../media/domain/value-objects/media-entity-ref.vo';
import type {
  IRenderStorageGateway,
  RenderUploadTarget,
  StoredRenderFile,
} from '../../domain/services/render-storage.gateway';

/** Renders are Pattern Studio artifacts of a version, next to its exports (`patterns` bucket). */
const ENTITY_TYPE = 'PATTERN_EXPORT';
const GLB_MIME_TYPE = 'model/gltf-binary';

/** Goes through the `media` module, the only consumer of `@angaly/storage` (.cursor/rules/009-storage-minio.mdc). */
@Injectable()
export class MediaRenderStorageGateway implements IRenderStorageGateway {
  constructor(
    private readonly createPresignedUpload: CreatePresignedUploadUseCase,
    private readonly confirmUploadUseCase: ConfirmUploadUseCase,
  ) {}

  createUploadTarget(keyPrefix: string): Promise<RenderUploadTarget> {
    return this.createPresignedUpload.execute({
      entityType: ENTITY_TYPE,
      originalFilename: 'garment.glb',
      mimeType: GLB_MIME_TYPE,
      keyPrefix,
    });
  }

  async confirmUpload(input: {
    objectKey: string;
    sizeBytes: number;
    versionId: string;
    altText: string;
  }): Promise<StoredRenderFile> {
    const media = await this.confirmUploadUseCase.execute({
      bucket: resolveBucketForEntityType(ENTITY_TYPE),
      objectKey: input.objectKey,
      entityType: ENTITY_TYPE,
      entityId: input.versionId,
      altText: input.altText,
      mimeType: GLB_MIME_TYPE,
      sizeBytes: input.sizeBytes,
    });
    return { mediaId: media.id, url: media.url };
  }
}
