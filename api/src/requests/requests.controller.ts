import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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

const REQUEST_DOC_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const MAX_REQUEST_DOCUMENTS = 5;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

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
    @Query('serviceType') serviceType?: string,
  ) {
    // 'service' is an alias for 'category' (both accepted)
    const effectiveCategory = category || service;
    return this.requestsService.findFeed(
      city,
      page ? parseInt(page, 10) : 1,
      effectiveCategory,
      maxBudget ? parseInt(maxBudget, 10) : undefined,
      ifnsId,
      serviceType,
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

  // GET /requests/:id/public — dedicated public endpoint, never exposes client identity
  @Get(':id/public')
  getPublicById(@Param('id') id: string) {
    return this.requestsService.findPublicById(id);
  }

  // GET /requests/:id/responses — owner gets list of responses
  @Get(':id/responses')
  @UseGuards(JwtAuthGuard)
  getResponses(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.findResponses(id, req.user.id);
  }

  // POST /requests/:id/documents — upload documents to a request
  @Post(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: MAX_DOCUMENT_SIZE, files: MAX_REQUEST_DOCUMENTS },
    }),
  )
  async uploadDocuments(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate MIME types
    for (const file of files) {
      if (!REQUEST_DOC_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(
          `File type not allowed: ${file.mimetype}. Allowed: PDF, JPG, PNG`,
        );
      }
    }

    return this.requestsService.uploadDocuments(req.user.id, id, files);
  }

  // GET /requests/:id — owner gets full data including responses
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

  // PATCH /requests/:id/status — client changes request status (validate transitions)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.requestsService.updateStatus(req.user.id, id, status as any);
  }

  // POST /requests/:id/extend — client extends a request (resets lastActivityAt, max 3)
  @Post(':id/extend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  extend(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.extend(req.user.id, id);
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

  // PUT /responses/:id/accept — client accepts a response
  @Put('responses/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  acceptResponse(@Request() req: any, @Param('id') id: string) {
    return this.requestsService.acceptResponse(id, req.user.id);
  }

  // PATCH /responses/:id — specialist deactivates own response
  @Patch('responses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  patchResponse(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.requestsService.patchResponse(id, req.user.id, body.status);
  }
}
