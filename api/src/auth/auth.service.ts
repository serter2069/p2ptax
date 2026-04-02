import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEV_OTP = '000000';

function generateOtp(): string {
  if (process.env.DEV_AUTH === 'true') {
    return DEV_OTP;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function mapRole(role?: string): Role {
  if (role === 'specialist') return Role.SPECIALIST;
  return Role.CLIENT;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private generateAccessToken(user: { id: string; email: string; role: Role }): string {
    return this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' },
    );
  }

  private generateRefreshTokenValue(): string {
    return this.jwt.sign(
      { sub: Math.random().toString(36) },
      {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: '30d',
      },
    );
  }

  private async storeRefreshToken(userId: string, tokenValue: string): Promise<void> {
    const tokenHash = hashToken(tokenValue);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  private async issueTokenPair(user: { id: string; email: string; role: Role }): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshTokenValue();
    await this.storeRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  async requestOtp(email: string): Promise<{ message: string }> {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Store OTP in DB only (no in-memory store)
    await this.prisma.otpCode.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    // In dev mode: log code to console. In prod: send email (implement later)
    if (process.env.DEV_AUTH === 'true') {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return { message: 'OTP sent to email' };
  }

  async verifyOtp(email: string, code: string, role?: string): Promise<TokenPair> {
    const normalizedEmail = email.toLowerCase();

    // Find latest unused, non-expired OTP from DB
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

    if (otpRecord.code !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Check if user already exists to preserve existing role
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Assign role only on first login; subsequent logins preserve existing role
    const assignedRole = existingUser ? existingUser.role : mapRole(role);

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, role: assignedRole },
      update: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (new Date() > stored.expiresAt) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate: delete old token, issue new pair
    await this.prisma.refreshToken.delete({ where: { tokenHash } });

    return this.issueTokenPair(stored.user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
}
