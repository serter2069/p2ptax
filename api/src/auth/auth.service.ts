import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { Role } from '@prisma/client';

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEV_OTP = '000000';

function generateOtp(): string {
  if (process.env.DEV_AUTH === 'true') {
    return DEV_OTP;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function mapRole(role?: string): Role {
  if (role === 'specialist') return Role.SPECIALIST;
  return Role.CLIENT;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpResult extends TokenPair {
  isNewUser: boolean;
  user: { userId: string; email: string; role: string; username: string | null };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /** Public alias for generating tokens — used by UsersService for email change flow. */
  async generateTokensPublic(user: { id: string; email: string; role: Role }): Promise<TokenPair> {
    return this.generateTokens(user);
  }

  private async generateTokens(user: { id: string; email: string; role: Role }): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwt.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_SECRET! + '-refresh',
        expiresIn: '30d',
      },
    );

    // Store refresh token in DB for rotation tracking
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return { accessToken, refreshToken };
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    // #2266: Block OTP request for suspended users
    const blockedUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { isBlocked: true },
    });
    if (blockedUser?.isBlocked) {
      throw new ForbiddenException('Аккаунт заблокирован');
    }

    // #1860: Block new OTP if there is an active one with >= 3 failed attempts
    const lockedOtp = await this.prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { gte: 5 },
      },
    });
    if (lockedOtp) {
      throw new HttpException(
        'Too many OTP attempts. Wait for the current code to expire before requesting a new one.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Store OTP in DB (sole source of truth — survives server restarts)
    await this.prisma.otpCode.create({
      data: { email: normalizedEmail, code, expiresAt },
    });

    // In dev mode: log code to console. In prod: send email via EmailService
    if (process.env.DEV_AUTH === 'true') {
      console.log(`[DEV] OTP for ${normalizedEmail}: ${code}`);
    } else {
      await this.emailService.sendOtp(normalizedEmail, code);
    }

    return { message: 'OTP sent to email' };
  }

  async verifyOtp(email: string, code: string, role?: string): Promise<VerifyOtpResult> {
    const normalizedEmail = email.toLowerCase();

    // Find the latest unused, non-expired OTP for this email from DB
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found or expired');
    }

    // Check attempt counter BEFORE verifying the code
    if (otpRecord.attempts >= 5) {
      throw new HttpException('Too many OTP attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (otpRecord.code !== code) {
      // Increment attempt counter, then reject
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // Code is correct — mark used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Check if user already exists to preserve existing role
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // #2266: Block login for suspended users (new users cannot be blocked)
    if (existingUser?.isBlocked) {
      throw new ForbiddenException('Аккаунт заблокирован');
    }

    const isNewUser = !existingUser;

    // Assign role only on first login; subsequent logins preserve existing role
    const assignedRole = existingUser ? existingUser.role : mapRole(role);

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, role: assignedRole },
      update: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      isNewUser,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_SECRET! + '-refresh',
      }) as { sub: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // #1841: Check token exists in DB and is not revoked
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Revoke the old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }
}
