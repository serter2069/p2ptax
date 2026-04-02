import { Controller, Delete, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { IsString, IsArray, Length, Matches, MinLength, ArrayMinSize } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

class SetUsernameDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username can only contain letters, numbers, and underscores' })
  username!: string;
}

class SetupSpecialistProfileDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  cities!: string[];

  @IsString()
  @MinLength(1)
  services!: string;
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
    return this.usersService.setupSpecialistProfile(req.user.id, body.cities, body.services);
  }

  /** DELETE /users/me — permanently delete the authenticated user's account */
  @Delete('me')
  deleteMe(@Request() req: { user: { id: string } }) {
    return this.usersService.deleteUser(req.user.id);
  }
}
