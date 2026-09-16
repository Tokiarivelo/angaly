import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStaffStatusDto {
  @ApiProperty({ description: 'true reactivates the account, false deactivates it.' })
  @IsBoolean()
  isActive!: boolean;
}
