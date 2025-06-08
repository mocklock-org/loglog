import { Logger } from '../Logger';
import { LogContext } from '../types';

export interface RequestInfo {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, any>;
  body?: any;
  ip?: string;
  userAgent?: string;
}

export interface ResponseInfo {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  duration?: number;
  size?: number;
}

export interface LoggingAdapter {
  /**
   * Initialize the adapter with a logger instance
   */
  initialize(logger: Logger): void;

  /**
   * Create a new logger instance with request-specific context
   */
  createRequestLogger(requestInfo: RequestInfo): Logger;

  /**
   * Log request information
   */
  logRequest(logger: Logger, requestInfo: RequestInfo): void;

  /**
   * Log response information
   */
  logResponse(logger: Logger, responseInfo: ResponseInfo): void;

  /**
   * Create context from request information
   */
  createContext(requestInfo: RequestInfo): LogContext;

  /**
   * Sanitize sensitive information from request/response data
   */
  sanitize(data: any, sensitiveFields: string[]): any;

  /**
   * Clean up any resources when the adapter is no longer needed
   */
  cleanup?(): Promise<void>;
} 