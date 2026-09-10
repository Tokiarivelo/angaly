import { ApiProperty } from '@nestjs/swagger';
import { DaySlotsResponseDto, DayAvailabilityStatus, MonthAvailabilityDayDto } from '@angaly/types';

export class MonthAvailabilityDayResponseDto implements MonthAvailabilityDayDto {
  @ApiProperty()
  date!: string;

  @ApiProperty({ enum: ['available', 'full', 'closed'] })
  status!: DayAvailabilityStatus;
}

export class DaySlotsResponseDtoImpl implements DaySlotsResponseDto {
  @ApiProperty({ type: [String] })
  slots!: string[];
}
