import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

// Minimal enums matching Prisma client
const RequestStatus = {
  NEW: 'NEW',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSING_SOON: 'CLOSING_SOON',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

const ResponseStatus = {
  sent: 'sent',
  viewed: 'viewed',
  accepted: 'accepted',
  deactivated: 'deactivated',
} as const;

/**
 * Request lifecycle E2E tests:
 *   create → specialist responds → chat → close → review
 *
 * These are integration-style tests with mocked Prisma, covering the full
 * lifecycle across RequestsService methods in sequence.
 */
describe('Request lifecycle E2E', () => {
  let service: RequestsService;
  let prisma: any;
  let emailService: any;
  let inAppNotifService: any;

  // Shared state across tests within "Full lifecycle" suite
  const CLIENT_ID = 'client-1';
  const SPECIALIST_ID = 'specialist-1';
  const REQUEST_ID = 'req-lifecycle-1';
  const RESPONSE_ID = 'resp-1';
  const THREAD_ID = 'thread-1';
  const SPECIALIST_NICK = 'tax-pro';

  beforeEach(async () => {
    prisma = {
      request: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      response: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      review: {
        create: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
      specialistProfile: {
        findUnique: jest.fn(),
      },
      thread: {
        upsert: jest.fn(),
      },
      message: {
        create: jest.fn(),
      },
      setting: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      quickRequest: {
        create: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    emailService = {
      notifyNewResponse: jest.fn(),
      notifyNewRequestInCity: jest.fn(),
      notifyRequestClosingSoon: jest.fn(),
      notifyResponseAccepted: jest.fn(),
    };

    inAppNotifService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
        { provide: InAppNotificationService, useValue: inAppNotifService },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  // ─── Test 1: Create new request ───────────────────────────────────
  describe('Test 1: Create new request — form validation + submit', () => {
    it('should create a request with valid data', async () => {
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.request.count.mockResolvedValue(0);
      prisma.request.create.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        title: 'Tax consultation needed',
        description: 'I need help with my annual tax return filing process',
        city: 'Moscow',
        status: RequestStatus.OPEN,
        category: 'Камеральная проверка',
        budget: 10000,
        createdAt: new Date(),
      });

      const result = await service.create(CLIENT_ID, {
        title: 'Tax consultation needed',
        description: 'I need help with my annual tax return filing process',
        city: 'Moscow',
        category: 'Камеральная проверка',
        budget: 10000,
      });

      expect(result.id).toBe(REQUEST_ID);
      expect(result.status).toBe(RequestStatus.OPEN);
      expect(prisma.request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          title: 'Tax consultation needed',
          city: 'Moscow',
        }),
      });
    });

    it('should reject request with short title', async () => {
      await expect(
        service.create(CLIENT_ID, {
          title: 'ab',
          description: 'I need help with my annual tax return filing process',
          city: 'Moscow',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject request with short description', async () => {
      await expect(
        service.create(CLIENT_ID, {
          title: 'Valid title',
          description: 'short',
          city: 'Moscow',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject request without city', async () => {
      await expect(
        service.create(CLIENT_ID, {
          title: 'Valid title',
          description: 'I need help with my annual tax return filing process',
          city: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when max request limit reached', async () => {
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.request.count.mockResolvedValue(5); // DEFAULT_MAX_REQUESTS = 5

      await expect(
        service.create(CLIENT_ID, {
          title: 'Another request',
          description: 'I need help with my annual tax return filing process',
          city: 'Moscow',
        }),
      ).rejects.toThrow('Достигнут лимит заявок');
    });
  });

  // ─── Test 2: Request appears in "My Requests" list ────────────────
  describe('Test 2: Request appears in My Requests list', () => {
    it('should return requests for client', async () => {
      prisma.request.findMany.mockResolvedValue([
        {
          id: REQUEST_ID,
          clientId: CLIENT_ID,
          title: 'Tax consultation needed',
          status: RequestStatus.OPEN,
          _count: { responses: 0 },
          responses: [],
        },
      ]);

      const result = await service.findMy(CLIENT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(REQUEST_ID);
      expect(prisma.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: CLIENT_ID },
        }),
      );
    });
  });

  // ─── Test 3: Request appears in public feed ───────────────────────
  describe('Test 3: Request appears in public feed', () => {
    it('should show OPEN request in feed', async () => {
      prisma.request.findMany.mockResolvedValue([
        {
          id: REQUEST_ID,
          title: 'Tax consultation needed',
          city: 'Moscow',
          status: RequestStatus.OPEN,
          client: { id: CLIENT_ID },
          _count: { responses: 0 },
        },
      ]);
      prisma.request.count.mockResolvedValue(1);

      const result = await service.findFeed();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(REQUEST_ID);
    });

    it('should filter feed by city (case-insensitive)', async () => {
      prisma.request.findMany.mockResolvedValue([]);
      prisma.request.count.mockResolvedValue(0);

      await service.findFeed('moscow');

      expect(prisma.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: 'moscow', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  // ─── Test 4: Specialist can see request in feed ───────────────────
  describe('Test 4: Specialist can see request in feed', () => {
    it('should include request details visible to specialists', async () => {
      prisma.request.findMany.mockResolvedValue([
        {
          id: REQUEST_ID,
          title: 'Tax consultation needed',
          description: 'I need help with my annual tax return filing process',
          city: 'Moscow',
          category: 'Камеральная проверка',
          budget: 10000,
          status: RequestStatus.OPEN,
          createdAt: new Date(),
          client: { id: CLIENT_ID },
          _count: { responses: 0 },
        },
      ]);
      prisma.request.count.mockResolvedValue(1);

      const result = await service.findFeed();

      expect(result.items[0]).toHaveProperty('title');
      expect(result.items[0]).toHaveProperty('description');
      expect(result.items[0]).toHaveProperty('city');
      expect(result.items[0]).toHaveProperty('budget');
    });
  });

  // ─── Test 5: Specialist responds → status IN_PROGRESS ─────────────
  describe('Test 5: Specialist responds → request transitions to IN_PROGRESS', () => {
    const baseRequest = {
      id: REQUEST_ID,
      clientId: CLIENT_ID,
      status: RequestStatus.OPEN,
      city: 'Moscow',
      title: 'Tax consultation needed',
      client: { id: CLIENT_ID, email: 'client@test.com', notifyNewResponses: false },
    };

    beforeEach(() => {
      prisma.request.findUnique.mockResolvedValue(baseRequest);
      prisma.specialistProfile.findUnique.mockResolvedValue({ cities: ['Moscow'] });
      prisma.response.findUnique.mockResolvedValue(null);
      prisma.response.create.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        requestId: REQUEST_ID,
        comment: 'I can help with your taxes',
        price: 5000,
        status: ResponseStatus.sent,
      });
      prisma.request.update.mockResolvedValue({
        ...baseRequest,
        status: RequestStatus.IN_PROGRESS,
        lastActivityAt: new Date(),
      });
      prisma.thread.upsert.mockResolvedValue({ id: THREAD_ID });
      prisma.message.create.mockResolvedValue({ id: 'msg-1' });
    });

    it('should create response and transition request to IN_PROGRESS', async () => {
      const result = await service.respond(SPECIALIST_ID, REQUEST_ID, {
        comment: 'I can help with your taxes',
        price: 5000,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      });

      expect(result.response.id).toBe(RESPONSE_ID);
      // Verify request status was updated to IN_PROGRESS
      expect(prisma.request.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: REQUEST_ID },
          data: expect.objectContaining({
            status: RequestStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('should create a thread between specialist and client', async () => {
      await service.respond(SPECIALIST_ID, REQUEST_ID, {
        comment: 'I can help with your taxes',
        price: 5000,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      });

      expect(prisma.thread.upsert).toHaveBeenCalled();
    });

    it('should create first message in thread from specialist comment', async () => {
      await service.respond(SPECIALIST_ID, REQUEST_ID, {
        comment: 'I can help with your taxes',
        price: 5000,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      });

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          threadId: THREAD_ID,
          senderId: SPECIALIST_ID,
          content: 'I can help with your taxes',
        }),
      });
    });

    it('should reject response from specialist not covering the city', async () => {
      prisma.specialistProfile.findUnique.mockResolvedValue({ cities: ['Saint Petersburg'] });

      await expect(
        service.respond(SPECIALIST_ID, REQUEST_ID, {
          comment: 'I can help',
          price: 5000,
          deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate response', async () => {
      prisma.response.findUnique.mockResolvedValue({ id: 'existing-resp' });

      await expect(
        service.respond(SPECIALIST_ID, REQUEST_ID, {
          comment: 'I can help',
          price: 5000,
          deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject response with past deadline', async () => {
      await expect(
        service.respond(SPECIALIST_ID, REQUEST_ID, {
          comment: 'I can help',
          price: 5000,
          deadline: new Date(Date.now() - 86400000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject response on CLOSED request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        ...baseRequest,
        status: RequestStatus.CLOSED,
      });

      await expect(
        service.respond(SPECIALIST_ID, REQUEST_ID, {
          comment: 'I can help',
          price: 5000,
          deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Test 6: Client and specialist can exchange messages ──────────
  describe('Test 6: Client and specialist can exchange messages (via acceptResponse creating thread)', () => {
    it('should accept response and create/ensure thread for chat', async () => {
      prisma.response.findUnique.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        status: ResponseStatus.sent,
        request: { clientId: CLIENT_ID, title: 'Tax consultation needed' },
        specialist: { id: SPECIALIST_ID, email: 'spec@test.com', notifyNewResponses: false },
      });
      prisma.response.update.mockResolvedValue({
        id: RESPONSE_ID,
        status: ResponseStatus.accepted,
        acceptedAt: new Date(),
      });
      prisma.thread.upsert.mockResolvedValue({ id: THREAD_ID });

      const result = await service.acceptResponse(RESPONSE_ID, CLIENT_ID);

      expect(result.response.status).toBe(ResponseStatus.accepted);
      expect(result.thread.id).toBe(THREAD_ID);
      expect(prisma.thread.upsert).toHaveBeenCalled();
    });

    it('should reject accept from non-owner', async () => {
      prisma.response.findUnique.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        status: ResponseStatus.sent,
        request: { clientId: CLIENT_ID, title: 'Tax consultation' },
        specialist: { id: SPECIALIST_ID, email: 'spec@test.com', notifyNewResponses: false },
      });

      await expect(
        service.acceptResponse(RESPONSE_ID, 'other-client'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject accepting already accepted response', async () => {
      prisma.response.findUnique.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        status: ResponseStatus.accepted,
        request: { clientId: CLIENT_ID, title: 'Tax consultation' },
        specialist: { id: SPECIALIST_ID, email: 'spec@test.com', notifyNewResponses: false },
      });

      await expect(
        service.acceptResponse(RESPONSE_ID, CLIENT_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject accepting deactivated response', async () => {
      prisma.response.findUnique.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        status: ResponseStatus.deactivated,
        request: { clientId: CLIENT_ID, title: 'Tax consultation' },
        specialist: { id: SPECIALIST_ID, email: 'spec@test.com', notifyNewResponses: false },
      });

      await expect(
        service.acceptResponse(RESPONSE_ID, CLIENT_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── Test 7: Client closes request → status CLOSED ────────────────
  describe('Test 7: Client closes request → status CLOSED', () => {
    it('should close an IN_PROGRESS request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.IN_PROGRESS,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.CLOSED,
      });

      const result = await service.updateStatus(CLIENT_ID, REQUEST_ID, RequestStatus.CLOSED as any);

      expect(result.status).toBe(RequestStatus.CLOSED);
      expect(prisma.request.update).toHaveBeenCalledWith({
        where: { id: REQUEST_ID },
        data: { status: RequestStatus.CLOSED },
      });
    });

    it('should close an OPEN request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.OPEN,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.CLOSED,
      });

      const result = await service.updateStatus(CLIENT_ID, REQUEST_ID, RequestStatus.CLOSED as any);
      expect(result.status).toBe(RequestStatus.CLOSED);
    });

    it('should reject closing by non-owner', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.IN_PROGRESS,
      });

      await expect(
        service.updateStatus('other-client', REQUEST_ID, RequestStatus.CLOSED as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject re-closing already CLOSED request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });

      await expect(
        service.updateStatus(CLIENT_ID, REQUEST_ID, RequestStatus.CLOSED as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid status transition (CLOSED → OPEN)', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });

      await expect(
        service.updateStatus(CLIENT_ID, REQUEST_ID, RequestStatus.OPEN as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Test 8: Client leaves review after completion ────────────────
  describe('Test 8: Client can leave review after completion', () => {
    it('should create review for CLOSED request', async () => {
      prisma.specialistProfile.findUnique.mockResolvedValue({
        userId: SPECIALIST_ID,
        nick: SPECIALIST_NICK,
      });
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });
      prisma.response.findUnique.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        requestId: REQUEST_ID,
      });
      prisma.review.findUnique.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue({
        id: 'review-1',
        clientId: CLIENT_ID,
        specialistId: SPECIALIST_ID,
        requestId: REQUEST_ID,
        rating: 5,
        comment: 'Excellent service!',
      });

      const result = await service.createReviewForRequest(CLIENT_ID, REQUEST_ID, {
        specialistNick: SPECIALIST_NICK,
        rating: 5,
        comment: 'Excellent service!',
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Excellent service!');
    });

    it('should reject review on non-CLOSED request', async () => {
      prisma.specialistProfile.findUnique.mockResolvedValue({
        userId: SPECIALIST_ID,
        nick: SPECIALIST_NICK,
      });
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.IN_PROGRESS,
      });

      await expect(
        service.createReviewForRequest(CLIENT_ID, REQUEST_ID, {
          specialistNick: SPECIALIST_NICK,
          rating: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject review by non-owner', async () => {
      prisma.specialistProfile.findUnique.mockResolvedValue({
        userId: SPECIALIST_ID,
        nick: SPECIALIST_NICK,
      });
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });

      await expect(
        service.createReviewForRequest('other-client', REQUEST_ID, {
          specialistNick: SPECIALIST_NICK,
          rating: 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate review', async () => {
      prisma.specialistProfile.findUnique.mockResolvedValue({
        userId: SPECIALIST_ID,
        nick: SPECIALIST_NICK,
      });
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });
      prisma.response.findUnique.mockResolvedValue({
        id: RESPONSE_ID,
        specialistId: SPECIALIST_ID,
        requestId: REQUEST_ID,
      });
      prisma.review.findUnique.mockResolvedValue({ id: 'existing-review' });

      await expect(
        service.createReviewForRequest(CLIENT_ID, REQUEST_ID, {
          specialistNick: SPECIALIST_NICK,
          rating: 4,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject review for specialist who did not respond', async () => {
      prisma.specialistProfile.findUnique.mockResolvedValue({
        userId: SPECIALIST_ID,
        nick: SPECIALIST_NICK,
      });
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });
      prisma.response.findUnique.mockResolvedValue(null); // No response

      await expect(
        service.createReviewForRequest(CLIENT_ID, REQUEST_ID, {
          specialistNick: SPECIALIST_NICK,
          rating: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Test 9: Request edit works for OPEN requests ─────────────────
  describe('Test 9: Request edit works for OPEN requests', () => {
    it('should update fields on OPEN request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.OPEN,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        title: 'Updated title here',
        description: 'Updated description that is long enough',
        city: 'Saint Petersburg',
      });

      const result = await service.updateFields(CLIENT_ID, REQUEST_ID, {
        title: 'Updated title here',
        description: 'Updated description that is long enough',
        city: 'Saint Petersburg',
      });

      expect(result.title).toBe('Updated title here');
      expect(prisma.request.update).toHaveBeenCalledWith({
        where: { id: REQUEST_ID },
        data: expect.objectContaining({
          title: 'Updated title here',
          description: 'Updated description that is long enough',
          city: 'Saint Petersburg',
        }),
      });
    });

    it('should update fields on NEW request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.NEW,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        budget: 20000,
      });

      const result = await service.updateFields(CLIENT_ID, REQUEST_ID, {
        budget: 20000,
      });

      expect(result.budget).toBe(20000);
    });

    it('should reject edit on IN_PROGRESS request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.IN_PROGRESS,
      });

      await expect(
        service.updateFields(CLIENT_ID, REQUEST_ID, { title: 'New title for edit' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject edit on CLOSED request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
      });

      await expect(
        service.updateFields(CLIENT_ID, REQUEST_ID, { title: 'New title for edit' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject edit by non-owner', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.OPEN,
      });

      await expect(
        service.updateFields('other-client', REQUEST_ID, { title: 'Hacked title text' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject edit with empty data', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.OPEN,
      });

      await expect(
        service.updateFields(CLIENT_ID, REQUEST_ID, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Test 10: Request extend works for CLOSING_SOON ───────────────
  describe('Test 10: Request extend works for CLOSING_SOON requests', () => {
    it('should extend CLOSING_SOON request back to OPEN', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSING_SOON,
        extensionsCount: 0,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.OPEN,
        extensionsCount: 1,
        lastActivityAt: new Date(),
      });

      const result = await service.extend(CLIENT_ID, REQUEST_ID);

      expect(result.status).toBe(RequestStatus.OPEN);
      expect(result.extensionsCount).toBe(1);
      expect(prisma.request.update).toHaveBeenCalledWith({
        where: { id: REQUEST_ID },
        data: {
          lastActivityAt: expect.any(Date),
          extensionsCount: { increment: 1 },
          status: RequestStatus.OPEN,
        },
      });
    });

    it('should extend OPEN request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.OPEN,
        extensionsCount: 1,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.OPEN,
        extensionsCount: 2,
      });

      const result = await service.extend(CLIENT_ID, REQUEST_ID);
      expect(result.extensionsCount).toBe(2);
    });

    it('should extend IN_PROGRESS request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.IN_PROGRESS,
        extensionsCount: 0,
      });
      prisma.request.update.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.OPEN,
        extensionsCount: 1,
      });

      const result = await service.extend(CLIENT_ID, REQUEST_ID);
      expect(result.status).toBe(RequestStatus.OPEN);
    });

    it('should reject extend when max extensions (3) reached', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSING_SOON,
        extensionsCount: 3,
      });

      await expect(service.extend(CLIENT_ID, REQUEST_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject extend on CLOSED request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSED,
        extensionsCount: 0,
      });

      await expect(service.extend(CLIENT_ID, REQUEST_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject extend by non-owner', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.CLOSING_SOON,
        extensionsCount: 0,
      });

      await expect(service.extend('other-client', REQUEST_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject extend on non-existent request', async () => {
      prisma.request.findUnique.mockResolvedValue(null);

      await expect(service.extend(CLIENT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Bonus: Full status transition matrix ─────────────────────────
  describe('Status transition matrix validation', () => {
    const transitions = [
      { from: 'OPEN', to: 'IN_PROGRESS', valid: true },
      { from: 'OPEN', to: 'CLOSED', valid: true },
      { from: 'OPEN', to: 'CANCELLED', valid: true },
      { from: 'OPEN', to: 'CLOSING_SOON', valid: true },
      { from: 'IN_PROGRESS', to: 'CLOSED', valid: true },
      { from: 'IN_PROGRESS', to: 'CANCELLED', valid: true },
      { from: 'IN_PROGRESS', to: 'OPEN', valid: false },
      { from: 'CLOSING_SOON', to: 'OPEN', valid: true },
      { from: 'CLOSING_SOON', to: 'CLOSED', valid: true },
      { from: 'CLOSING_SOON', to: 'CANCELLED', valid: true },
      { from: 'CLOSED', to: 'OPEN', valid: false },
      { from: 'CLOSED', to: 'IN_PROGRESS', valid: false },
      { from: 'CANCELLED', to: 'OPEN', valid: false },
    ];

    for (const t of transitions) {
      it(`${t.from} → ${t.to} should ${t.valid ? 'succeed' : 'fail'}`, async () => {
        prisma.request.findUnique.mockResolvedValue({
          id: REQUEST_ID,
          clientId: CLIENT_ID,
          status: t.from,
        });

        if (t.valid) {
          prisma.request.update.mockResolvedValue({
            id: REQUEST_ID,
            status: t.to,
          });
          const result = await service.updateStatus(CLIENT_ID, REQUEST_ID, t.to as any);
          expect(result.status).toBe(t.to);
        } else {
          await expect(
            service.updateStatus(CLIENT_ID, REQUEST_ID, t.to as any),
          ).rejects.toThrow(BadRequestException);
        }
      });
    }
  });

  // ─── Bonus: Delete request ────────────────────────────────────────
  describe('Delete request (only OPEN/NEW)', () => {
    it('should delete an OPEN request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.OPEN,
      });
      prisma.review.deleteMany.mockResolvedValue({ count: 0 });
      prisma.response.deleteMany.mockResolvedValue({ count: 0 });
      prisma.request.delete.mockResolvedValue({ id: REQUEST_ID });

      const result = await service.deleteRequest(CLIENT_ID, REQUEST_ID);
      expect(result).toEqual({ deleted: true });
    });

    it('should reject delete on IN_PROGRESS request', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: REQUEST_ID,
        clientId: CLIENT_ID,
        status: RequestStatus.IN_PROGRESS,
      });

      await expect(
        service.deleteRequest(CLIENT_ID, REQUEST_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Bonus: findById visibility ───────────────────────────────────
  describe('findById — owner vs public visibility', () => {
    const fullRequest = {
      id: REQUEST_ID,
      clientId: CLIENT_ID,
      title: 'Tax consultation',
      description: 'Full description',
      status: RequestStatus.OPEN,
      _count: { responses: 1 },
      responses: [{ id: RESPONSE_ID }],
    };

    it('owner should see full data including responses', async () => {
      prisma.request.findUnique.mockResolvedValue(fullRequest);

      const result = await service.findById(REQUEST_ID, CLIENT_ID);

      expect(result).toHaveProperty('responses');
      expect(result).toHaveProperty('clientId');
    });

    it('non-owner should not see clientId or responses', async () => {
      prisma.request.findUnique.mockResolvedValue(fullRequest);

      const result = await service.findById(REQUEST_ID, 'other-user');

      expect(result).not.toHaveProperty('clientId');
      expect(result).not.toHaveProperty('responses');
    });

    it('anonymous user should not see clientId or responses', async () => {
      prisma.request.findUnique.mockResolvedValue(fullRequest);

      const result = await service.findById(REQUEST_ID, null);

      expect(result).not.toHaveProperty('clientId');
      expect(result).not.toHaveProperty('responses');
    });
  });
});
