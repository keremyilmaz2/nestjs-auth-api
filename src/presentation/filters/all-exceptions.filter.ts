import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
  ConflictException,
} from '@core/domain/exceptions/domain.exception';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  code?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
  correlationId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let code: string | undefined;
    let errors: Record<string, string[]> | undefined;

    // Handle HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : (responseObj.message as string) || exception.message;
        error = (responseObj.error as string) || exception.name;
      }
    }
    // Handle Domain Exceptions
    else if (exception instanceof DomainException) {
      code = exception.code;

      if (exception instanceof EntityNotFoundException) {
        status = HttpStatus.NOT_FOUND;
        error = 'NotFound';
      } else if (exception instanceof UnauthorizedException) {
        status = HttpStatus.UNAUTHORIZED;
        error = 'Unauthorized';
      } else if (exception instanceof ForbiddenException) {
        status = HttpStatus.FORBIDDEN;
        error = 'Forbidden';
      } else if (exception instanceof ValidationException) {
        status = HttpStatus.BAD_REQUEST;
        error = 'ValidationError';
        errors = exception.errors;
      } else if (exception instanceof ConflictException) {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
      } else {
        status = HttpStatus.BAD_REQUEST;
        error = 'DomainError';
      }

      message = exception.message;
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId: request.headers['x-correlation-id'] as string,
    };

    if (code) {
      errorResponse.code = code;
    }

    if (errors) {
      errorResponse.errors = errors;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}
