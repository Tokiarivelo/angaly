import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ConfirmUploadUseCase } from './application/use-cases/confirm-upload.use-case';
import { CreatePresignedUploadUseCase } from './application/use-cases/create-presigned-upload.use-case';
import { DeleteMediaUseCase } from './application/use-cases/delete-media.use-case';
import { GetMediaDetailUseCase } from './application/use-cases/get-media-detail.use-case';
import { ListMediaUseCase } from './application/use-cases/list-media.use-case';
import { UpdateMediaUseCase } from './application/use-cases/update-media.use-case';
import { UploadMediaBufferUseCase } from './application/use-cases/upload-media-buffer.use-case';
import { MEDIA_STORAGE_GATEWAY } from './domain/repositories/media-storage.gateway';
import { MEDIA_REPOSITORY } from './domain/repositories/media.repository';
import { PrismaMediaRepository } from './infrastructure/repositories/prisma-media.repository';
import { StorageService } from './infrastructure/services/storage.service';
import { MediaController } from './presentation/controllers/media.controller';

@Module({
  // AuthModule: only the 3 MANAGER/ADMIN-only endpoints (getById/update/delete)
  // use its guards — every other route in this module stays open (see
  // media.controller.ts's comment for why).
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [
    CreatePresignedUploadUseCase,
    ConfirmUploadUseCase,
    UploadMediaBufferUseCase,
    ListMediaUseCase,
    DeleteMediaUseCase,
    GetMediaDetailUseCase,
    UpdateMediaUseCase,
    { provide: MEDIA_REPOSITORY, useClass: PrismaMediaRepository },
    { provide: MEDIA_STORAGE_GATEWAY, useClass: StorageService },
  ],
  // UploadMediaBufferUseCase: `quotes`.`export-quote-pdf` uploads the generated PDF via `media`.
  exports: [UploadMediaBufferUseCase],
})
export class MediaModule {}
