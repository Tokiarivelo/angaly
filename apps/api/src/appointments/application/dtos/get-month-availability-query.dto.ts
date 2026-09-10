import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetMonthAvailabilityQueryDto {
  @ApiProperty()
  @IsString()
  atelierId!: string;

  @ApiProperty({ example: '2026-09', description: 'YYYY-MM' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month!: string;
}
