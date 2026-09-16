import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const STAFF_ROLE_VALUES = ['COUTURIERE', 'MANAGER', 'ADMIN'] as const;

export class ListStaffUsersQueryDto {
  @ApiProperty({ required: false, enum: STAFF_ROLE_VALUES })
  @IsOptional()
  @IsIn(STAFF_ROLE_VALUES)
  role?: (typeof STAFF_ROLE_VALUES)[number];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
