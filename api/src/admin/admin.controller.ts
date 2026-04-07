import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUpdateSpecialistDto } from './dto/update-specialist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('specialists/:id')
  updateSpecialist(@Param('id') id: string, @Body() dto: AdminUpdateSpecialistDto) {
    return this.adminService.updateSpecialist(id, dto);
  }
}
