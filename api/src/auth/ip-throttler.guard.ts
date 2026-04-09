import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const LOCALHOST_IPS = new Set(['::1', '127.0.0.1', '::ffff:127.0.0.1']);

/**
 * IP-based throttle guard for auth endpoints.
 * Uses client IP as the rate-limit key to prevent brute-force attacks.
 * Localhost is exempt for local development testing.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip: string = req.ip ?? '';
    if (LOCALHOST_IPS.has(ip)) return true;
    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `ip:${req.ip}`;
  }
}
