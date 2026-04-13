import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  getStats(@Request() req: any) {
    return this.requestsService.getDashboardStats(req.user.id);
  }
}
