import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Backs `POST /api/messages/conversations` (staff-only — see docs/features/messages.md
 * "Comment une nouvelle conversation est créée"). Finds-or-creates the
 * `Conversation` for (customerId, atelierId), then appends the first message.
 */
export class StartConversationRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  atelierId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @ApiProperty({ required: false, description: 'e.g. "Order", "Quote", "Appointment" — the entity that prompted this conversation.' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;
}
