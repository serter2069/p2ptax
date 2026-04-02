import { Controller, Post, Body } from '@nestjs/common';
import { IsEmail, IsString, Length, IsOptional, IsIn } from 'class-validator';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

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
  @IsIn(['client', 'specialist'])
  role?: string;
}

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 5 requests per minute per IP — prevents OTP spam and brute-force
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('request-otp')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.email);
  }

  // 10 attempts per minute per IP — prevents OTP brute-force
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.code, body.role);
  }

  // Skip global throttle — /refresh is called proactively every 20 min by the app
  @SkipThrottle()
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }
}
