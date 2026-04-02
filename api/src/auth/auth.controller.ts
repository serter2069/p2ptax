import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { IsEmail, IsString, Length, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { Response, Request } from 'express';
import { AuthService, TokenPair } from './auth.service';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_PATH = '/api/auth/refresh';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

class RequestOtpDto {
  @IsEmail()
  email!: string;
}

class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  @IsIn(['client', 'specialist'])
  role?: string;
}

class RefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_PATH,
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
}

function buildResponse(pair: TokenPair, res: Response): { accessToken: string } {
  setRefreshCookie(res, pair.refreshToken);
  // Also return refreshToken in body for native clients (React Native)
  return { accessToken: pair.accessToken, refreshToken: pair.refreshToken } as any;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.email);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pair = await this.authService.verifyOtp(body.email, body.code, body.role);
    return buildResponse(pair, res);
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Cookie takes priority; body.refreshToken is fallback for native clients
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE] ?? body.refreshToken;
    if (!token) {
      throw new Error('No refresh token provided');
    }
    const pair = await this.authService.refresh(token);
    return buildResponse(pair, res);
  }

  @Post('logout')
  async logout(
    @Body() body: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE] ?? body.refreshToken;
    if (token) {
      await this.authService.logout(token);
    }
    clearRefreshCookie(res);
    return { message: 'Logged out' };
  }
}
