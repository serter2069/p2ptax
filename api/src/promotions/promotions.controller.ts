import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PurchasePromotionDto } from './dto/purchase-promotion.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

// Admin emails — no ADMIN role in DB yet, so we check email directly.
// TODO: add ADMIN role to Prisma enum when admin panel is built
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').filter(Boolean);

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** Specialist purchases a promotion */
  @Post('purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  async purchase(@Request() req: any, @Body() dto: PurchasePromotionDto) {
    return this.promotionsService.purchase(req.user.id, dto);
  }

  /** Get my promotions (any authenticated user, but mostly specialists) */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPromotions(@Request() req: any) {
    return this.promotionsService.getMyPromotions(req.user.id);
  }

  /** Admin: list all promotions */
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async adminList(@Request() req: any) {
    this.assertAdmin(req.user.email);
    return this.promotionsService.adminList();
  }

  /** Public: get current prices (no auth required) */
  @Get('prices')
  async getPublicPrices(@Query('city') city?: string) {
    return this.promotionsService.getPrices(city);
  }

  /** Admin: get current prices */
  @Get('admin/prices')
  @UseGuards(JwtAuthGuard)
  async getPrices(@Request() req: any, @Query('city') city?: string) {
    this.assertAdmin(req.user.email);
    return this.promotionsService.getPrices(city);
  }

  /** Admin: update price for city+tier */
  @Patch('admin/prices')
  @UseGuards(JwtAuthGuard)
  async updatePrices(@Request() req: any, @Body() dto: UpdatePricesDto) {
    this.assertAdmin(req.user.email);
    return this.promotionsService.updatePrices(dto);
  }

  private assertAdmin(email: string) {
    if (!ADMIN_EMAILS.includes(email)) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
