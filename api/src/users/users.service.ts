import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, TokenPair } from '../auth/auth.service';
import { EmailService } from '../notifications/email.service';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  /** Return current user profile (id, email, role, username). */
  async getMe(userId: string): Promise<{ id: string; email: string; role: string; username: string | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, role: user.role, username: user.username };
  }

  /**
   * Set role for a new user (onboarding step 1).
   * Allowed when user's role is still CLIENT (schema default = "not yet chosen").
   * Blocked only when user already completed specialist onboarding (role = SPECIALIST).
   */
  async updateRole(userId: string, role: string): Promise<{ id: string; email: string; role: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    // Block direct assignment to SPECIALIST — must go through specialist setup flow.
    if (role === Role.SPECIALIST) {
      throw new BadRequestException('Use specialist setup flow to become a specialist');
    }

    // The Prisma schema sets role = CLIENT by default (not null), so checking !== null
    // would always block. Instead, block only when role was explicitly set to SPECIALIST
    // (i.e., the user completed specialist onboarding).
    if (user.role === Role.SPECIALIST) {
      throw new BadRequestException('Role already assigned. Cannot change role via this endpoint.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    return { id: updated.id, email: updated.email, role: updated.role };
  }

  /** Set username (+ optional firstName/lastName) for a user. */
  async setUsername(userId: string, username: string, firstName?: string, lastName?: string): Promise<{ id: string; email: string; role: string; username: string }> {
    if (username.length < 3 || username.length > 20) {
      throw new BadRequestException('Username must be between 3 and 20 characters');
    }
    if (!USERNAME_REGEX.test(username)) {
      throw new BadRequestException('Username can only contain letters, numbers, and underscores');
    }

    const taken = await this.prisma.user.findUnique({ where: { username } });
    if (taken && taken.id !== userId) {
      throw new ConflictException('Username already taken');
    }

    const data: Record<string, unknown> = { username };
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return { id: user.id, email: user.email, role: user.role, username: user.username! };
  }

  /**
   * Onboarding step 3: set cities + services, create SpecialistProfile, promote user to SPECIALIST.
   * Nick is taken from the user's username (set in step 1).
   * No role guard — called during onboarding before the role is assigned.
   */
  async setupSpecialistProfile(
    userId: string,
    cities: string[],
    services: string[],
    fnsOffices?: string[],
  ): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Block re-submission when user is already a specialist.
    if (user.role === Role.SPECIALIST) {
      throw new BadRequestException('Already a specialist');
    }

    if (!user.username) throw new BadRequestException('Username must be set before creating specialist profile');

    const trimmedServices = services.map((s) => s.trim()).filter(Boolean);
    const trimmedCities = cities.map((c) => c.trim()).filter(Boolean);

    // Profile is complete only when cities and services are provided
    const profileComplete = trimmedCities.length > 0 && trimmedServices.length > 0;

    // Check for existing profile (idempotent — allow re-submission)
    const existing = await this.prisma.specialistProfile.findUnique({ where: { userId } });

    const trimmedFnsOffices = (fnsOffices ?? []).map((f) => f.trim()).filter(Boolean);

    if (existing) {
      // Update existing profile and ensure role is SPECIALIST
      await this.prisma.$transaction([
        this.prisma.specialistProfile.update({
          where: { userId },
          data: {
            cities: trimmedCities,
            services: trimmedServices,
            ...(trimmedFnsOffices.length > 0 && { fnsOffices: trimmedFnsOffices }),
            profileComplete,
          },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { role: Role.SPECIALIST },
        }),
      ]);
    } else {
      // Check nick uniqueness (username is used as nick)
      const nickTaken = await this.prisma.specialistProfile.findUnique({ where: { nick: user.username } });
      if (nickTaken) throw new ConflictException('Nick already taken');

      await this.prisma.$transaction([
        this.prisma.specialistProfile.create({
          data: {
            userId,
            nick: user.username,
            cities: trimmedCities,
            services: trimmedServices,
            fnsOffices: trimmedFnsOffices,
            badges: [],
            profileComplete,
          },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { role: Role.SPECIALIST },
        }),
      ]);
    }

    return { ok: true };
  }

  /** Return user settings */
  async getSettings(userId: string): Promise<{ emailNotifications: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { emailNotifications: user.emailNotifications };
  }

  /** Update user settings (email notifications etc.) */
  async updateSettings(
    userId: string,
    settings: { emailNotifications?: boolean },
  ): Promise<{ emailNotifications: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(settings.emailNotifications !== undefined && { emailNotifications: settings.emailNotifications }),
      },
    });

    return { emailNotifications: updated.emailNotifications };
  }

  /**
   * Step 1: Request OTP sent to the NEW email address.
   * Validates new email is not already registered, then sends OTP.
   */
  async requestEmailChange(userId: string, newEmail: string): Promise<{ message: string }> {
    const normalizedEmail = newEmail.toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email === normalizedEmail) {
      throw new BadRequestException('New email must be different from current email');
    }

    // Check new email is not already taken by another account
    const taken = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (taken) {
      throw new ConflictException('Email is already registered');
    }

    // Reuse OTP infrastructure — generate code, store in OtpCode table keyed by new email
    const isDev = process.env.DEV_AUTH === 'true';
    const code = isDev ? '000000' : String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.otpCode.create({
      data: { email: normalizedEmail, code, expiresAt },
    });

    if (isDev) {
      this.logger.debug(`[DEV] Email change OTP for ${normalizedEmail}: ${code}`);
    } else {
      await this.emailService.sendOtp(normalizedEmail, code);
    }

    return { message: 'OTP sent to new email' };
  }

  /**
   * Step 2: Verify OTP for the new email, update email in DB, issue new tokens.
   * Trap #3: re-checks email uniqueness to guard against race conditions.
   */
  async confirmEmailChange(
    userId: string,
    newEmail: string,
    code: string,
  ): Promise<TokenPair & { email: string }> {
    const normalizedEmail = newEmail.toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email === normalizedEmail) {
      throw new BadRequestException('New email must be different from current email');
    }

    // Find latest unused, non-expired OTP for the new email
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

    if (otpRecord.attempts >= 3) {
      throw new UnauthorizedException('Too many OTP attempts');
    }

    if (otpRecord.code !== code) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // Atomically: mark OTP as used AND update email only if the new email is still unclaimed.
    // Using $transaction eliminates the TOCTOU race between the uniqueness check and the UPDATE.
    // updateMany with a NOT-EXISTS-style where clause returns count=0 if the email was taken
    // by another user between OTP verification and this point.
    let updatedUser: User;
    try {
      [, updatedUser] = await this.prisma.$transaction([
        this.prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { usedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { email: normalizedEmail },
        }),
      ]);
    } catch (err: unknown) {
      // P2002 = Prisma unique constraint violation — the email was taken concurrently
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === 'P2002') {
        throw new ConflictException('Email was just registered by another user. Please try a different email.');
      }
      throw err;
    }

    // Revoke all existing refresh tokens for this user (forces re-auth with new identity)
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    // Issue new token pair with updated email
    const tokens = await this.authService.generateTokensPublic(updatedUser);

    return { ...tokens, email: updatedUser.email };
  }

  /**
   * Delete a user and all related records.
   * Uses interactive transaction with sequential awaits to guarantee
   * FK-safe deletion order. Nested relation filters are replaced with
   * explicit requestId/threadId lookups to avoid issues inside transactions.
   */
  async deleteUser(userId: string): Promise<{ deleted: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const userEmail = user.email;

    await this.prisma.$transaction(async (tx) => {
      // Collect IDs of user's requests up front (needed for cascade deletes below)
      const userRequests = await tx.request.findMany({
        where: { clientId: userId },
        select: { id: true },
      });
      const requestIds = userRequests.map((r) => r.id);

      // Collect IDs of threads where user participates (needed for message cleanup)
      const userThreads = await tx.thread.findMany({
        where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
        select: { id: true },
      });
      const threadIds = userThreads.map((t) => t.id);

      // 1. Complaints (reference User directly)
      await tx.complaint.deleteMany({ where: { reporterId: userId } });
      await tx.complaint.deleteMany({ where: { targetUserId: userId } });

      // 2. Reviews (reference User and Request)
      await tx.review.deleteMany({ where: { clientId: userId } });
      await tx.review.deleteMany({ where: { specialistId: userId } });
      if (requestIds.length > 0) {
        await tx.review.deleteMany({ where: { requestId: { in: requestIds } } });
      }

      // 3. Messages (reference Thread and User; delete all in user's threads)
      if (threadIds.length > 0) {
        await tx.message.deleteMany({ where: { threadId: { in: threadIds } } });
      }

      // 4. Threads
      if (threadIds.length > 0) {
        await tx.thread.deleteMany({ where: { id: { in: threadIds } } });
      }

      // 5. Responses by user (specialist responding to others' requests)
      await tx.response.deleteMany({ where: { specialistId: userId } });

      // 6. Responses to user's own requests (from other specialists)
      if (requestIds.length > 0) {
        await tx.response.deleteMany({ where: { requestId: { in: requestIds } } });
      }

      // 7. Requests
      await tx.request.deleteMany({ where: { clientId: userId } });

      // 8. Promotions
      await tx.promotion.deleteMany({ where: { specialistId: userId } });

      // 9. Specialist profile
      await tx.specialistProfile.deleteMany({ where: { userId } });

      // 10. Refresh tokens
      await tx.refreshToken.deleteMany({ where: { userId } });

      // 11. OTP codes (no FK, keyed by email)
      await tx.otpCode.deleteMany({ where: { email: userEmail } });

      // 12. User
      await tx.user.delete({ where: { id: userId } });
    });

    return { deleted: true };
  }
}
