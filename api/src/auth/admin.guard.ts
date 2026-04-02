import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Admin emails are comma-separated in ADMIN_EMAILS env var.
// No ADMIN role in DB yet, so we check email directly.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').filter(Boolean);

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!ADMIN_EMAILS.includes(user?.email)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
