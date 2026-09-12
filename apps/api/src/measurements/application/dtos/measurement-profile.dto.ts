import { ApiProperty } from '@nestjs/swagger';
import { MeasurementUnit } from '@angaly/types';

export class MeasurementProfileDto {
  @ApiProperty({ description: 'The unique identifier' })
  id!: string;

  @ApiProperty({ description: 'The customer identifier' })
  customerId!: string;

  @ApiProperty({ description: 'The label of the profile', example: 'Mesures 2026' })
  label!: string;

  @ApiProperty({ description: 'The unit', enum: MeasurementUnit, example: MeasurementUnit.CM })
  unit!: MeasurementUnit;

  @ApiProperty({
    description: 'The measurements keys and values (in the profile unit)',
    example: { TOUR_POITRINE: 88, TOUR_TAILLE: 70 },
  })
  values!: Record<string, number>;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Update date' })
  updatedAt!: Date;
}
