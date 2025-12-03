import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';

    this.logger = winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        isDevelopment
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
                let log = `${timestamp} [${level}]`;
                if (context) log += ` [${context}]`;
                log += `: ${message}`;
                if (Object.keys(meta).length > 0) {
                  log += ` ${JSON.stringify(meta)}`;
                }
                if (trace) log += `\n${trace}`;
                return log;
              }),
            )
          : winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
