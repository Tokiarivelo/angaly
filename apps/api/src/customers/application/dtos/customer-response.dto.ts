import { ApiProperty } from '@nestjs/swagger';
import { CustomerDto } from '@angaly/types';

export class CustomerResponseDto implements CustomerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ nullable: true, type: String })
  phone!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
