import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
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

  constructor(private prisma: PrismaService) {}

  /**
   * Purchase a promotion for the authenticated specialist.
   * Currently uses mock payment (no Stripe key configured).
   */
  async purchase(userId: string, dto: PurchasePromotionDto) {
    // Verify user has a specialist profile
    const profile = await this.prisma.specialistProfile.findUnique({
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
    const existing = await this.prisma.promotion.findFirst({
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

    const promotion = await this.prisma.promotion.create({
      data: {
        specialistId: userId,
        city: dto.city,
        tier: dto.tier,
        expiresAt,
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
    // Use upsert with compound unique key. Prisma accepts null for nullable fields at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.prisma.promotionPrice.upsert({
      where: { city_tier: { city: cityValue as any, tier: dto.tier } },
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

  /** Hourly cron: deactivate expired promotions by deleting them */
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpired() {
    const { count } = await this.prisma.promotion.deleteMany({
      where: { expiresAt: { lte: new Date() } },
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
