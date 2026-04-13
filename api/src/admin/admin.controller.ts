import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { BlockUserDto } from './dto/block-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /admin/stats — dashboard totals */
  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getStats() {
    return this.adminService.getStats();
  }

  /** GET /admin/users — all users, optional ?role=CLIENT|SPECIALIST&page=1&limit=50 */
  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getUsers(
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(role, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  /** PATCH /admin/users/:id — block or unblock a user */
  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  blockUser(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.adminService.blockUser(id, dto.isBlocked);
  }

  /** GET /admin/specialists — all specialist profiles, optional ?page=1&limit=50 */
  @Get('specialists')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSpecialists(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getSpecialists(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  /** PATCH /admin/specialists/:id/badges — update specialist badges */
  @Patch('specialists/:id/badges')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSpecialistBadges(
    @Param('id') id: string,
    @Body('badges') badges: string[],
  ) {
    return this.adminService.updateSpecialistBadges(id, badges);
  }

  /** GET /admin/requests — all platform requests, optional ?page=1&limit=50 */
  @Get('requests')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAllRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllRequests(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  /** GET /admin/promotions — all promotions with user info, optional ?page=1&limit=50 */
  @Get('promotions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getPromotions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPromotions(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  /** GET /admin/reviews — all reviews, optional ?page=1&limit=20 */
  @Get('reviews')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReviews(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  /** GET /admin/reviews/:id — single review */
  @Get('reviews/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getReview(@Param('id') id: string) {
    return this.adminService.getReview(id);
  }

  /** DELETE /admin/reviews/:id — delete review (UC-071) */
  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  /** GET /admin/settings — returns all settings */
  @Get('settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSettings() {
    return this.adminService.getSettings();
  }

  /** PATCH /admin/settings — updates settings (admin only) */
  @Patch('settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.adminService.updateSettings(dto.settings);
  }
}
