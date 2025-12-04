import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const correlationId = request.headers['x-correlation-id'] || 'N/A';
    const startTime = Date.now();

    // Log request
    this.logger.log(
      `[${correlationId}] → ${method} ${url} - UserAgent: ${userAgent}`,
    );

    // Log request body in development
    if (process.env.NODE_ENV === 'development' && body && Object.keys(body).length > 0) {
      // Mask sensitive fields
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`[${correlationId}] Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (_data) => {  // data yerine _data
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${correlationId}] ← ${method} ${url} - ${response.statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${correlationId}] ← ${method} ${url} - ${error.status || 500} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'refreshToken', 'accessToken', 'token'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}