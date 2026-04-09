import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
  });

  describe('GET /api/health', () => {
    it('should return status ok with timestamp', () => {
      const result = appController.health();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should not require authentication', () => {
      // The health endpoint should be callable without any auth setup
      const result = appController.health();
      expect(result).toBeDefined();
    });
  });
});
