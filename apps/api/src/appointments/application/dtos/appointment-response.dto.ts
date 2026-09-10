import { ApiProperty } from '@nestjs/swagger';
import { AppointmentDto, AppointmentStatus, AppointmentType } from '@angaly/types';

export class AppointmentResponseDto implements AppointmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty({ nullable: true, type: String })
  customerId!: string | null;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: AppointmentType })
  type!: AppointmentType;

  @ApiProperty()
  atelierId!: string;

  @ApiProperty({ nullable: true, type: String })
  assignedToId!: string | null;

  @ApiProperty()
  scheduledAt!: string;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty({ nullable: true, type: String })
  message!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
