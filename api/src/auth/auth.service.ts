import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

// In-memory OTP store: email -> { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEV_OTP = '000000';

function generateOtp(): string {
  if (process.env.DEV_AUTH === 'true') {
    return DEV_OTP;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async requestOtp(email: string): Promise<{ message: string }> {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    otpStore.set(email.toLowerCase(), { code, expiresAt });

    // Store OTP in DB for audit (create new record per request)
    await this.prisma.otpCode.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    // In dev mode: log code to console. In prod: send email (implement later)
    if (process.env.DEV_AUTH === 'true') {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return { message: 'OTP sent to email' };
  }

  async verifyOtp(email: string, code: string): Promise<{ token: string }> {
    const normalizedEmail = email.toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      throw new BadRequestException('OTP not found or expired');
    }

    if (new Date() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      throw new BadRequestException('OTP expired');
    }

    if (record.code !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark used in DB — find latest unused OTP for this email
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: { email: normalizedEmail, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (otpRecord) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
    }

    otpStore.delete(normalizedEmail);

    // Upsert user
    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail },
      update: { lastLoginAt: new Date() },
    });

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token };
  }
}
