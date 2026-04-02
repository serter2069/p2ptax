import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict a route to specific roles.
 * Usage: @Roles(Role.CLIENT) or @Roles(Role.SPECIALIST)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
