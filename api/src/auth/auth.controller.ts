import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, Length, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthService } from './auth.service';
import { EmailThrottlerGuard } from './email-throttler.guard';

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
  @IsString()
  refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(EmailThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 3 } })
  @Post('request-otp')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.email);
  }

  @UseGuards(EmailThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.code, body.role);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }
}
