import { ApiProperty } from '@nestjs/swagger';
import { ReviewDto } from '@angaly/types';

export class ReviewResponseDto implements ReviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({ nullable: true, type: String })
  productId!: string | null;

  @ApiProperty()
  rating!: number;

  @ApiProperty({ nullable: true, type: String })
  comment!: string | null;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
