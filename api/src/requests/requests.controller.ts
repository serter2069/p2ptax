import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateQuickRequestDto } from './dto/create-quick-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { PatchRequestDto } from './dto/patch-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // POST /requests/quick — anonymous quick request from landing page
  @Post('quick')
  createQuick(@Body() dto: CreateQuickRequestDto) {
    return this.requestsService.createQuick(dto);
  }

  // POST /requests — client creates a request
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  create(@Request() req: any, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user.id, dto);
  }

  // GET /requests/my — current user's requests (MUST be before :id route)
  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req: any) {
    return this.requestsService.findMy(req.user.id);
  }

  // GET /requests/my-responses — specialist's own responses with request info
  @Get('my-responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  getMyResponses(@Request() req: any) {
    return this.requestsService.findMyResponses(req.user.id);
  }

  // GET /requests/recent — public, recent open requests for landing page
  @Get('recent')
  getRecent(@Query('limit') limit?: string) {
    return this.requestsService.findRecent(parseInt(limit ?? '5') || 5);
  }

  // GET /requests/public — explicit public alias for the feed
  @Get('public')
  getPublicFeed(
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('category') category?: string,
    @Query('service') service?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('ifnsId') ifnsId?: string,
  ) {
    // 'service' is an alias for 'category' (both accepted)
    const effectiveCategory = category || service;
    return this.requestsService.findFeed(
      city,
      page ? parseInt(page, 10) : 1,
      effectiveCategory,
      maxBudget ? parseInt(maxBudget, 10) : undefined,
      ifnsId,
    );
  }

  // GET /requests — requires authentication (#313: was public, exposed personal data)
  @Get()
  @UseGuards(JwtAuthGuard)
  getFeed(
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('category') category?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('ifnsId') ifnsId?: string,
  ) {
    return this.requestsService.findFeed(
      city,
      page ? parseInt(page, 10) : 1,
      category,
      maxBudget ? parseInt(maxBudget, 10) : undefined,
      ifnsId,
    );
  }

  // GET /requests/:id/responses — owner gets list of responses
  @Get(':id/responses')
  @UseGuards(JwtAuthGuard)
  getResponses(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.findResponses(id, req.user.id);
  }

  // GET /requests/:id — public, owner gets full data including responses
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.findById(id, req.user?.id ?? null);
  }

  // POST /requests/:id/respond — specialist responds to a request
  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  respond(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RespondRequestDto,
  ) {
    return this.requestsService.respond(req.user.id, id, dto);
  }

  // POST /requests/:id/reviews — create review for specialist on this request
  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  createReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { specialistNick: string; rating: number; comment?: string },
  ) {
    return this.requestsService.createReviewForRequest(req.user.id, id, body);
  }

  // DELETE /requests/:id — client deletes own request (only OPEN status)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  delete(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.deleteRequest(req.user.id, id);
  }

  // PATCH /requests/:id — client updates request (status or fields)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: PatchRequestDto,
  ) {
    // If body contains status field, use status-update logic
    if (dto.status) {
      return this.requestsService.updateStatus(req.user.id, id, dto.status);
    }
    // Otherwise update fields (description, city, budget, category)
    return this.requestsService.updateFields(req.user.id, id, dto);
  }
}
