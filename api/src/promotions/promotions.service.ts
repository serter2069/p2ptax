import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasePromotionDto } from './dto/purchase-promotion.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { PromotionTier } from '@prisma/client';

// Default prices (rubles). Admin can override per city via updatePrices.
// TODO: persist prices in DB (add PromotionPrice model) when admin pricing is needed
const DEFAULT_PRICES: Record<PromotionTier, number> = {
  BASIC: 500,
  FEATURED: 1500,
  TOP: 3000,
};

// In-memory price overrides (city:tier -> price). Resets on restart.
// TODO: replace with DB table when persistence is needed
const priceOverrides = new Map<string, number>();

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

    const price = this.getPrice(dto.city, dto.tier);

    // TODO: Integrate Stripe when STRIPE_SECRET_KEY is added to Doppler
    // For now, mock payment: log and proceed
    this.logger.log(
      `MOCK PAYMENT: user=${userId} city=${dto.city} tier=${dto.tier} amount=${price} RUB`,
    );

    // Create promotion: 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

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

  /** Admin: update price for city+tier combination */
  updatePrices(dto: UpdatePricesDto) {
    const key = `${dto.city}:${dto.tier}`;
    priceOverrides.set(key, dto.price);
    this.logger.log(`Price updated: ${key} = ${dto.price} RUB`);
    return {
      city: dto.city,
      tier: dto.tier,
      price: dto.price,
      note: 'Price stored in memory. Will reset on server restart. TODO: persist to DB.',
    };
  }

  /** Admin: get current prices for all tiers, optionally filtered by city */
  getPrices(city?: string) {
    const tiers = Object.values(PromotionTier);
    const result: Array<{ city: string; tier: PromotionTier; price: number }> = [];

    if (city) {
      for (const tier of tiers) {
        result.push({ city, tier, price: this.getPrice(city, tier) });
      }
    } else {
      // Return defaults + all overrides
      for (const tier of tiers) {
        result.push({ city: 'default', tier, price: DEFAULT_PRICES[tier] });
      }
      for (const [key, price] of priceOverrides.entries()) {
        const [c, t] = key.split(':');
        result.push({ city: c, tier: t as PromotionTier, price });
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

  private getPrice(city: string, tier: PromotionTier): number {
    const key = `${city}:${tier}`;
    return priceOverrides.get(key) ?? DEFAULT_PRICES[tier];
  }
}
