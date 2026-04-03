import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

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

  // GET /requests — authenticated feed (specialists browse)
  @Get()
  @UseGuards(JwtAuthGuard)
  getFeed(
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('category') category?: string,
    @Query('maxBudget') maxBudget?: string,
  ) {
    return this.requestsService.findFeed(
      city,
      page ? parseInt(page, 10) : 1,
      category,
      maxBudget ? parseInt(maxBudget, 10) : undefined,
    );
  }

  // GET /requests/:id — client gets single request with responses
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.findById(id, req.user.id);
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

  // PATCH /requests/:id — client updates request (status or fields)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    // If body contains status field, use status-update logic
    if (dto.status) {
      return this.requestsService.updateStatus(req.user.id, id, dto.status);
    }
    // Otherwise update fields (description, city, budget, category)
    return this.requestsService.updateFields(req.user.id, id, dto);
  }
}
