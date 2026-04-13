import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, Length, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { EmailThrottlerGuard } from './email-throttler.guard';
import { IpThrottlerGuard } from './ip-throttler.guard';

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

class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Sets httpOnly cookies alongside body tokens so both web and native are served. */
  private setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
      path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh',
    });
  }

  @UseGuards(EmailThrottlerGuard, IpThrottlerGuard)
  @Throttle({
    'email-otp': { ttl: 900000, limit: 3 },
    'ip-otp': { ttl: 900000, limit: 10 },
  })
  @Post('request-otp')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.email);
  }

  @UseGuards(EmailThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @Post('verify-otp')
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(body.email, body.code, body.role);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept refreshToken from body (native) or cookie (web)
    const refreshToken = body.refreshToken ?? (req.cookies as Record<string, string>)?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  @Post('logout')
  async logout(
    @Body() body: LogoutDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept refreshToken from body (native) or cookie (web)
    const refreshToken = body.refreshToken ?? (req.cookies as Record<string, string>)?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    // Clear cookies for web clients
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return { ok: true };
  }
}
