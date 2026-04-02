import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Admin emails are comma-separated in ADMIN_EMAILS env var.
// Same pattern as PromotionsController — no ADMIN role in DB yet.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').filter(Boolean);

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /admin/stats — dashboard totals */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req: any) {
    this.assertAdmin(req.user.email);
    return this.adminService.getStats();
  }

  /** GET /admin/users — all users, optional ?role=CLIENT|SPECIALIST */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  getUsers(@Request() req: any, @Query('role') role?: string) {
    this.assertAdmin(req.user.email);
    return this.adminService.getUsers(role);
  }

  /** GET /admin/specialists — all specialist profiles */
  @Get('specialists')
  @UseGuards(JwtAuthGuard)
  getSpecialists(@Request() req: any) {
    this.assertAdmin(req.user.email);
    return this.adminService.getSpecialists();
  }

  /** GET /admin/requests — all platform requests */
  @Get('requests')
  @UseGuards(JwtAuthGuard)
  getAllRequests(@Request() req: any) {
    this.assertAdmin(req.user.email);
    return this.adminService.getAllRequests();
  }

  private assertAdmin(email: string) {
    if (!ADMIN_EMAILS.includes(email)) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
