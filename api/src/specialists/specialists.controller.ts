import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads', 'avatars');
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SPECIALIST)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req: any, file, cb) => {
          const userId = _req.user?.id ?? 'unknown';
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `${userId}${ext}`);
        },
      }),
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
    const avatarUrl = `/api/uploads/avatars/${file.filename}`;
    await this.specialistsService.updateAvatarUrl(req.user.id, avatarUrl);
    return { avatarUrl };
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
      parseInt(limit ?? '9') || 9,
    );
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
