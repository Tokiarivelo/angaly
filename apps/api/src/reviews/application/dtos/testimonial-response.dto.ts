import { ApiProperty } from '@nestjs/swagger';
import { TestimonialDto } from '@angaly/types';

export class TestimonialResponseDto implements TestimonialDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty({ required: false })
  clientName?: string;

  @ApiProperty({ nullable: true, type: String })
  creationLabel!: string | null;

  @ApiProperty()
  quote!: string;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty({ required: false })
  verified?: boolean;

  @ApiProperty({ nullable: true, type: String })
  mediaUrl!: string | null;

  @ApiProperty({ nullable: true, required: false, type: String })
  avatarUrl?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
