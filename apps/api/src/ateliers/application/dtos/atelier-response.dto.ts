import { ApiProperty } from '@nestjs/swagger';
import { AtelierDayHours, AtelierOpeningHours, AtelierTimeSlot } from '@angaly/types';

export class AtelierTimeSlotDto implements AtelierTimeSlot {
  @ApiProperty({ example: '09:00' })
  open!: string;

  @ApiProperty({ example: '18:00' })
  close!: string;
}

export class AtelierDayHoursDto implements AtelierDayHours {
  @ApiProperty()
  isOpen!: boolean;

  @ApiProperty({ type: [AtelierTimeSlotDto] })
  slots!: AtelierTimeSlotDto[];
}

export class AtelierOpeningHoursDto implements AtelierOpeningHours {
  @ApiProperty({ type: AtelierDayHoursDto })
  monday!: AtelierDayHoursDto;

  @ApiProperty({ type: AtelierDayHoursDto })
  tuesday!: AtelierDayHoursDto;

  @ApiProperty({ type: AtelierDayHoursDto })
  wednesday!: AtelierDayHoursDto;

  @ApiProperty({ type: AtelierDayHoursDto })
  thursday!: AtelierDayHoursDto;

  @ApiProperty({ type: AtelierDayHoursDto })
  friday!: AtelierDayHoursDto;

  @ApiProperty({ type: AtelierDayHoursDto })
  saturday!: AtelierDayHoursDto;

  @ApiProperty({ type: AtelierDayHoursDto })
  sunday!: AtelierDayHoursDto;
}

export class AtelierMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class AtelierResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ type: AtelierOpeningHoursDto })
  openingHours!: AtelierOpeningHoursDto;

  @ApiProperty({ type: [String] })
  services!: string[];

  @ApiProperty({ nullable: true })
  latitude!: number | null;

  @ApiProperty({ nullable: true })
  longitude!: number | null;

  @ApiProperty({ type: [AtelierMediaDto] })
  media!: AtelierMediaDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
