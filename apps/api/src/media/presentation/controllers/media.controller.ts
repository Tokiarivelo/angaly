import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from '@angaly/types';

import { ConfirmUploadRequestDto } from '../../application/dtos/confirm-upload-request.dto';
import { ListMediaQueryDto } from '../../application/dtos/list-media-query.dto';
import {
  MediaResponseDto,
  PaginatedMediaResponseDto,
} from '../../application/dtos/media-response.dto';
import {
  CreatePresignedUploadRequestDto,
  PresignedUploadResponseDto,
} from '../../application/dtos/presigned-upload-request.dto';
import { UploadMediaBufferRequestDto } from '../../application/dtos/upload-media-buffer-request.dto';
import { ConfirmUploadUseCase } from '../../application/use-cases/confirm-upload.use-case';
import { CreatePresignedUploadUseCase } from '../../application/use-cases/create-presigned-upload.use-case';
import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case';
import { ListMediaUseCase } from '../../application/use-cases/list-media.use-case';
import { UploadMediaBufferUseCase } from '../../application/use-cases/upload-media-buffer.use-case';
import { MediaMapper } from '../../infrastructure/mappers/media.mapper';

interface UploadedMediaFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly createPresignedUploadUseCase: CreatePresignedUploadUseCase,
    private readonly confirmUploadUseCase: ConfirmUploadUseCase,
    private readonly uploadMediaBufferUseCase: UploadMediaBufferUseCase,
    private readonly listMediaUseCase: ListMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
  ) {}

  @Post('presigned-upload')
  @ApiOperation({
    summary: 'Generate a presigned MinIO upload URL',
    description: 'The backend derives the bucket from entityType — the client never chooses it.',
  })
  @ApiResponse({ status: 201, type: PresignedUploadResponseDto })
  createPresignedUpload(
    @Body() dto: CreatePresignedUploadRequestDto,
  ): Promise<PresignedUploadResponseDto> {
    return this.createPresignedUploadUseCase.execute(dto);
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Register the Media row once the browser upload to MinIO succeeded',
  })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  async confirmUpload(@Body() dto: ConfirmUploadRequestDto): Promise<MediaResponseDto> {
    const media = await this.confirmUploadUseCase.execute(dto);
    return MediaMapper.toResponseDto(media);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Server-side direct upload (small files, batch import)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
        altText: { type: 'string' },
        keyPrefix: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  async uploadBuffer(
    @UploadedFile() file: UploadedMediaFile,
    @Body() dto: UploadMediaBufferRequestDto,
  ): Promise<MediaResponseDto> {
    const media = await this.uploadMediaBufferUseCase.execute({
      ...dto,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
    return MediaMapper.toResponseDto(media);
  }

  @Get()
  @ApiOperation({ summary: 'List media, filtered by bucket / entityType / entityId' })
  @ApiResponse({ status: 200, type: PaginatedMediaResponseDto })
  async list(@Query() query: ListMediaQueryDto): Promise<PaginatedResponse<MediaResponseDto>> {
    const { items, total } = await this.listMediaUseCase.execute(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: items.map((item) => MediaMapper.toResponseDto(item)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media — refused while any polymorphic relation still points to it' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteMediaUseCase.execute(id);
  }
}
