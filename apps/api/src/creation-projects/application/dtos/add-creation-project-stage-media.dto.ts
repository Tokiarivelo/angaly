import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreationProjectStage } from '@angaly/types';

export class AddCreationProjectStageMediaDto {
  @ApiProperty({ enum: CreationProjectStage, example: CreationProjectStage.CONCEPTION })
  @IsEnum(CreationProjectStage)
  stage!: CreationProjectStage;

  @ApiProperty({ example: 'https://storage.angaly.mg/creations/croquis-conception-01.jpg' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({ example: 'Croquis dos nu avec dentelle' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'croquis-conception-01.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 2048576 })
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;
}
