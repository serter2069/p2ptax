import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * #1897/#2253: Custom throttle guard for auth endpoints.
 * Uses the email from the request body as the rate-limit key instead of IP.
 * Targets the 'email-otp' named throttler (3 req/15min per email).
 */
@Injectable()
export class EmailThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email: string | undefined = req.body?.email;
    if (email && typeof email === 'string') {
      // Normalize email to prevent trivial bypass (Foo@Bar.com vs foo@bar.com)
      return `email:${email.toLowerCase().trim()}`;
    }
    // Fallback to IP for endpoints without email in body
    return req.ip as string;
  }
}
