import { Module } from '@nestjs/common';

import { ConfirmUploadUseCase } from './application/use-cases/confirm-upload.use-case';
import { CreatePresignedUploadUseCase } from './application/use-cases/create-presigned-upload.use-case';
import { DeleteMediaUseCase } from './application/use-cases/delete-media.use-case';
import { ListMediaUseCase } from './application/use-cases/list-media.use-case';
import { UploadMediaBufferUseCase } from './application/use-cases/upload-media-buffer.use-case';
import { MEDIA_STORAGE_GATEWAY } from './domain/repositories/media-storage.gateway';
import { MEDIA_REPOSITORY } from './domain/repositories/media.repository';
import { PrismaMediaRepository } from './infrastructure/repositories/prisma-media.repository';
import { StorageService } from './infrastructure/services/storage.service';
import { MediaController } from './presentation/controllers/media.controller';

@Module({
  controllers: [MediaController],
  providers: [
    CreatePresignedUploadUseCase,
    ConfirmUploadUseCase,
    UploadMediaBufferUseCase,
    ListMediaUseCase,
    DeleteMediaUseCase,
    { provide: MEDIA_REPOSITORY, useClass: PrismaMediaRepository },
    { provide: MEDIA_STORAGE_GATEWAY, useClass: StorageService },
  ],
  // UploadMediaBufferUseCase: `quotes`.`export-quote-pdf` uploads the generated PDF via `media`.
  exports: [UploadMediaBufferUseCase],
})
export class MediaModule {}
