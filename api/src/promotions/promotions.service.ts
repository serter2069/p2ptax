import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { PurchasePromotionDto } from './dto/purchase-promotion.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { PromotionTier } from '@prisma/client';

// Hardcoded fallback prices (rubles) used when no DB override exists.
const DEFAULT_PRICES: Record<PromotionTier, number> = {
  BASIC: 500,
  FEATURED: 1500,
  TOP: 3000,
};

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Purchase a promotion for the authenticated specialist.
   * Currently uses mock payment (no Stripe key configured).
   */
  async purchase(userId: string, dto: PurchasePromotionDto) {
    // Idempotency: if the client sent a key and a promotion with that key already exists, return it
    if (dto.idempotencyKey) {
      const idempotent = await this.prisma.promotion.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (idempotent) {
        return {
          promotion: idempotent,
          payment: {
            status: 'mock_paid',
            amount: 0,
            currency: 'RUB',
            note: 'Duplicate request — returning existing promotion.',
          },
        };
      }
    }

    // Wrap the entire purchase in a transaction to prevent TOCTOU race conditions
    return this.prisma.$transaction(async (tx) => {
      // Verify user has a specialist profile
      const profile = await tx.specialistProfile.findUnique({
        where: { userId },
      });
      if (!profile) {
        throw new NotFoundException('Specialist profile not found. Create a profile first.');
      }

      // Check specialist operates in the requested city
      if (!profile.cities.includes(dto.city)) {
        throw new BadRequestException(
          `You don't have city "${dto.city}" in your profile. Add it first.`,
        );
      }

      // Check for existing active promotion in same city+tier
      const existing = await tx.promotion.findFirst({
        where: {
          specialistId: userId,
          city: dto.city,
          tier: dto.tier,
          expiresAt: { gt: new Date() },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `You already have an active ${dto.tier} promotion in ${dto.city} until ${existing.expiresAt.toISOString()}`,
        );
      }

      const months = dto.periodMonths ?? 1;
      const basePrice = await this.getPrice(dto.city, dto.tier);

      // Apply multi-month discount: 3 months = -10%, 6 months = -20%
      const DISCOUNT: Record<number, number> = { 1: 0, 3: 0.1, 6: 0.2 };
      const discount = DISCOUNT[months] ?? 0;
      const price = Math.round(basePrice * months * (1 - discount));

      // TODO: Integrate Stripe when STRIPE_SECRET_KEY is added to Doppler
      // For now, mock payment: log and proceed
      this.logger.log(
        `MOCK PAYMENT: user=${userId} city=${dto.city} tier=${dto.tier} months=${months} amount=${price} RUB`,
      );

      // Set expiry based on requested period (calendar months from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);

      const promotion = await tx.promotion.create({
        data: {
          specialistId: userId,
          city: dto.city,
          tier: dto.tier,
          expiresAt,
          ...(dto.idempotencyKey ? { idempotencyKey: dto.idempotencyKey } : {}),
        },
      });

      return {
        promotion,
        payment: {
          status: 'mock_paid',
          amount: price,
          currency: 'RUB',
          note: 'Stripe integration pending. Payment simulated.',
        },
      };
    }, { timeout: 10000 });
  }

  /** Get promotions for the authenticated user */
  async getMyPromotions(userId: string) {
    return this.prisma.promotion.findMany({
      where: { specialistId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: list all promotions with specialist info */
  async adminList() {
    return this.prisma.promotion.findMany({
      include: {
        specialist: {
          select: { id: true, email: true, specialistProfile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: persist price for city+tier to DB.
   * city=undefined/null means "global default for all cities".
   */
  async updatePrices(dto: UpdatePricesDto) {
    const cityValue = dto.city ?? null;
    // Use upsert with compound unique key.
    // Prisma's generated type for the compound unique input requires `city: string`, but the
    // column is nullable and Prisma handles null at runtime. Cast through `as string` instead
    // of the previous `as any` to preserve type-safety while still satisfying the TS signature.
    await this.prisma.promotionPrice.upsert({
      where: { city_tier: { city: cityValue as string, tier: dto.tier } },
      update: { price: dto.price },
      create: { city: cityValue, tier: dto.tier, price: dto.price },
    });
    this.logger.log(`Price persisted: city=${cityValue} tier=${dto.tier} price=${dto.price} RUB`);
    return {
      city: cityValue,
      tier: dto.tier,
      price: dto.price,
    };
  }

  /** Admin: get current prices for all tiers, optionally filtered by city */
  async getPrices(city?: string) {
    const tiers = Object.values(PromotionTier);
    const result: Array<{ city: string | null; tier: PromotionTier; price: number }> = [];

    if (city) {
      for (const tier of tiers) {
        result.push({ city, tier, price: await this.getPrice(city, tier) });
      }
    } else {
      // Return effective defaults + all DB overrides
      for (const tier of tiers) {
        result.push({ city: null, tier, price: await this.getPrice(null, tier) });
      }
      // Fetch all city-specific overrides
      const cityOverrides = await this.prisma.promotionPrice.findMany({
        where: { city: { not: null } },
        orderBy: [{ city: 'asc' }, { tier: 'asc' }],
      });
      for (const row of cityOverrides) {
        result.push({ city: row.city, tier: row.tier, price: row.price });
      }
    }

    return result;
  }

  /**
   * Hourly cron: send reminder emails for promotions expiring within 3 days,
   * then delete promotions that have already expired.
   * Emails are sent BEFORE deletion so data is still available.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpired() {
    const now = new Date();

    // Step 1: Send reminder emails for promotions expiring within 3 days (but not yet expired)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringSoon = await this.prisma.promotion.findMany({
      where: {
        expiresAt: { gt: now, lte: threeDaysFromNow },
        reminderSent: false,
      },
      include: {
        specialist: { select: { email: true } },
      },
    });

    for (const promo of expiringSoon) {
      if (promo.specialist.email) {
        await this.emailService.notifyPromotionExpiringSoon(
          promo.specialist.email,
          promo.city,
        ).catch((err) =>
          this.logger.error(`Failed to send expiry reminder for promotion ${promo.id}`, err),
        );
        await this.prisma.promotion.update({
          where: { id: promo.id },
          data: { reminderSent: true },
        }).catch(() => {});
      }
    }

    if (expiringSoon.length > 0) {
      this.logger.log(`Sent ${expiringSoon.length} promotion expiry reminder(s)`);
    }

    // Step 2: Delete promotions that have already expired
    const { count } = await this.prisma.promotion.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    if (count > 0) {
      this.logger.log(`Deactivated ${count} expired promotion(s)`);
    }
  }

  /**
   * Resolve the effective price for a city+tier.
   * Priority: city-specific DB row > global default DB row > hardcoded fallback.
   */
  private async getPrice(city: string | null, tier: PromotionTier): Promise<number> {
    if (city) {
      // Try city-specific override first
      const cityRow = await this.prisma.promotionPrice.findFirst({
        where: { city, tier },
      });
      if (cityRow) return cityRow.price;
    }
    // Fall back to global default in DB (city IS NULL)
    const defaultRow = await this.prisma.promotionPrice.findFirst({
      where: { city: null, tier },
    });
    return defaultRow?.price ?? DEFAULT_PRICES[tier];
  }
}
