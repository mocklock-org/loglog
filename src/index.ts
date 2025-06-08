/**
 * @fileoverview LogLog - Advanced Logging System
 * A scalable, framework-agnostic logging system with built-in support for Express.js and Next.js.
 * @module loglog
 */

/**
 * Core logging functionality exports
 */
export { Logger } from './Logger';
export { LogLevel, LogEntry, LogContext, LoggerOptions, LogRotationOptions } from './types';

/**
 * Base adapter interface and types for creating custom framework adapters
 */
export { LoggingAdapter, RequestInfo, ResponseInfo } from './adapters/base';

/**
 * Framework-specific adapters for Express.js and Next.js
 * @see {@link ExpressAdapter} for Express.js integration
 * @see {@link NextjsAdapter} for Next.js integration
 */
export { ExpressAdapter, ExpressAdapterOptions } from './adapters/express';
export { NextjsAdapter, NextjsAdapterOptions } from './adapters/nextjs';

/**
 * Express middleware for request/response logging
 * @see {@link createLoggingMiddleware} for middleware creation
 * @see {@link getRequestLogger} for accessing request-specific logger
 */
export { createLoggingMiddleware, getRequestLogger } from './middleware';

/**
 * Type definitions for middleware configuration
 */
export type { LoggingMiddlewareOptions } from './middleware'; 