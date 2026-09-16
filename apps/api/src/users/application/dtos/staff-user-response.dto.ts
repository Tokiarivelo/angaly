import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse, Role } from '@angaly/types';

export class StaffUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  lastLoginAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedStaffUserResponseDto implements PaginatedResponse<StaffUserResponseDto> {
  @ApiProperty({ type: [StaffUserResponseDto] })
  data!: StaffUserResponseDto[];

  @ApiProperty()
  meta!: PaginatedResponse<StaffUserResponseDto>['meta'];
}
