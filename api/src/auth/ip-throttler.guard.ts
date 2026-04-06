import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * #2253: IP-based throttle guard for auth endpoints.
 * Uses client IP as the rate-limit key to prevent brute-force
 * attacks from a single IP across multiple email addresses.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `ip:${req.ip}`;
  }
}
