
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, DEFAULT_MESSAGES, errorCodeFromStatus } from './error-codes';

interface FieldError {
  field: string;
  message: string;
}

interface StandardErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details: FieldError[];
  };
}

/**
 * Global exception filter that wraps **all** errors (HTTP and unhandled) into
 * the standardized API error contract:
 *
 * ```json
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Описание ошибки (русский)",
 *     "details": [{"field": "email", "message": "Некорректный формат email"}]
 *   }
 * }
 * ```
 */
@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response);
    }

    // Unhandled / unknown errors — never expose internals
    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    return response.status(500).json(this.buildBody(ErrorCode.INTERNAL_ERROR));
  }

  // -----------------------------------------------------------------------
  private handleHttpException(exception: HttpException, response: Response) {
    const status = exception.getStatus();
    const code = errorCodeFromStatus(status);
    const exceptionResponse = exception.getResponse();

    // 400 — validation errors with per-field details
    if (status === 400) {
      const details = this.extractFieldErrors(exceptionResponse);
      const message = this.extractMessage(exceptionResponse) ?? DEFAULT_MESSAGES[code];
      return response.status(400).json({ error: { code, message, details } } satisfies StandardErrorResponse);
    }

    // 429 — rate limited
    if (status === 429) {
      return response.status(429).json(this.buildBody(ErrorCode.RATE_LIMITED));
    }

    // 5xx — never expose stack trace
    if (status >= 500) {
      this.logger.error(`HTTP ${status}`, exception instanceof Error ? exception.stack : exception);
      return response.status(status).json(this.buildBody(ErrorCode.INTERNAL_ERROR));
    }

    // Other 4xx — use the exception message (already Russian in most places)
    const message = this.extractMessage(exceptionResponse) ?? DEFAULT_MESSAGES[code];
    return response.status(status).json({
      error: { code, message, details: [] },
    } satisfies StandardErrorResponse);
  }

  // -----------------------------------------------------------------------
  private buildBody(code: ErrorCode, overrides?: { message?: string; details?: FieldError[] }): StandardErrorResponse {
    return {
      error: {
        code,
        message: overrides?.message ?? DEFAULT_MESSAGES[code],
        details: overrides?.details ?? [],
      },
    };
  }

  private extractMessage(exceptionResponse: unknown): string | null {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      const msg = resp['message'];
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg.join(', ');
    }
    return null;
  }

  private extractFieldErrors(exceptionResponse: unknown): FieldError[] {
    if (typeof exceptionResponse !== 'object' || exceptionResponse === null) return [];

    const resp = exceptionResponse as Record<string, unknown>;
    const msg = resp['message'];

    if (Array.isArray(msg)) {
      return (msg as string[]).map((m) => ({
        field: this.extractField(m),
        message: m,
      }));
    }

    if (typeof msg === 'string') {
      return [{ field: '', message: msg }];
    }

    return [];
  }

  private extractField(msg: string): string {
    const patterns = [
      /^(\w+)\s+must\s+/i,
      /^(\w+)\s+should\s+/i,
      /^(\w+)\s+has\s+/i,
      /^(\w+)\s+is\s+/i,
      /^(\w+)\s+contains\s+/i,
    ];

    for (const pattern of patterns) {
      const match = msg.match(pattern);
      if (match) {
        return match[1].charAt(0).toLowerCase() + match[1].slice(1);
      }
    }

    return '';
  }
}
