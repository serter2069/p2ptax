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

  // GET /requests — public feed (specialists browse)
  @Get()
  getFeed(@Query('city') city?: string, @Query('page') page?: string) {
    return this.requestsService.findFeed(city, page ? parseInt(page, 10) : 1);
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

  // PATCH /requests/:id — client updates request status
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.updateStatus(req.user.id, id, dto.status);
  }
}
