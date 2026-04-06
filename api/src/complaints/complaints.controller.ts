import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  /** POST /complaints — submit a complaint (any authenticated user) */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(req.user.id, dto);
  }

  /** GET /complaints/admin?page=N — list all complaints (admin only) */
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminFindAll(@Query('page') page?: string) {
    return this.complaintsService.adminFindAll(page ? parseInt(page, 10) : 1);
  }
}
