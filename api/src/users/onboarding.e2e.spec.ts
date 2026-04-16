import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../notifications/email.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

/**
 * E2E-style tests for the specialist onboarding flow:
 *   Step 1: Username (+ firstName/lastName)
 *   Step 2: Work area (cities, services, FNS)
 *   Step 3: Profile completion → SPECIALIST role
 *
 * Tests the full flow through UsersService methods that back the API endpoints.
 */

// Minimal Role enum to avoid full Prisma client generation
const Role = {
  CLIENT: 'CLIENT',
  SPECIALIST: 'SPECIALIST',
} as const;

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'spec@test.com',
    role: Role.CLIENT,
    username: null as string | null,
    firstName: null as string | null,
    lastName: null as string | null,
    phone: null as string | null,
    avatarUrl: null as string | null,
    notifyNewMessages: true,
    ...overrides,
  };
}

describe('Specialist onboarding — full flow', () => {
  let service: UsersService;
  let prisma: any;
  let authService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      specialistProfile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      specialistFns: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      specialistService: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
      otpCode: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((args: any) => {
        if (typeof args === 'function') return args(prisma);
        return Promise.all(args);
      }),
    };

    authService = {
      generateTokensPublic: jest.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
    };

    const emailService = {
      sendOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // -------------------------------------------------------------------------
  // Test 1: New user redirected to username page (isNewUser flag)
  // -------------------------------------------------------------------------
  describe('Step 1: Username', () => {
    it('should return user profile with null username for new user', async () => {
      const user = makeUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const me = await service.getMe('user-1');

      expect(me.username).toBeNull();
      expect(me.role).toBe(Role.CLIENT);
    });

    // Test 2: Username validation — too short
    it('should reject username shorter than 3 chars', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(service.setUsername('user-1', 'ab')).rejects.toThrow(
        BadRequestException,
      );
    });

    // Test 2: Username validation — invalid chars
    it('should reject username with invalid characters', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(service.setUsername('user-1', 'user@name!')).rejects.toThrow(
        BadRequestException,
      );
    });

    // Test 2: Username validation — taken username
    it('should reject already taken username with 409', async () => {
      const user = makeUser();
      prisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id) return Promise.resolve(user); // lookup by userId
        if (where.username) return Promise.resolve({ id: 'other-user', username: 'taken_name' }); // lookup by username
        return Promise.resolve(null);
      });

      await expect(
        service.setUsername('user-1', 'taken_name'),
      ).rejects.toThrow(ConflictException);
    });

    // Test 3: Valid username — availability check shows available
    it('should confirm username is available when not taken', async () => {
      prisma.specialistProfile.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await service.checkUsernameAvailability('free_nick');

      expect(result).toEqual({ available: true });
    });

    it('should report username unavailable when already in use', async () => {
      prisma.specialistProfile.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue({ id: 'other', username: 'taken' });

      const result = await service.checkUsernameAvailability('taken');

      expect(result).toEqual({ available: false });
    });

    it('should report unavailable for invalid format (too short)', async () => {
      const result = await service.checkUsernameAvailability('ab');

      expect(result).toEqual({ available: false });
    });

    // Test 3: Valid username → save successfully
    it('should set username with firstName and lastName', async () => {
      const user = makeUser();
      prisma.user.findUnique
        .mockResolvedValueOnce(user) // lookup by userId
        .mockResolvedValueOnce(null); // lookup by username (not taken)

      const updated = {
        ...user,
        username: 'ivan_ivanov',
        firstName: 'Ivan',
        lastName: 'Ivanov',
      };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.setUsername('user-1', 'ivan_ivanov', 'Ivan', 'Ivanov');

      expect(result.username).toBe('ivan_ivanov');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { username: 'ivan_ivanov', firstName: 'Ivan', lastName: 'Ivanov' },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Test 4-5: Work area — cities, FNS, services selection
  // -------------------------------------------------------------------------
  describe('Step 2: Work area (setupSpecialistProfile)', () => {
    const userWithUsername = makeUser({ username: 'ivan_ivanov' });

    // Test 5: Validation — at least 1 city and 1 service required for profileComplete
    it('should mark profileComplete=false when cities empty', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithUsername);
      prisma.specialistProfile.findUnique.mockResolvedValue(null);

      const nickCheck = null;
      prisma.specialistProfile.findUnique
        .mockResolvedValueOnce(null) // existing profile check
        .mockResolvedValueOnce(nickCheck); // nick uniqueness check

      prisma.specialistProfile.create.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      prisma.user.update.mockResolvedValue({ ...userWithUsername, role: Role.SPECIALIST });

      await service.setupSpecialistProfile('user-1', [], ['Service A']);

      // $transaction receives array of promises
      expect(prisma.$transaction).toHaveBeenCalled();
      const txArg = prisma.$transaction.mock.calls[0][0];
      // Verify the create call had profileComplete = false
      expect(prisma.specialistProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            profileComplete: false,
            cities: [],
          }),
        }),
      );
    });

    // Test 4: Select city → FNS → services → continue
    it('should create specialist profile with cities, services, and FNS', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithUsername);
      prisma.specialistProfile.findUnique
        .mockResolvedValueOnce(null) // existing profile
        .mockResolvedValueOnce(null); // nick check

      prisma.specialistProfile.create.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      prisma.user.update.mockResolvedValue({ ...userWithUsername, role: Role.SPECIALIST });

      const result = await service.setupSpecialistProfile(
        'user-1',
        ['Moscow', 'Saint Petersburg'],
        ['Tax consulting', 'Audit'],
        ['fns-001', 'fns-002'],
      );

      expect(result).toEqual({ ok: true });
      expect(prisma.specialistProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nick: 'ivan_ivanov',
            cities: ['Moscow', 'Saint Petersburg'],
            services: ['Tax consulting', 'Audit'],
            fnsOffices: ['fns-001', 'fns-002'],
            profileComplete: true,
          }),
        }),
      );
    });

    // Test 5: At least 1 FNS with 1 service — fnsServices join table
    it('should write join tables when fnsServices provided', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithUsername);
      prisma.specialistProfile.findUnique
        .mockResolvedValueOnce(null) // existing
        .mockResolvedValueOnce(null) // nick
        .mockResolvedValueOnce({ id: 'sp-1', userId: 'user-1' }); // for sync

      prisma.specialistProfile.create.mockResolvedValue({ id: 'sp-1' });
      prisma.user.update.mockResolvedValue({ ...userWithUsername, role: Role.SPECIALIST });
      prisma.service.findUnique.mockResolvedValue({ id: 'svc-1', name: 'Tax consulting' });
      prisma.specialistFns.create.mockResolvedValue({});
      prisma.specialistService.create.mockResolvedValue({});

      await service.setupSpecialistProfile(
        'user-1',
        ['Moscow'],
        ['Tax consulting'],
        ['fns-001'],
        [{ fnsId: 'fns-001', serviceNames: ['Tax consulting'] }],
      );

      expect(prisma.specialistFns.deleteMany).toHaveBeenCalledWith({
        where: { specialistId: 'sp-1' },
      });
      expect(prisma.specialistFns.create).toHaveBeenCalledWith({
        data: { specialistId: 'sp-1', fnsId: 'fns-001' },
      });
      expect(prisma.specialistService.create).toHaveBeenCalledWith({
        data: { specialistId: 'sp-1', fnsId: 'fns-001', serviceId: 'svc-1' },
      });
    });

    it('should require username before creating specialist profile', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ username: null }));

      await expect(
        service.setupSpecialistProfile('user-1', ['Moscow'], ['Service A']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // Test 6-7: Profile completion → SPECIALIST role → redirect
  // -------------------------------------------------------------------------
  describe('Step 3: Profile completion', () => {
    const userWithUsername = makeUser({ username: 'ivan_ivanov' });

    // Test 6: Fill profile data (name, phone, bio) + complete
    it('should update profile fields (firstName, lastName, phone)', async () => {
      const user = makeUser({ username: 'ivan_ivanov' });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({
        ...user,
        firstName: 'Ivan',
        lastName: 'Ivanov',
        phone: '+79001234567',
      });

      const result = await service.updateProfile('user-1', {
        firstName: 'Ivan',
        lastName: 'Ivanov',
        phone: '+79001234567',
      });

      expect(result.firstName).toBe('Ivan');
      expect(result.lastName).toBe('Ivanov');
      expect(result.phone).toBe('+79001234567');
    });

    // Test 7: After completion → user role is SPECIALIST
    it('should promote user to SPECIALIST role after onboarding', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithUsername);
      prisma.specialistProfile.findUnique
        .mockResolvedValueOnce(null) // existing
        .mockResolvedValueOnce(null); // nick

      const specialistUser = { ...userWithUsername, role: Role.SPECIALIST };
      prisma.specialistProfile.create.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      prisma.user.update.mockResolvedValue(specialistUser);

      await service.setupSpecialistProfile(
        'user-1',
        ['Moscow'],
        ['Tax consulting'],
      );

      // Verify user.update was called with SPECIALIST role
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: Role.SPECIALIST },
      });
    });

    // Test 6: Bio and telegram saved through specialist profile
    it('should save bio and telegram in specialist profile', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithUsername);
      prisma.specialistProfile.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      prisma.specialistProfile.create.mockResolvedValue({ id: 'sp-1' });
      prisma.user.update.mockResolvedValue({ ...userWithUsername, role: Role.SPECIALIST });

      await service.setupSpecialistProfile(
        'user-1',
        ['Moscow'],
        ['Tax consulting'],
        [],
        undefined,
        { displayName: 'Ivan Ivanov', bio: 'Tax expert', telegram: '@ivan' },
      );

      expect(prisma.specialistProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayName: 'Ivan Ivanov',
            bio: 'Tax expert',
            telegram: '@ivan',
          }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 8: Onboarding not shown on next login (already completed)
  // -------------------------------------------------------------------------
  describe('Re-entry guard', () => {
    it('should reject re-submission when user is already SPECIALIST', async () => {
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ username: 'ivan_ivanov', role: Role.SPECIALIST }),
      );

      await expect(
        service.setupSpecialistProfile('user-1', ['Moscow'], ['Tax consulting']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return SPECIALIST role on getMe after onboarding', async () => {
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ username: 'ivan_ivanov', role: Role.SPECIALIST }),
      );

      const me = await service.getMe('user-1');

      expect(me.role).toBe(Role.SPECIALIST);
      expect(me.username).toBe('ivan_ivanov');
    });
  });

  // -------------------------------------------------------------------------
  // Test 9: Progress indicator — step tracking (idempotent update)
  // -------------------------------------------------------------------------
  describe('Idempotent profile update (re-entry on same step)', () => {
    it('should update existing specialist profile instead of creating duplicate', async () => {
      const userWithUsername = makeUser({ username: 'ivan_ivanov', role: Role.CLIENT });
      prisma.user.findUnique.mockResolvedValue(userWithUsername);

      // Existing profile found (user returned to work area step)
      const existingProfile = {
        id: 'sp-1',
        userId: 'user-1',
        nick: 'ivan_ivanov',
        cities: ['Moscow'],
        services: ['Old service'],
      };
      prisma.specialistProfile.findUnique.mockResolvedValue(existingProfile);
      prisma.specialistProfile.update.mockResolvedValue({
        ...existingProfile,
        cities: ['Moscow', 'Kazan'],
        services: ['Tax consulting'],
      });
      prisma.user.update.mockResolvedValue({ ...userWithUsername, role: Role.SPECIALIST });

      const result = await service.setupSpecialistProfile(
        'user-1',
        ['Moscow', 'Kazan'],
        ['Tax consulting'],
      );

      expect(result).toEqual({ ok: true });
      expect(prisma.specialistProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          cities: ['Moscow', 'Kazan'],
          services: ['Tax consulting'],
          profileComplete: true,
        }),
      });
      // Should NOT have called create
      expect(prisma.specialistProfile.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Full flow: username → work area → profile → specialist
  // -------------------------------------------------------------------------
  describe('Complete onboarding flow end-to-end', () => {
    it('should complete full specialist onboarding in sequence', async () => {
      const userId = 'user-1';
      const baseUser = makeUser();

      // --- Step 1: Check username availability ---
      prisma.specialistProfile.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);
      const available = await service.checkUsernameAvailability('ivan_tax');
      expect(available).toEqual({ available: true });

      // --- Step 1: Set username ---
      prisma.user.findUnique
        .mockResolvedValueOnce(baseUser) // lookup user
        .mockResolvedValueOnce(null); // username not taken

      const withUsername = { ...baseUser, username: 'ivan_tax', firstName: 'Ivan', lastName: 'Ivanov' };
      prisma.user.update.mockResolvedValue(withUsername);

      const step1 = await service.setUsername(userId, 'ivan_tax', 'Ivan', 'Ivanov');
      expect(step1.username).toBe('ivan_tax');

      // --- Step 2: Update profile fields (phone) ---
      prisma.user.findUnique.mockReset();
      prisma.user.update.mockReset();
      prisma.user.findUnique.mockResolvedValue(withUsername);
      prisma.user.update.mockResolvedValue({ ...withUsername, phone: '+79001234567' });
      const step2profile = await service.updateProfile(userId, { phone: '+79001234567' });
      expect(step2profile.phone).toBe('+79001234567');

      // --- Step 3: Setup specialist profile (cities + services + FNS) ---
      prisma.user.findUnique.mockReset();
      prisma.user.update.mockReset();
      prisma.specialistProfile.findUnique.mockReset();
      const userForSpecSetup = { ...withUsername, phone: '+79001234567' };
      prisma.user.findUnique.mockResolvedValue(userForSpecSetup);
      prisma.specialistProfile.findUnique
        .mockResolvedValueOnce(null) // no existing
        .mockResolvedValueOnce(null); // nick not taken

      prisma.specialistProfile.create.mockResolvedValue({ id: 'sp-1', userId });
      prisma.user.update.mockResolvedValue({ ...userForSpecSetup, role: Role.SPECIALIST });

      const step3 = await service.setupSpecialistProfile(
        userId,
        ['Moscow'],
        ['Tax consulting', 'Audit'],
        ['fns-moscow-01'],
        undefined,
        { displayName: 'Ivan Ivanov', bio: 'Experienced tax consultant', telegram: '@ivan_tax' },
      );
      expect(step3).toEqual({ ok: true });

      // --- Verify final state: user is SPECIALIST ---
      prisma.user.findUnique.mockReset();
      prisma.user.findUnique.mockResolvedValue({
        ...userForSpecSetup,
        role: Role.SPECIALIST,
      });
      const finalState = await service.getMe(userId);
      expect(finalState.role).toBe(Role.SPECIALIST);
      expect(finalState.username).toBe('ivan_tax');
    });
  });
});
