import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
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
  ) {}

  private generateTokens(user: { id: string; email: string; role: Role }): TokenPair {
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
    return { accessToken, refreshToken };
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Store OTP in DB (sole source of truth — survives server restarts)
    await this.prisma.otpCode.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    // In dev mode: log code to console. In prod: send email (implement later)
    if (process.env.DEV_AUTH === 'true') {
      console.log(`[DEV] OTP for ${email}: ${code}`);
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
    if (otpRecord.attempts >= 3) {
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

    const isNewUser = !existingUser;

    // Assign role only on first login; subsequent logins preserve existing role
    const assignedRole = existingUser ? existingUser.role : mapRole(role);

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, role: assignedRole },
      update: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens(user);
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

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }
}
