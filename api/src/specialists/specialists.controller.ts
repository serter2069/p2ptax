import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

  @Get()
  getCatalog(
    @Query('city') city?: string,
    @Query('badge') badge?: string,
    @Query('sort') sort?: string,
    @Query('services') services?: string,
  ) {
    return this.specialistsService.getCatalog(city, badge, sort, services);
  }

  @Get(':nick')
  getProfile(@Param('nick') nick: string) {
    return this.specialistsService.getProfile(nick);
  }
}
