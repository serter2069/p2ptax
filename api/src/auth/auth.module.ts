import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { EmailThrottlerGuard } from './email-throttler.guard';
import { IpThrottlerGuard } from './ip-throttler.guard';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailThrottlerGuard, IpThrottlerGuard, CleanupService],
  exports: [AuthService],
})
export class AuthModule {}
