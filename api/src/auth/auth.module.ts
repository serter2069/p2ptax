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
      // useFactory defers env access until runtime (after Doppler/process.env is populated),
      // avoiding the issue where process.env.JWT_SECRET is read at module-import time.
      useFactory: () => ({
        // No global expiresIn — each jwt.sign call specifies its own expiry
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailThrottlerGuard, IpThrottlerGuard, CleanupService],
  exports: [AuthService],
})
export class AuthModule {}
