import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const STAFF_ROLE_VALUES = ['COUTURIERE', 'MANAGER', 'ADMIN'] as const;

export class UpdateStaffRoleDto {
  @ApiProperty({ enum: STAFF_ROLE_VALUES })
  @IsIn(STAFF_ROLE_VALUES)
  role!: (typeof STAFF_ROLE_VALUES)[number];
}
