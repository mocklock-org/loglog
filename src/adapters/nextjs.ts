import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import * as opentelemetry from '@opentelemetry/api';
import { Logger } from '../Logger';
import { LoggingAdapter, RequestInfo, ResponseInfo } from './base';
import { LogContext } from '../types';

/**
 * Configuration options for the Next.js logging adapter
 */
export interface NextjsAdapterOptions {
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
 * Next.js-specific logging adapter that provides request/response logging middleware
 * with security features and OpenTelemetry integration.
 * 
 * @example
 * ```typescript
 * // pages/api/[...all].ts
 * import { NextjsAdapter } from '@loglog/core';
 * 
 * const logger = new Logger();
 * const adapter = new NextjsAdapter({
 *   excludePaths: ['/api/health'],
 *   logBody: true,
 *   sensitiveHeaders: ['authorization']
 * });
 * 
 * adapter.initialize(logger);
 * 
 * export default adapter.middleware();
 * ```
 */
export class NextjsAdapter implements LoggingAdapter {
  private logger!: Logger;
  private options: Required<NextjsAdapterOptions>;

  /**
   * Creates a new Next.js logging adapter instance
   * @param options - Configuration options for the adapter
   */
  constructor(options: NextjsAdapterOptions = {}) {
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
   * Creates a Next.js middleware function for request/response logging
   * @returns Next.js middleware function
   * 
   * @example
   * ```typescript
   * // pages/api/users.ts
   * import { NextApiRequest, NextApiResponse } from 'next';
   * import { withLogging } from '@/lib/logging';
   * 
   * async function handler(req: NextApiRequest, res: NextApiResponse) {
   *   // Your route logic here
   * }
   * 
   * export default withLogging(handler);
   * ```
   */
  middleware() {
    return async (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
      // Skip logging for excluded paths
      if (this.options.excludePaths.some(path => req.url?.startsWith(path))) {
        return next?.();
      }

      const startTime = process.hrtime();

      // Create request info
      const requestInfo: RequestInfo = {
        method: req.method || 'GET',
        url: req.url || '/',
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      // Create request logger
      const requestLogger = this.createRequestLogger(requestInfo);

      // Log request
      this.logRequest(requestLogger, requestInfo);

      // Wrap the response methods to capture the response
      const originalEnd = res.end;
      const originalJson = res.json;
      const originalSend = res.send;

      // Track if response has been logged
      let isResponseLogged = false;

      const logResponseOnce = (statusCode: number, body?: any) => {
        if (isResponseLogged) return;
        isResponseLogged = true;

        const responseTime = process.hrtime(startTime);
        const durationMs = responseTime[0] * 1000 + responseTime[1] / 1000000;

        const responseInfo: ResponseInfo = {
          statusCode,
          headers: Object.entries(res.getHeaders()).reduce((acc, [key, value]) => {
            acc[key] = value?.toString() || undefined;
            return acc;
          }, {} as Record<string, string | string[] | undefined>),
          body,
          duration: durationMs,
          size: body ? JSON.stringify(body).length : 0,
        };

        this.logResponse(requestLogger, responseInfo);
      };

      // Override response methods
      res.json = function(body: any) {
        logResponseOnce(res.statusCode, body);
        return originalJson.call(this, body);
      };

      res.send = function(body: any) {
        logResponseOnce(res.statusCode, body);
        return originalSend.call(this, body);
      };

      res.end = function(chunk?: any) {
        logResponseOnce(res.statusCode, chunk);
        return originalEnd.apply(this, arguments as any);
      };

      if (next) {
        next();
      }

      return res;
    };
  }

  /**
   * Cleanup method (no-op for Next.js adapter)
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up for Next.js adapter
  }
} 