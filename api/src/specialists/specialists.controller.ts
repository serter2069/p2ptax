import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  createProfile(@Request() req: any, @Body() dto: CreateSpecialistProfileDto) {
    return this.specialistsService.createProfile(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  getMyProfile(@Request() req: any) {
    return this.specialistsService.getMyProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  updateProfile(@Request() req: any, @Body() dto: UpdateSpecialistProfileDto) {
    return this.specialistsService.updateProfile(req.user.id, dto);
  }

  @Get('cities')
  getAvailableCities() {
    return this.specialistsService.getAvailableCities();
  }

  @Get()
  getCatalog(
    @Query('city') city?: string,
    @Query('badge') badge?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('fns') fns?: string,
    @Query('category') category?: string,
  ) {
    return this.specialistsService.getCatalog(city, badge, sort, search, fns, category);
  }

  @Patch(':id/badges')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateBadges(@Param('id') id: string, @Body('badges') badges: string[]) {
    return this.specialistsService.adminUpdateBadges(id, badges);
  }

  @Get(':nick')
  getProfile(@Param('nick') nick: string) {
    return this.specialistsService.getProfile(nick);
  }
}
