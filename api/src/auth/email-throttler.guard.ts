import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const LOCALHOST_IPS = new Set(['::1', '127.0.0.1', '::ffff:127.0.0.1']);

/**
 * Custom throttle guard for auth endpoints.
 * Uses email from request body as the rate-limit key (3 req/15min per email).
 * Localhost is exempt for local development testing.
 */
@Injectable()
export class EmailThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip: string = req.ip ?? '';
    if (LOCALHOST_IPS.has(ip)) return true;
    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email: string | undefined = req.body?.email;
    if (email && typeof email === 'string') {
      return `email:${email.toLowerCase().trim()}`;
    }
    return req.ip as string;
  }
}
