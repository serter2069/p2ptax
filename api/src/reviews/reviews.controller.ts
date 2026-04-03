import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyReviews(@Request() req: any) {
    return this.reviewsService.listByClient(req.user.id);
  }

  /** GET /reviews/admin?page=N — all reviews (admin only) */
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminFindAll(@Query('page') page?: string) {
    return this.reviewsService.adminFindAll(page ? parseInt(page, 10) : 1);
  }

  /** DELETE /reviews/admin/:id — delete review (admin only) */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminDelete(@Param('id') id: string) {
    return this.reviewsService.adminDelete(id);
  }

  @Get('specialist/:nick')
  listBySpecialist(
    @Param('nick') nick: string,
    @Query('page') page?: string,
  ) {
    return this.reviewsService.listBySpecialist(nick, page ? parseInt(page, 10) : 1);
  }

  @Get('eligibility/:nick')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  checkEligibility(@Request() req: any, @Param('nick') nick: string) {
    return this.reviewsService.checkEligibility(req.user.id, nick);
  }
}
