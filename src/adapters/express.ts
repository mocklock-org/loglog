import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as opentelemetry from '@opentelemetry/api';
import { Logger } from '../Logger';
import { LoggingAdapter, RequestInfo, ResponseInfo } from './base';
import { LogContext } from '../types';

/**
 * Configuration options for the Express logging adapter
 */
export interface ExpressAdapterOptions {
  /** Array of path prefixes to exclude from logging */
  excludePaths?: string[];
  /** Whether to log request body content (default: true) */
  logBody?: boolean;
  /** Whether to log query parameters (default: true) */
  logQuery?: boolean;
  /** Whether to log request headers (default: true) */
  logHeaders?: boolean;
  /** Array of header names to redact from logs */
  sensitiveHeaders?: string[];
  /** Array of body field names to redact from logs */
  sensitiveBodyFields?: string[];
}

/** Default headers that should be redacted for security */
const DEFAULT_SENSITIVE_HEADERS = [
  'authorization',
  'x-api-key',
  'cookie',
  'password',
];

/** Default body fields that should be redacted for security */
const DEFAULT_SENSITIVE_BODY_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'credential',
];

/**
 * Extends Express Request type to include logging context
 */
declare global {
  namespace Express {
    interface Request {
      /** Custom request context for logging */
      context?: {
        /** Unique identifier for the request */
        requestId: string;
        /** High-resolution timestamp of when the request started */
        startTime: [number, number];
        /** Request-specific logger instance */
        logger: Logger;
      };
    }
  }
}

/**
 * Express-specific logging adapter that provides request/response logging middleware
 * with security features and OpenTelemetry integration.
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { ExpressAdapter, Logger } from '@loglog/core';
 * 
 * const app = express();
 * const logger = new Logger();
 * 
 * const adapter = new ExpressAdapter({
 *   excludePaths: ['/health'],
 *   logBody: true,
 *   sensitiveHeaders: ['authorization']
 * });
 * 
 * adapter.initialize(logger);
 * app.use(adapter.middleware());
 * ```
 */
export class ExpressAdapter implements LoggingAdapter {
  private logger!: Logger;
  private options: Required<ExpressAdapterOptions>;

  /**
   * Creates a new Express logging adapter instance
   * @param options - Configuration options for the adapter
   */
  constructor(options: ExpressAdapterOptions = {}) {
    this.options = {
      excludePaths: options.excludePaths || [],
      logBody: options.logBody ?? true,
      logQuery: options.logQuery ?? true,
      logHeaders: options.logHeaders ?? true,
      sensitiveHeaders: options.sensitiveHeaders || DEFAULT_SENSITIVE_HEADERS,
      sensitiveBodyFields: options.sensitiveBodyFields || DEFAULT_SENSITIVE_BODY_FIELDS,
    };
  }

  /**
   * Initializes the adapter with a logger instance
   * @param logger - Logger instance to use
   */
  initialize(logger: Logger): void {
    this.logger = logger;
  }

  /**
   * Creates a logging context from request information
   * @param requestInfo - Request information
   * @returns Logging context with request metadata
   * @private
   */
  createContext(requestInfo: RequestInfo): LogContext {
    const requestId = uuidv4();
    const span = opentelemetry.trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    return {
      requestId,
      traceId,
      spanId,
      method: requestInfo.method,
      path: requestInfo.url,
    };
  }

  /**
   * Creates a request-specific logger instance
   * @param requestInfo - Request information
   * @returns Logger instance with request context
   */
  createRequestLogger(requestInfo: RequestInfo): Logger {
    const context = this.createContext(requestInfo);
    return this.logger.withContext(context);
  }

  /**
   * Sanitizes sensitive data from objects
   * @param data - Data object to sanitize
   * @param sensitiveFields - Array of field names to redact
   * @returns Sanitized copy of the data
   * @private
   */
  sanitize(data: any, sensitiveFields: string[]): any {
    if (!data) return data;
    const sanitized = { ...data };
    sensitiveFields.forEach(field => {
      if (sanitized[field.toLowerCase()]) {
        sanitized[field.toLowerCase()] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  /**
   * Logs incoming request details
   * @param logger - Request-specific logger instance
   * @param requestInfo - Request information
   */
  logRequest(logger: Logger, requestInfo: RequestInfo): void {
    const requestData: any = {
      method: requestInfo.method,
      path: requestInfo.url,
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
    };

    if (this.options.logHeaders) {
      requestData.headers = this.sanitize(requestInfo.headers, this.options.sensitiveHeaders);
    }

    if (this.options.logQuery) {
      requestData.query = this.sanitize(requestInfo.query, this.options.sensitiveBodyFields);
    }

    if (this.options.logBody && requestInfo.body) {
      requestData.body = this.sanitize(requestInfo.body, this.options.sensitiveBodyFields);
    }

    logger.info('Incoming request', requestData);
  }

  /**
   * Logs response details
   * @param logger - Request-specific logger instance
   * @param responseInfo - Response information
   */
  logResponse(logger: Logger, responseInfo: ResponseInfo): void {
    const responseData = {
      statusCode: responseInfo.statusCode,
      duration: responseInfo.duration,
      responseSize: responseInfo.size,
    };

    if (responseInfo.statusCode >= 400) {
      logger.error('Request failed', undefined, responseData);
    } else {
      logger.info('Request completed', responseData);
    }
  }

  /**
   * Creates an Express middleware function for request/response logging
   * @returns Express middleware function
   * 
   * @example
   * ```typescript
   * import express from 'express';
   * import { ExpressAdapter } from '@loglog/core';
   * 
   * const app = express();
   * const adapter = new ExpressAdapter();
   * 
   * // Add logging middleware
   * app.use(adapter.middleware());
   * 
   * app.get('/users', (req, res) => {
   *   // Access request-specific logger
   *   req.context?.logger.info('Fetching users');
   *   res.json({ users: [] });
   * });
   * ```
   */
  middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Skip logging for excluded paths
      if (this.options.excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      const startTime = process.hrtime();

      // Create request info
      const requestInfo: RequestInfo = {
        method: req.method,
        url: req.path,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      // Create request logger
      const requestLogger = this.createRequestLogger(requestInfo);

      // Attach to request
      req.context = {
        requestId: requestLogger.context.requestId as string,
        startTime,
        logger: requestLogger,
      };

      // Log request
      this.logRequest(requestLogger, requestInfo);

      // Capture response
      const originalEnd = res.end;
      const self = this;
      
      // Define a new end function with proper overloads
      function endResponse(this: Response): Response;
      function endResponse(this: Response, chunk: any): Response;
      function endResponse(this: Response, chunk: any, encoding: BufferEncoding): Response;
      function endResponse(this: Response, chunk?: any, encoding?: BufferEncoding): Response {
        const responseTime = process.hrtime(startTime);
        const durationMs = responseTime[0] * 1000 + responseTime[1] / 1000000;

        const responseInfo: ResponseInfo = {
          statusCode: res.statusCode,
          headers: Object.entries(res.getHeaders()).reduce((acc, [key, value]) => {
            acc[key] = value?.toString() || undefined;
            return acc;
          }, {} as Record<string, string | string[] | undefined>),
          duration: durationMs,
          size: parseInt(res.get('content-length') || '0', 10),
        };

        self.logResponse(requestLogger, responseInfo);

        return originalEnd.apply(this, arguments as any);
      }

      res.end = endResponse;

      next();
    };
  }

  /**
   * Cleanup method (no-op for Express adapter)
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up for Express adapter
  }
} 