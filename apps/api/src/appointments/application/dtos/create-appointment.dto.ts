import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType } from '@angaly/types';
import { IsEmail, IsEnum, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  phone!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: AppointmentType })
  @IsEnum(AppointmentType)
  type!: AppointmentType;

  @ApiProperty()
  @IsString()
  atelierId!: string;

  @ApiProperty({ description: 'ISO 8601 datetime for the requested slot start' })
  @IsISO8601()
  scheduledAt!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
