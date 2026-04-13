
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface FieldError {
  field: string;
  message: string;
}

@Catch(HttpException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Only transform 400 Bad Request (validation errors)
    if (status === 400 && exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse();

      let fieldErrors: FieldError[] = [];

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(resp['message'])) {
          fieldErrors = (resp['message'] as string[]).map((msg) => {
            return { field: this.extractField(msg), message: msg };
          });
        } else if (typeof resp['message'] === 'string') {
          fieldErrors = [{ field: '', message: resp['message'] as string }];
        }
      }

      return response.status(400).json({
        statusCode: 400,
        errors: fieldErrors,
      });
    }

    // For other HTTP errors, pass through with structured format
    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      message = (resp['message'] as string) || exception.message;
    }

    return response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
    });
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
