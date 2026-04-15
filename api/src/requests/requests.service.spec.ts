import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { InAppNotificationService } from '../notifications/in-app-notification.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Minimal enums to avoid needing full Prisma client generation
const RequestStatus = {
  NEW: 'NEW',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSING_SOON: 'CLOSING_SOON',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

describe('RequestsService — lifecycle features', () => {
  let service: RequestsService;
  let prisma: any;
  let emailService: any;
  let inAppNotifService: any;

  beforeEach(async () => {
    prisma = {
      request: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      response: {
        create: jest.fn(),
        findUnique: jest.fn(),
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
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    emailService = {
      notifyNewResponse: jest.fn(),
      notifyNewRequestInCity: jest.fn(),
      notifyRequestClosingSoon: jest.fn(),
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

  describe('extend()', () => {
    it('should reset lastActivityAt and increment extensionsCount', async () => {
      const request = {
        id: 'req-1',
        clientId: 'client-1',
        status: RequestStatus.OPEN,
        extensionsCount: 0,
        lastActivityAt: new Date('2026-03-01'),
      };
      prisma.request.findUnique.mockResolvedValue(request);
      prisma.request.update.mockResolvedValue({
        ...request,
        extensionsCount: 1,
        lastActivityAt: new Date(),
        status: RequestStatus.OPEN,
      });

      const result = await service.extend('client-1', 'req-1');

      expect(prisma.request.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: {
          lastActivityAt: expect.any(Date),
          extensionsCount: { increment: 1 },
          status: RequestStatus.OPEN,
        },
      });
      expect(result.extensionsCount).toBe(1);
    });

    it('should extend a CLOSING_SOON request back to OPEN', async () => {
      const request = {
        id: 'req-2',
        clientId: 'client-1',
        status: RequestStatus.CLOSING_SOON,
        extensionsCount: 1,
        lastActivityAt: new Date('2026-03-01'),
      };
      prisma.request.findUnique.mockResolvedValue(request);
      prisma.request.update.mockResolvedValue({
        ...request,
        extensionsCount: 2,
        status: RequestStatus.OPEN,
      });

      const result = await service.extend('client-1', 'req-2');

      expect(prisma.request.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RequestStatus.OPEN }),
        }),
      );
      expect(result.status).toBe(RequestStatus.OPEN);
    });

    it('should throw 400 when max extensions (3) reached', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: 'req-3',
        clientId: 'client-1',
        status: RequestStatus.OPEN,
        extensionsCount: 3,
      });

      await expect(service.extend('client-1', 'req-3')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw 404 when request not found', async () => {
      prisma.request.findUnique.mockResolvedValue(null);

      await expect(service.extend('client-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when not the owner', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: 'req-4',
        clientId: 'other-client',
        status: RequestStatus.OPEN,
        extensionsCount: 0,
      });

      await expect(service.extend('client-1', 'req-4')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw 400 when request is CLOSED', async () => {
      prisma.request.findUnique.mockResolvedValue({
        id: 'req-5',
        clientId: 'client-1',
        status: RequestStatus.CLOSED,
        extensionsCount: 0,
      });

      await expect(service.extend('client-1', 'req-5')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markClosingSoon()', () => {
    it('should mark stale OPEN requests as CLOSING_SOON and send emails', async () => {
      const staleRequests = [
        {
          id: 'req-stale-1',
          status: RequestStatus.OPEN,
          lastActivityAt: new Date('2026-03-10'),
          client: { id: 'client-1', email: 'client1@test.com' },
        },
        {
          id: 'req-stale-2',
          status: RequestStatus.OPEN,
          lastActivityAt: new Date('2026-03-12'),
          client: { id: 'client-2', email: 'client2@test.com' },
        },
      ];

      prisma.request.findMany.mockResolvedValue(staleRequests);
      prisma.request.updateMany.mockResolvedValue({ count: 2 });

      await service.markClosingSoon();

      expect(prisma.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS] },
            lastActivityAt: { lt: expect.any(Date) },
          }),
        }),
      );

      expect(prisma.request.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['req-stale-1', 'req-stale-2'] } },
        data: { status: RequestStatus.CLOSING_SOON },
      });

      expect(emailService.notifyRequestClosingSoon).toHaveBeenCalledTimes(2);
      expect(emailService.notifyRequestClosingSoon).toHaveBeenCalledWith(
        'client1@test.com',
        'req-stale-1',
        'client-1',
      );
      expect(emailService.notifyRequestClosingSoon).toHaveBeenCalledWith(
        'client2@test.com',
        'req-stale-2',
        'client-2',
      );
    });

    it('should do nothing when no stale requests exist', async () => {
      prisma.request.findMany.mockResolvedValue([]);

      await service.markClosingSoon();

      expect(prisma.request.updateMany).not.toHaveBeenCalled();
      expect(emailService.notifyRequestClosingSoon).not.toHaveBeenCalled();
    });
  });

  describe('autoCloseStale()', () => {
    it('should close requests with no activity for 30+ days', async () => {
      prisma.request.updateMany.mockResolvedValue({ count: 3 });

      await service.autoCloseStale();

      expect(prisma.request.updateMany).toHaveBeenCalledWith({
        where: {
          status: { in: [RequestStatus.NEW, RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSING_SOON] },
          lastActivityAt: { lt: expect.any(Date) },
        },
        data: { status: RequestStatus.CLOSED },
      });

      // Verify the cutoff date is approximately 30 days ago
      const call = prisma.request.updateMany.mock.calls[0][0];
      const cutoff = call.where.lastActivityAt.lt;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const diff = Math.abs(Date.now() - thirtyDaysMs - cutoff.getTime());
      expect(diff).toBeLessThan(5000); // within 5 seconds
    });
  });

  describe('respond()', () => {
    const baseRequest = {
      id: 'req-resp-1',
      clientId: 'client-1',
      status: RequestStatus.OPEN,
      city: 'Moscow',
      title: 'Tax help',
      client: { id: 'client-1', email: 'c@test.com', notifyNewResponses: false },
    };

    beforeEach(() => {
      prisma.request.findUnique.mockResolvedValue(baseRequest);
      prisma.specialistProfile.findUnique.mockResolvedValue({ cities: ['Moscow'] });
      prisma.response.findUnique.mockResolvedValue(null);
      prisma.response.create.mockResolvedValue({ id: 'resp-1' });
      prisma.request.update.mockResolvedValue({ ...baseRequest, lastActivityAt: new Date() });
      prisma.thread.upsert.mockResolvedValue({ id: 'thread-1' });
      prisma.message.create.mockResolvedValue({ id: 'msg-1' });
    });

    it('should update lastActivityAt and transition to IN_PROGRESS when a new response is created', async () => {
      await service.respond('specialist-1', 'req-resp-1', {
        comment: 'I can help',
        price: 5000,
        deadline: new Date(Date.now() + 86400000).toISOString() as any,
      });

      expect(prisma.request.update).toHaveBeenCalledWith({
        where: { id: 'req-resp-1' },
        data: expect.objectContaining({
          lastActivityAt: expect.any(Date),
          status: RequestStatus.IN_PROGRESS,
        }),
      });
    });

    it('should create thread and first message in chat-first flow', async () => {
      const result = await service.respond('specialist-1', 'req-resp-1', {
        comment: 'I can help',
        price: 5000,
        deadline: new Date(Date.now() + 86400000).toISOString() as any,
      });

      expect(prisma.thread.upsert).toHaveBeenCalled();
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          threadId: 'thread-1',
          senderId: 'specialist-1',
          content: 'I can help',
        }),
      });
      expect(result.response).toBeDefined();
      expect(result.thread).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

});
