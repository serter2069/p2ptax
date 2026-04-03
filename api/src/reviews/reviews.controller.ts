import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
