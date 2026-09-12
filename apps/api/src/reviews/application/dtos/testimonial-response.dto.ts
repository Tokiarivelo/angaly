import { ApiProperty } from '@nestjs/swagger';
import { TestimonialDto } from '@angaly/types';

export class TestimonialResponseDto implements TestimonialDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty({ nullable: true, type: String })
  creationLabel!: string | null;

  @ApiProperty()
  quote!: string;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty({ nullable: true, type: String })
  mediaUrl!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
