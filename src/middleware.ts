import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './Logger';
import * as opentelemetry from '@opentelemetry/api';

/**
 * Extends the Express Request type to include custom context properties.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Custom request context containing logging and tracking information.
       */
      context?: {
        /** Unique identifier for the request */
        requestId: string;
        /** High-resolution timestamp of when the request started */
        startTime: [number, number];
        /** Request-specific logger instance with context */
        logger: Logger;
      };
    }
  }
}

/**
 * Configuration options for the logging middleware.
 */
export interface LoggingMiddlewareOptions {
  /** Logger instance to use for request/response logging */
  logger: Logger;
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
 * Creates an Express middleware function for request/response logging with security features.
 * 
 * @param options - Configuration options for the logging middleware
 * @returns Express middleware function that handles request/response logging
 * 
 * @example
 * ```typescript
 * const logger = new Logger();
 * app.use(createLoggingMiddleware({
 *   logger,
 *   excludePaths: ['/health'],
 *   logBody: true,
 *   sensitiveHeaders: ['authorization']
 * }));
 * ```
 */
export function createLoggingMiddleware(options: LoggingMiddlewareOptions): RequestHandler {
  const {
    logger,
    excludePaths = [],
    logBody = true,
    logQuery = true,
    logHeaders = true,
    sensitiveHeaders = DEFAULT_SENSITIVE_HEADERS,
    sensitiveBodyFields = DEFAULT_SENSITIVE_BODY_FIELDS,
  } = options;

  return function loggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const requestId = uuidv4();
    const startTime = process.hrtime();

    // Get trace context if available
    const span = opentelemetry.trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    // Create request-specific context
    req.context = {
      requestId,
      startTime,
      logger: logger.withContext({
        requestId,
        traceId,
        spanId,
        method: req.method,
        path: req.path,
      }),
    };

    /**
     * Sanitizes an object by redacting sensitive field values
     * @param obj - Object to sanitize
     * @param sensitiveFields - Array of field names to redact
     * @returns Sanitized copy of the object
     */
    const sanitizeObject = (obj: any, sensitiveFields: string[]): any => {
      if (!obj) return obj;
      const sanitized = { ...obj };
      sensitiveFields.forEach(field => {
        if (sanitized[field.toLowerCase()]) {
          sanitized[field.toLowerCase()] = '[REDACTED]';
        }
      });
      return sanitized;
    };

    // Prepare request data for logging
    const requestData: any = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (logHeaders) {
      requestData.headers = sanitizeObject(req.headers, sensitiveHeaders);
    }

    if (logQuery && Object.keys(req.query).length > 0) {
      requestData.query = sanitizeObject(req.query, sensitiveBodyFields);
    }

    if (logBody && req.body && Object.keys(req.body).length > 0) {
      requestData.body = sanitizeObject(req.body, sensitiveBodyFields);
    }

    // Log request
    req.context.logger.info('Incoming request', requestData);

    // Capture response data
    const originalEnd = res.end;
    
    // Define a new end function with proper overloads
    function endResponse(this: Response): Response;
    function endResponse(this: Response, chunk: any): Response;
    function endResponse(this: Response, chunk: any, encoding: BufferEncoding): Response;
    function endResponse(this: Response, chunk?: any, encoding?: BufferEncoding): Response {
      const responseTime = process.hrtime(startTime);
      const durationMs = responseTime[0] * 1000 + responseTime[1] / 1000000;

      const responseData = {
        statusCode: res.statusCode,
        duration: durationMs,
        responseSize: res.get('content-length'),
      };

      if (res.statusCode >= 400) {
        req.context!.logger.error('Request failed', undefined, responseData);
      } else {
        req.context!.logger.info('Request completed', responseData);
      }

      return originalEnd.apply(this, arguments as any);
    }

    res.end = endResponse;

    next();
  };
}

/**
 * Retrieves the request-specific logger instance from the request context.
 * This logger includes request-specific metadata like requestId and traceId.
 * 
 * @param req - Express request object
 * @returns Logger instance with request context
 * @throws Error if logger is not found in request context
 * 
 * @example
 * ```typescript
 * app.get('/api/users', (req, res) => {
 *   const logger = getRequestLogger(req);
 *   logger.info('Fetching users'); // Will include requestId, traceId, etc.
 * });
 * ```
 */
export function getRequestLogger(req: Request): Logger {
  if (!req.context?.logger) {
    throw new Error('Request logger not found. Make sure logging middleware is properly configured.');
  }
  return req.context.logger;
} 