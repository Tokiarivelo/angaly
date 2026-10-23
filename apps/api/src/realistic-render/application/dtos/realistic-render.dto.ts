import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type {
  ClothSimJobDoneInput,
  ClothSimJobFailedInput,
  RealisticRenderDto,
  RequestRealisticRenderInput,
} from '@angaly/types';

import {
  REALISTIC_RENDER_POSES,
  REALISTIC_RENDER_STATUSES,
  type RealisticRenderPose,
  type RealisticRenderStatus,
} from '../../domain/value-objects/realistic-render-status.vo';

export class RequestRealisticRenderDto implements RequestRealisticRenderInput {
  @ApiPropertyOptional({ enum: REALISTIC_RENDER_POSES, default: 'PRESENTATION' })
  @IsOptional()
  @IsIn(REALISTIC_RENDER_POSES)
  pose?: RealisticRenderPose;
}

export class LatestRealisticRenderQueryDto {
  @ApiPropertyOptional({ enum: REALISTIC_RENDER_POSES })
  @IsOptional()
  @IsIn(REALISTIC_RENDER_POSES)
  pose?: RealisticRenderPose;
}

export class RealisticRenderResponseDto implements RealisticRenderDto {
  @ApiProperty() id!: string;
  @ApiProperty() versionId!: string;
  @ApiProperty({ enum: REALISTIC_RENDER_POSES }) pose!: RealisticRenderPose;
  @ApiProperty({ enum: REALISTIC_RENDER_STATUSES }) status!: RealisticRenderStatus;
  @ApiProperty({ nullable: true, type: String }) glbUrl!: string | null;
  @ApiProperty({ nullable: true, type: Object }) simPose!: Record<string, unknown> | null;
  @ApiProperty({ nullable: true, type: String }) error!: string | null;
  @ApiProperty({ nullable: true, type: Number }) durationMs!: number | null;
  @ApiProperty() cached!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ nullable: true, type: String }) finishedAt!: string | null;
}

/** 7 days: far above any simulation (10 min timeout). */
const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
/** A Draco `.glb` weighs 0.1–0.3 MB; 64 MB is a generous ceiling. */
const MAX_GLB_BYTES = 64 * 1024 * 1024;

export class ClothSimJobDoneDto implements ClothSimJobDoneInput {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  objectKey!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(MAX_GLB_BYTES)
  sizeBytes!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(MAX_DURATION_MS)
  durationMs!: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  simPose?: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown> | null;
}

export class ClothSimJobFailedDto implements ClothSimJobFailedInput {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  error!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_DURATION_MS)
  durationMs?: number;
}
