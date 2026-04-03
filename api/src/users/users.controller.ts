import { Controller, Delete, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { IsString, IsArray, IsBoolean, IsOptional, IsIn, Length, Matches, MinLength, ArrayMinSize } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  @IsString()
  @IsIn(['CLIENT', 'SPECIALIST'])
  role!: string;
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
   * PATCH /users/me — set role for new users (isNewUser / role=null).
   * Only allowed when the user has not yet picked a role.
   */
  @Patch('me')
  updateMe(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateMeDto,
  ) {
    return this.usersService.updateRole(req.user.id, body.role);
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
}
