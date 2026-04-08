import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads', 'avatars');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Controller('specialists')
export class SpecialistsController {
  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly storageService: StorageService,
  ) {}

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

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  @UseInterceptors(
    FileInterceptor('file', {
      // Use memory storage so the buffer is available directly in the handler.
      // For S3 uploads this avoids writing to disk and re-reading it back.
      // For local disk fallback the handler writes the buffer once itself.
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed') as any, false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const ext = extname(file.originalname) || '.jpg';
    let avatarUrl: string;

    if (this.storageService.isS3Enabled) {
      // Buffer is already in memory — upload directly to S3/MinIO without touching disk
      const s3Key = `avatars/${req.user.id}${ext}`;
      avatarUrl = await this.storageService.uploadBuffer(s3Key, file.buffer, file.mimetype);
    } else {
      // Local disk fallback — write buffer to disk once, serve via static assets
      const { writeFile } = await import('fs/promises');
      const filename = `${req.user.id}${ext}`;
      const filePath = join(UPLOADS_DIR, filename);
      await writeFile(filePath, file.buffer);
      avatarUrl = `/api/uploads/avatars/${filename}`;
    }

    await this.specialistsService.updateAvatarUrl(req.user.id, avatarUrl);
    return { avatarUrl };
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  deleteAvatar(@Request() req: any) {
    return this.specialistsService.deleteAvatar(req.user.id, this.storageService);
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.specialistsService.getCatalog(
      city,
      badge,
      sort,
      search,
      fns,
      category,
      parseInt(page ?? '1') || 1,
      Math.min(parseInt(limit ?? '20') || 20, 50),
    );
  }

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.specialistsService.getFeatured(parseInt(limit ?? '8') || 8);
  }

  @Get('cities/popular')
  getPopularCities(@Query('limit') limit?: string) {
    return this.specialistsService.getPopularCities(parseInt(limit ?? '50') || 50);
  }

  @Patch(':id/badges')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateBadges(@Param('id') id: string, @Body('badges') badges: string[]) {
    return this.specialistsService.adminUpdateBadges(id, badges);
  }

  @Get(':nick')
  @UseGuards(OptionalJwtAuthGuard)
  getProfile(@Param('nick') nick: string, @Request() req: any) {
    return this.specialistsService.getProfile(nick, req.user ?? null);
  }
}
