import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    // Read on every call so env changes take effect without restart
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

    if (!adminEmails.includes(user?.email)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
