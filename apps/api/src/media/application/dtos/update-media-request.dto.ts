import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Covers both "edit alt text" and "replace the image" (docs/pages/admin-mediatheque.md):
 * a replace re-uploads via `POST /media/presigned-upload` first (new bucket/objectKey), then
 * PATCHes this same `Media` row with the new binary's fields — the `id` never changes, so
 * every existing reference stays valid. No `url` field on purpose: the backend always
 * recomputes it from `bucket`/`objectKey` via `IMediaStorageGateway.buildPublicUrl()` when
 * either changes (`UpdateMediaUseCase`) — the client never sets it directly.
 */
export class UpdateMediaRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  width?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  height?: number;
}
