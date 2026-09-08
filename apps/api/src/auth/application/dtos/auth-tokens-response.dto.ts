import { ApiProperty } from '@nestjs/swagger';
import { AuthTokensDto, AuthUserDto, Role } from '@angaly/types';

export class AuthUserResponseDto implements AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}

/** The refresh token is never in this body — it's set as an httpOnly cookie directly. */
export class AuthTokensResponseDto implements AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}
