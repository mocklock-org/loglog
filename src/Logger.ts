import { createLogger, format, transports, Logger as WinstonLoggerType } from 'winston';
import { createStream } from 'rotating-file-stream';
import { v4 as uuidv4 } from 'uuid';
import * as opentelemetry from '@opentelemetry/api';
import {
  LogLevel,
  LogEntry,
  LoggerOptions,
  LogTransport,
  LogContext,
  LogRotationOptions
} from './types';

const isServer = typeof window === 'undefined';

/** Default options for log file rotation */
const DEFAULT_ROTATION_OPTIONS: LogRotationOptions = {
  maxSize: '20m',
  maxFiles: '14d',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true
};

interface RequiredLoggerOptions extends Omit<Required<LoggerOptions>, 'rotationOptions'> {
  rotationOptions: LogRotationOptions | undefined;
}

/**
 * Core Logger class that provides structured logging capabilities with support for:
 * - Multiple transport layers
 * - Log rotation
 * - OpenTelemetry integration
 * - Context propagation
 * - Performance timing
 * - Colorized output
 * 
 * @example
 * ```typescript
 * const logger = new Logger({
 *   level: LogLevel.DEBUG,
 *   logToFile: true,
 *   logFilePath: 'logs/app-%DATE%.log',
 *   structured: true
 * });
 * 
 * logger.info('Application started');
 * logger.error('Error occurred', new Error('Something went wrong'));
 * ```
 */
export class Logger {
  private options: RequiredLoggerOptions;
  private transports: LogTransport[] = [];
  private winstonLogger!: WinstonLoggerType;
  private defaultContext: LogContext;
  private rotatingStream: any;

  /**
   * Creates a new Logger instance with the specified options
   * @param options - Configuration options for the logger
   */
  constructor(options: LoggerOptions = {}) {
    // Handle rotation options separately to avoid setting them when file logging is disabled
    const rotationOptions = options.logToFile ? (options.rotationOptions || DEFAULT_ROTATION_OPTIONS) : undefined;

    this.options = {
      level: options.level || LogLevel.INFO,
      timestamp: options.timestamp ?? true,
      colorize: options.colorize ?? true,
      logToFile: options.logToFile ?? false,
      logFilePath: options.logFilePath || 'logs/app.log',
      format: options.format || this.defaultFormat.bind(this),
      rotationOptions,
      defaultContext: options.defaultContext || {},
      structured: options.structured ?? true,
      winstonInstance: options.winstonInstance || this.createWinstonLogger(options),
      customFormats: options.customFormats || []
    };

    this.defaultContext = {
      environment: process.env.NODE_ENV || 'development',
      ...this.options.defaultContext
    };

    if (isServer && this.options.logToFile && this.options.rotationOptions) {
      this.setupFileTransport();
    }

    // Console transport is always added
    this.addTransport({
      log: (entry: LogEntry) => {
        const formattedMessage = this.options.format(entry);
        if (this.options.colorize) {
          console.log(this.colorize(entry.level, formattedMessage));
        } else {
          console.log(formattedMessage);
        }
      }
    });
  }

  /**
   * Creates a Winston logger instance with appropriate configuration
   * @private
   */
  private createWinstonLogger(options: LoggerOptions): WinstonLoggerType {
    const formatters = [
      format.timestamp(),
      format.errors({ stack: true }),
      options.structured ? format.json() : format.simple(),
      ...(options.customFormats || [])
    ];

    if (options.colorize) {
      formatters.push(format.colorize());
    }

    return createLogger({
      level: options.level || LogLevel.INFO,
      format: format.combine(...formatters),
      transports: [
        new transports.Console()
      ]
    });
  }

  /**
   * Sets up file transport with rotation options
   * @private
   */
  private setupFileTransport() {
    if (!isServer || !this.options.logToFile || !this.options.rotationOptions) {
      return;
    }

    const filename = this.options.logFilePath.replace(/%DATE%/g, 'YYYY-MM-DD');
    
    this.rotatingStream = createStream(filename, {
      size: this.options.rotationOptions.maxSize,
      interval: this.options.rotationOptions.datePattern === 'YYYY-MM-DD' ? '1d' : this.options.rotationOptions.datePattern,
      compress: this.options.rotationOptions.zippedArchive ? "gzip" : false,
      maxFiles: parseInt(this.options.rotationOptions.maxFiles as string) || 14
    });

    this.addTransport({
      log: (entry: LogEntry) => {
        const formattedMessage = this.options.format(entry);
        if (this.rotatingStream) {
          this.rotatingStream.write(formattedMessage + '\n');
        }
      }
    });
  }

