import { ApiPropertyOptional } from '@nestjs/swagger';
import { MeasurementUnit } from '@angaly/types';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeasurementProfileDto {
  @ApiPropertyOptional({ description: 'The label of the profile', example: 'Mesures 2026' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ description: 'The unit', enum: MeasurementUnit })
  @IsOptional()
  @IsEnum(MeasurementUnit)
  unit?: MeasurementUnit;

  @ApiPropertyOptional({
    description: 'The measurements keys and values in cm',
    example: { TOUR_POITRINE: 88, TOUR_TAILLE: 70 },
  })
  @IsOptional()
  @IsObject()
  values?: Record<string, number>;
}
