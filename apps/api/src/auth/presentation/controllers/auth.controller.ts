import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthTokensResponseDto } from '../../application/dtos/auth-tokens-response.dto';
import { ForgotPasswordDto } from '../../application/dtos/forgot-password.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { RegisterDto } from '../../application/dtos/register.dto';
import { ResetPasswordDto } from '../../application/dtos/reset-password.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/logout-user.use-case';
import { RefreshAccessTokenUseCase } from '../../application/use-cases/refresh-access-token.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Broadened from the doc's literal "chemin restreint à /api/auth/refresh" to
 * "/api/auth" so /api/auth/logout can also read (and revoke) the cookie —
 * a cookie scoped to exactly /api/auth/refresh is never sent by the browser
 * on a sibling path like /api/auth/logout. Still excluded from every other
 * route on the API, which was the actual security goal.
 */
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const REFRESH_TOKEN_COOKIE_PATH = '/api/auth';

function buildUserResponse(user: UserEntity): AuthTokensResponseDto['user'] {
  return { id: user.id, email: user.email, role: user.role as AuthTokensResponseDto['user']['role'] };
}

function buildTokensResponse(accessToken: string, user: UserEntity): AuthTokensResponseDto {
  const response = new AuthTokensResponseDto();
  response.accessToken = accessToken;
  response.user = buildUserResponse(user);
  return response;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      expires: expiresAt,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_COOKIE_PATH });
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a User (role CLIENT) and its Customer profile, then start a session' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponseDto> {
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
    });
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpiresAt);

    return buildTokensResponse(accessToken, user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify credentials and start a session' })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<AuthTokensResponseDto> {
    const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await this.loginUserUseCase.execute(
      dto.email,
      dto.password,
    );
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpiresAt);

    return buildTokensResponse(accessToken, user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token (httpOnly cookie) and issue a new access token' })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthTokensResponseDto> {
    const cookies = req.cookies as Record<string, string | undefined>;
    const rawRefreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!rawRefreshToken) {
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('Missing refresh token');
    }

    const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.refreshAccessTokenUseCase.execute(rawRefreshToken);
    this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpiresAt);

    return buildTokensResponse(accessToken, user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token and clear its cookie' })
  @ApiResponse({ status: 204 })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const cookies = req.cookies as Record<string, string | undefined>;
    await this.logoutUserUseCase.execute(cookies[REFRESH_TOKEN_COOKIE]);
    this.clearRefreshTokenCookie(res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset link — always resolves the same way, never reveals if the email exists',
  })
  @ApiResponse({ status: 200 })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.requestPasswordResetUseCase.execute(dto.email);
    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume a password reset token and set a new password' })
  @ApiResponse({ status: 200 })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
    return { message: 'Password updated successfully.' };
  }
}
