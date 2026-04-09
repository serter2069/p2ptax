import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '/api/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: { query?: { state?: string } },
    _accessToken: string,
    _refreshToken: string,
    profile: { emails?: { value: string }[]; name?: { givenName?: string; familyName?: string } },
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      done(new UnauthorizedException('No email in Google profile'), false);
      return;
    }

    const firstName = profile.name?.givenName;
    const lastName = profile.name?.familyName;

    // Pass through the state param (contains frontend origin)
    const state = req.query?.state ?? '';

    const isNewUser = !(await this.prisma.user.findUnique({ where: { email } }));

    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        role: 'CLIENT',
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      update: { lastLoginAt: new Date() },
    });

    const tokens = await this.authService.generateTokensPublic(user);

    done(null, {
      ...tokens,
      isNewUser,
      frontendOrigin: state,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    });
  }
}
