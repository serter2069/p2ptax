import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /admin/stats — dashboard totals */
  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getStats() {
    return this.adminService.getStats();
  }

  /** GET /admin/users — all users, optional ?role=CLIENT|SPECIALIST */
  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getUsers(@Query('role') role?: string) {
    return this.adminService.getUsers(role);
  }

  /** GET /admin/specialists — all specialist profiles */
  @Get('specialists')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSpecialists() {
    return this.adminService.getSpecialists();
  }

  /** GET /admin/requests — all platform requests */
  @Get('requests')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAllRequests() {
    return this.adminService.getAllRequests();
  }
}
