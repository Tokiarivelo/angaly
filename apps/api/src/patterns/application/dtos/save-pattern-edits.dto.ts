import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PatternPieceInputDto {
  @ApiProperty({ example: '01. Devant (Au pli)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    description: 'Contour en millimètres : { widthMm, heightMm, outlineMm: [{ x, y }] }',
  })
  @IsObject()
  dimensionsJson!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fabricRecommendation?: string | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsObject()
  grainlineJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true, example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  seamAllowanceCm?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsArray()
  notchesJson?: unknown[] | null;
}

export class SavePatternEditsDto {
  @ApiProperty({ type: [PatternPieceInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => PatternPieceInputDto)
  pieces!: PatternPieceInputDto[];

  @ApiPropertyOptional({ example: 'Retouche manuelle' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  changeLabel?: string;
}
