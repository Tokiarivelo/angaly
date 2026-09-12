import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeasurementUnit } from '@angaly/types';
import { IsEnum, IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

export class CreateMeasurementProfileDto {
  @ApiProperty({ description: 'The label of the profile', example: 'Mesures 2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @ApiPropertyOptional({ description: 'The unit', enum: MeasurementUnit, default: MeasurementUnit.CM })
  @IsEnum(MeasurementUnit)
  unit?: MeasurementUnit;

  @ApiProperty({
    description: 'The measurements keys and values in cm',
    example: { TOUR_POITRINE: 88, TOUR_TAILLE: 70 },
  })
  @IsObject()
  values!: Record<string, number>;
}
