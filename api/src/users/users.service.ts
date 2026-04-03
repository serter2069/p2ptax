import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Return current user profile (id, email, role, username). */
  async getMe(userId: string): Promise<{ id: string; email: string; role: string; username: string | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, role: user.role, username: user.username };
  }

  /**
   * Set role for a new user (onboarding step 1).
   * Only allowed when role is null (user has not yet picked a role).
   */
  async updateRole(userId: string, role: string): Promise<{ id: string; email: string; role: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== null) {
      throw new BadRequestException('Role already assigned. Cannot change role via this endpoint.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    return { id: updated.id, email: updated.email, role: updated.role };
  }

  /** Set username for a user. 3-20 chars, alphanumeric + underscore, globally unique. */
  async setUsername(userId: string, username: string): Promise<{ id: string; email: string; role: string; username: string }> {
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

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
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

    // #1896: Block privilege escalation — only allow during onboarding (no role yet).
    // Users who already completed onboarding (role = CLIENT or SPECIALIST) cannot
    // use this endpoint to switch their role.
    if (user.role === Role.CLIENT) {
      throw new BadRequestException('Role already assigned. Cannot change role via this endpoint.');
    }

    if (!user.username) throw new BadRequestException('Username must be set before creating specialist profile');

    const trimmedServices = services.map((s) => s.trim()).filter(Boolean);
    if (trimmedServices.length === 0) throw new BadRequestException('Services description cannot be empty');

    const trimmedCities = cities.map((c) => c.trim()).filter(Boolean);
    if (trimmedCities.length === 0) throw new BadRequestException('At least one city must be selected');

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
   * Delete a user and all related records.
   * Order matters: delete dependent records first, then the user.
   * (No ON DELETE CASCADE defined in Prisma schema, so we do it manually.)
   */
  async deleteUser(userId: string): Promise<{ deleted: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      // Reviews given by user
      this.prisma.review.deleteMany({ where: { clientId: userId } }),

      // Reviews received by user
      this.prisma.review.deleteMany({ where: { specialistId: userId } }),

      // Reviews on user's requests (from other clients)
      this.prisma.review.deleteMany({ where: { request: { clientId: userId } } }),

      // Messages sent by user
      this.prisma.message.deleteMany({ where: { senderId: userId } }),

      // Messages in threads where user is a participant (other participant's messages)
      this.prisma.message.deleteMany({
        where: {
          thread: {
            OR: [{ participant1Id: userId }, { participant2Id: userId }],
          },
        },
      }),

      // Threads
      this.prisma.thread.deleteMany({
        where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      }),

      // Responses by user
      this.prisma.response.deleteMany({ where: { specialistId: userId } }),

      // Responses to user's requests
      this.prisma.response.deleteMany({
        where: { request: { clientId: userId } },
      }),

      // Requests
      this.prisma.request.deleteMany({ where: { clientId: userId } }),

      // Promotions
      this.prisma.promotion.deleteMany({ where: { specialistId: userId } }),

      // Specialist profile
      this.prisma.specialistProfile.deleteMany({ where: { userId } }),

      // Finally, the user
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { deleted: true };
  }
}
