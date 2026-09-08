import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

import { MIN_PASSWORD_LENGTH } from '../../domain/value-objects/password.vo';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Raw reset token from the emailed link' })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  newPassword!: string;
}
