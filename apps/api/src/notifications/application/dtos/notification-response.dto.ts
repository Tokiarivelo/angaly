import { ApiProperty } from '@nestjs/swagger';
import { NotificationDto, NotificationType } from '@angaly/types';

export class NotificationResponseDto implements NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty({ nullable: true, type: String })
  relatedEntityType!: string | null;

  @ApiProperty({ nullable: true, type: String })
  relatedEntityId!: string | null;

  @ApiProperty()
  createdAt!: string;
}
