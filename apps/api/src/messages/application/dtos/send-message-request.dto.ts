import { ApiProperty } from '@nestjs/swagger';
import type { SendMessagePayload } from '@angaly/types';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Backs `POST /api/messages/conversations/:id/messages` — appends a message to an existing conversation. */
export class SendMessageRequestDto implements SendMessagePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}
