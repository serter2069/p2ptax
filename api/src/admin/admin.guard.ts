import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard that restricts access to admin endpoints.
 * Checks if the authenticated user's email is in the ADMIN_EMAILS env var
 * (comma-separated list). Falls back to requiring no-match (deny-all)
 * if the env var is not set.
 *
 * Must be used after JwtAuthGuard so req.user is populated.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.email) {
      throw new ForbiddenException('Admin access required');
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(user.email.toLowerCase())) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
