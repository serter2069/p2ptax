import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PurchasePromotionDto } from './dto/purchase-promotion.dto';
import { UpdatePricesDto } from './dto/update-prices.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminList() {
    return this.promotionsService.adminList();
  }

  /** Public: get current prices (no auth required) */
  @Get('prices')
  async getPublicPrices(@Query('city') city?: string) {
    return this.promotionsService.getPrices(city);
  }

  /** Admin: get current prices */
  @Get('admin/prices')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getPrices(@Query('city') city?: string) {
    return this.promotionsService.getPrices(city);
  }

  /** Admin: update price for city+tier */
  @Patch('admin/prices')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updatePrices(@Body() dto: UpdatePricesDto) {
    return this.promotionsService.updatePrices(dto);
  }
}
