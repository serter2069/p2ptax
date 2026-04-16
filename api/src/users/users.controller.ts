import { Controller, Delete, Get, Patch, Post, Query, Body, Request, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { IsString, IsArray, IsBoolean, IsOptional, IsIn, Length, Matches, ArrayMinSize, IsEmail } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, Public } from '../auth/jwt-auth.guard';
import { EmailThrottlerGuard } from '../auth/email-throttler.guard';
import { IpThrottlerGuard } from '../auth/ip-throttler.guard';
import { UsersService } from './users.service';
import { StorageService } from '../storage/storage.service';

const AVATAR_UPLOADS_DIR = join(__dirname, '..', '..', 'uploads', 'avatars');
if (!existsSync(AVATAR_UPLOADS_DIR)) {
  mkdirSync(AVATAR_UPLOADS_DIR, { recursive: true });
}

class SetUsernameDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username can only contain letters, numbers, and underscores' })
  username!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

class UpdateSettingsDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;
}

class UpdateNotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  new_messages?: boolean;
}

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @IsIn(['CLIENT', 'SPECIALIST'])
  role?: string;

  @IsOptional()
  @IsString()
  @Length(3, 20)
  username?: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;
}

class SetupSpecialistProfileDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  cities!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  services!: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fnsOffices?: string[];

  /** Structured FNS-service bindings: array of { fnsId, serviceNames[] } */
  @IsOptional()
  fnsServices?: Array<{ fnsId: string; serviceNames: string[] }>;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  telegram?: string;
}

class ChangeEmailRequestDto {
  @IsEmail()
  newEmail!: string;
}

class ChangeEmailConfirmDto {
  @IsEmail()
  newEmail!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * GET /users/check-username?username=xxx
   * Public endpoint — no auth required. IP rate-limited.
   * Returns { available: boolean }
   */
  @Public()
  @UseGuards(IpThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Get('check-username')
  checkUsername(@Query('username') username?: string) {
    if (!username) return { available: false };
    return this.usersService.checkUsernameAvailability(username);
  }

  /** GET /users/me — return current user profile */
  @Get('me')
  getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.getMe(req.user.id);
  }

  /**
   * PATCH /users/me — update user profile fields.
   * role: set role for new users (onboarding). Optional.
   * username: update username. Optional.
   */
  @Patch('me')
  async updateMe(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateMeDto,
  ) {
    let result: any = {};

    if (body.role) {
      result = await this.usersService.updateRole(req.user.id, body.role);
    }

    if (body.username) {
      result = await this.usersService.setUsername(req.user.id, body.username);
    }

    // If nothing was provided, just return current profile
    if (!body.role && !body.username) {
      result = await this.usersService.getMe(req.user.id);
    }

    return result;
  }

  /** PATCH /users/me/profile — update client profile (firstName, lastName, phone) */
  @Patch('me/profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  /** POST /users/me/avatar — upload avatar for any user */
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
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
      const s3Key = `avatars/${req.user.id}${ext}`;
      avatarUrl = await this.storageService.uploadBufferPublic(s3Key, file.buffer, file.mimetype);
    } else {
      const { writeFile } = await import('fs/promises');
      const filename = `${req.user.id}${ext}`;
      const filePath = join(AVATAR_UPLOADS_DIR, filename);
      await writeFile(filePath, file.buffer);
      avatarUrl = `/api/uploads/avatars/${filename}`;
    }

    return this.usersService.updateProfile(req.user.id, { avatarUrl });
  }

  /** PATCH /users/me/username — set or update username + name */
  @Patch('me/username')
  setUsername(
    @Request() req: { user: { id: string } },
    @Body() body: SetUsernameDto,
  ) {
    return this.usersService.setUsername(req.user.id, body.username, body.firstName, body.lastName);
  }

  /**
   * PATCH /users/me/specialist-profile — onboarding step 3.
   * No role guard — any authenticated user can call this during onboarding.
   * Creates SpecialistProfile (nick = username) and promotes user to SPECIALIST role.
   */
  @Patch('me/specialist-profile')
  setupSpecialistProfile(
    @Request() req: { user: { id: string } },
    @Body() body: SetupSpecialistProfileDto,
  ) {
    return this.usersService.setupSpecialistProfile(req.user.id, body.cities, body.services, body.fnsOffices, body.fnsServices, {
      displayName: body.displayName,
      bio: body.bio,
      telegram: body.telegram,
    });
  }

  /** GET /users/me/settings — return user settings */
  @Get('me/settings')
  getSettings(@Request() req: { user: { id: string } }) {
    return this.usersService.getSettings(req.user.id);
  }

  /** PATCH /users/me/settings — update user settings (notifications etc.) */
  @Patch('me/settings')
  updateSettings(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(req.user.id, body);
  }

  /** GET /users/me/notification-settings — return granular notification preferences */
  @Get('me/notification-settings')
  getNotificationSettings(@Request() req: { user: { id: string } }) {
    return this.usersService.getNotificationSettings(req.user.id);
  }

  /** PATCH /users/me/notification-settings — update individual notification toggles */
  @Patch('me/notification-settings')
  updateNotificationSettings(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    return this.usersService.updateNotificationSettings(req.user.id, body);
  }

  /** DELETE /users/me — permanently delete the authenticated user's account */
  @Delete('me')
  deleteMe(@Request() req: { user: { id: string } }) {
    return this.usersService.deleteUser(req.user.id);
  }

  /**
   * POST /users/me/change-email/request
   * Step 1: send OTP to the new email address.
   * Throttled: max 3 requests per 5 minutes per IP.
   */
  @UseGuards(EmailThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 3 } })
  @Post('me/change-email/request')
  requestEmailChange(
    @Request() req: { user: { id: string } },
    @Body() body: ChangeEmailRequestDto,
  ) {
    return this.usersService.requestEmailChange(req.user.id, body.newEmail);
  }

  /**
   * POST /users/me/change-email/confirm
   * Step 2: verify OTP, update email, return new tokens.
   * Throttled: max 10 attempts per 5 minutes per IP.
   */
  @UseGuards(EmailThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @Post('me/change-email/confirm')
  confirmEmailChange(
    @Request() req: { user: { id: string } },
    @Body() body: ChangeEmailConfirmDto,
  ) {
    return this.usersService.confirmEmailChange(req.user.id, body.newEmail, body.code);
  }
}
