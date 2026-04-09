import { Controller, Delete, Get, Patch, Post, Body, Request, UseGuards } from '@nestjs/common';
import { IsString, IsArray, IsBoolean, IsOptional, IsIn, Length, Matches, MinLength, ArrayMinSize, IsEmail } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailThrottlerGuard } from '../auth/email-throttler.guard';
import { UsersService } from './users.service';

class SetUsernameDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username can only contain letters, numbers, and underscores' })
  username!: string;
}

class UpdateSettingsDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;
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
  constructor(private readonly usersService: UsersService) {}

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

  /** PATCH /users/me/username — set or update username */
  @Patch('me/username')
  setUsername(
    @Request() req: { user: { id: string } },
    @Body() body: SetUsernameDto,
  ) {
    return this.usersService.setUsername(req.user.id, body.username);
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
    return this.usersService.setupSpecialistProfile(req.user.id, body.cities, body.services, body.fnsOffices);
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
