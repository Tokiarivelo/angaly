import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

/** Mirrors auth's MIN_PASSWORD_LENGTH (apps/api/src/auth/domain/value-objects/password.vo.ts) — kept local, Application layer of this module does not import another module's Domain. */
export const MIN_STAFF_PASSWORD_LENGTH = 8;

const STAFF_ROLE_VALUES = ['COUTURIERE', 'MANAGER', 'ADMIN'] as const;

export class CreateStaffUserDto {
  @ApiProperty({ example: 'couturiere@angaly.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: STAFF_ROLE_VALUES })
  @IsIn(STAFF_ROLE_VALUES)
  role!: (typeof STAFF_ROLE_VALUES)[number];

  @ApiProperty({
    minLength: MIN_STAFF_PASSWORD_LENGTH,
    description: 'Initial password set directly by the ADMIN creating the account (no invite-email flow in this pass, see docs/features/users.md).',
  })
  @IsString()
  @MinLength(MIN_STAFF_PASSWORD_LENGTH)
  password!: string;
}
