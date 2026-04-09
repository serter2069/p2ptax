import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { SpecialistsService } from './specialists.service';
import { RequestsService } from '../requests/requests.service';

/**
 * Specialist portal routes: /api/specialist/*
 * These provide the specialist-facing API (UC-022, UC-030).
 */
@Controller('specialist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SPECIALIST)
export class SpecialistPortalController {
  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly requestsService: RequestsService,
  ) {}

  /** GET /specialist/profile — current specialist's profile */
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.specialistsService.getMyProfile(req.user.id);
  }

  /** GET /specialist/responses — specialist's responses with request info */
  @Get('responses')
  getResponses(@Request() req: any) {
    return this.requestsService.findMyResponses(req.user.id);
  }

  /** GET /specialist/feed — open requests in specialist's cities */
  @Get('feed')
  async getFeed(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('category') category?: string,
    @Query('maxBudget') maxBudget?: string,
  ) {
    // Get specialist's cities from profile
    const profile = await this.specialistsService.getMyProfile(req.user.id);
    const primaryCity = profile.cities?.[0];

    return this.requestsService.findFeed(
      primaryCity,
      page ? parseInt(page, 10) : 1,
      category,
      maxBudget ? parseInt(maxBudget, 10) : undefined,
    );
  }
}
