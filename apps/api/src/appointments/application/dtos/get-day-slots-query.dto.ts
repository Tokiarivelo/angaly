import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetDaySlotsQueryDto {
  @ApiProperty()
  @IsString()
  atelierId!: string;

  @ApiProperty({ example: '2026-09-15', description: 'YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