  /**
   * Enriches log entry with OpenTelemetry trace context and additional metadata
   * @private
   */
  private enrichLogEntry(entry: LogEntry): Record<string, any> {
    const span = opentelemetry.trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    return {
      ...entry,
      context: {
        ...this.defaultContext,
        ...entry.context,
        traceId,
        spanId,
        timestamp: entry.timestamp.toISOString()
      }
    };
  }

  /**
   * Default log formatter that handles structured and unstructured logging
   * @private
   */
  private defaultFormat(entry: LogEntry): string {
    if (this.options.structured) {
      return JSON.stringify(this.enrichLogEntry(entry));
    }

    const timestamp = this.options.timestamp
      ? `[${entry.timestamp.toISOString()}] `
      : '';
    const level = `[${entry.level.toUpperCase()}] `;
    const context = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : '';
    const error = entry.error
      ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`
      : '';
    
    return `${timestamp}${level}${entry.message}${context}${error}`;
  }

  /**
   * Applies ANSI color codes to log messages based on level
   * @private
   */
  private colorize(level: LogLevel, message: string): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };

    return `${colors[level]}${message}\x1b[0m`;
  }

  /**
   * Adds a custom transport to the logger
   * @param transport - Custom transport implementation
   */
  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Creates a standardized log entry with metadata
   * @private
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context: {
        requestId: uuidv4(),
        ...context
      },
      error,
      duration,
      labels: {}
    };
  }

  /**
   * Creates a new logger instance with additional context
   * @param context - Additional context to merge with existing context
   * @returns New logger instance with combined context
   * 
   * @example
   * ```typescript
   * const userLogger = logger.withContext({ userId: '123' });
   * userLogger.info('User action'); // Includes userId in context
   * ```
   */
  public withContext(context: LogContext): Logger {
    const newLogger = new Logger({
      ...this.options,
      defaultContext: {
        ...this.defaultContext,
        ...context
      }
    });
    return newLogger;
  }

  /**
   * Creates a high-resolution timer for performance measurements
   * @returns Function that returns elapsed time in milliseconds
   */
  public startTimer(): () => number {
    const start = process.hrtime();
    return () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      return seconds * 1000 + nanoseconds / 1000000;
    };
  }

  /**
   * Internal logging implementation
   * @private
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number
  ): void {
    const entry = this.createLogEntry(level, message, context, error, duration);
    this.transports.forEach(transport => transport.log(entry));
    
    this.winstonLogger.log({
      level,
      message,
      ...this.enrichLogEntry(entry)
    });
  }

  /**
   * Logs a debug message
   * @param message - Log message
   * @param context - Additional context
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an info message
   * @param message - Log message
   * @param context - Additional context
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message
   * @param message - Log message
   * @param context - Additional context
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message with optional error object
   * @param message - Error message
   * @param error - Error object
   * @param context - Additional context
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Times an async function execution and logs its duration
   * @param message - Message to log after completion
   * @param fn - Async function to time
   * @param context - Additional context
   * @returns Promise resolving to the function result
   * 
   * @example
   * ```typescript
   * const result = await logger.time(
   *   'Database query completed',
   *   async () => await db.query('SELECT * FROM users'),
   *   { queryType: 'select' }
   * );
   * ```
   */
  public async time<T>(
    message: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const timer = this.startTimer();
    try {
      const result = await fn();
      const duration = timer();
      this.info(message, { ...context, duration });
      return result;
    } catch (error) {
      const duration = timer();
      this.error(message, error as Error, { ...context, duration });
      throw error;
    }
  }

  /**
   * Gets the current logger context
   * @returns Current context object
   */
  public get context(): LogContext {
    return this.defaultContext;
  }
} 