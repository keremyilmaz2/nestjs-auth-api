import { Injectable, LoggerService, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { Client } from '@elastic/elasticsearch';
import * as Transport from 'winston-transport';

// Elasticsearch transport for winston
class ElasticsearchTransport extends Transport {
  private client: Client;
  private indexPrefix: string;

  constructor(opts: { node: string; indexPrefix: string; auth?: { username: string; password: string } }) {
    super();
    this.indexPrefix = opts.indexPrefix || 'logs';
    this.client = new Client({
      node: opts.node,
      auth: opts.auth,
      tls: {
        rejectUnauthorized: false, // Development için
      },
    });
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const timestamp = new Date();
    const index = `${this.indexPrefix}-${timestamp.toISOString().split('T')[0]}`;

    this.client.index({
      index,
      document: {
        '@timestamp': timestamp.toISOString(),
        level: info.level,
        message: info.message,
        context: info.context,
        trace: info.trace,
        correlationId: info.correlationId,
        meta: info.meta,
        service: 'nestjs-auth-api',
        environment: process.env.NODE_ENV || 'development',
      },
    }).catch((error) => {
      console.error('Failed to send log to Elasticsearch:', error.message);
    });

    callback();
  }
}

@Injectable()
export class WinstonLoggerService implements LoggerService, OnModuleDestroy {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Transports array
    const transports: winston.transport[] = [
      // Console transport - always enabled
      new winston.transports.Console({
        level: isDevelopment ? 'debug' : 'warn',
        format: isDevelopment
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
                let log = `${timestamp} [${level}]`;
                if (context) log += ` [${context}]`;
                log += `: ${message}`;
                if (Object.keys(meta).length > 0 && meta.correlationId) {
                  log += ` [${meta.correlationId}]`;
                }
                if (trace) log += `\n${trace}`;
                return log;
              }),
            )
          : winston.format.json(),
      }),

      // Daily rotate file - Error logs
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.json(),
      }),

      // Daily rotate file - Combined logs
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.json(),
      }),
    ];

    // Elasticsearch transport - if configured
    const elasticsearchNode = this.configService.get<string>('ELASTICSEARCH_NODE');
    if (elasticsearchNode) {
      const esTransport = new ElasticsearchTransport({
        node: elasticsearchNode,
        indexPrefix: this.configService.get<string>('ELASTICSEARCH_INDEX_PREFIX', 'nestjs-logs'),
        auth: {
          username: this.configService.get<string>('ELASTICSEARCH_USERNAME', 'elastic'),
          password: this.configService.get<string>('ELASTICSEARCH_PASSWORD', ''),
        },
      });
      transports.push(esTransport as unknown as winston.transport);
    }

    this.logger = winston.createLogger({
      level: isDevelopment ? 'debug' : (isProduction ? 'warn' : 'info'),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
      ),
      transports,
      // Exception ve Rejection handling
      exceptionHandlers: [
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
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

  // Özel method - correlationId ile loglama
  logWithCorrelation(
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    correlationId: string,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.log(level, message, { context, correlationId, meta });
  }

  onModuleDestroy(): void {
    this.logger.close();
  }
}