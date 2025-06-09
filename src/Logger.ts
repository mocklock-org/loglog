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
import {
  Environment,
  EnvironmentConfig,
  ClientConfig,
  ServerConfig,
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_SERVER_CONFIG
} from './types/environment';
import { RemoteTransport } from './transports/RemoteTransport';

const isServer = typeof window === 'undefined';

interface RequiredLoggerOptions extends Omit<Required<LoggerOptions>, 'rotationOptions' | 'clientConfig' | 'serverConfig' | 'winstonInstance'> {
  rotationOptions: LogRotationOptions | undefined;
  environment: Environment;
  clientConfig?: ClientConfig;
  serverConfig?: ServerConfig;
  winstonInstance?: WinstonLoggerType;
}

/**
 * Core Logger class that provides structured logging capabilities with support for:
 * - Multiple transport layers
 * - Log rotation (server-side)
 * - Remote logging (client-side)
 * - OpenTelemetry integration
 * - Context propagation
 * - Performance timing
 * - Colorized output
 * - Environment-specific configuration
 * 
 * @example
 * ```typescript
 * // Server-side logger
 * const logger = new Logger({
 *   environment: 'production',
 *   serverConfig: {
 *     logDirectory: 'logs',
 *     enableFile: true
 *   }
 * });
 * 
 * // Client-side logger
 * const logger = new Logger({
 *   environment: 'production',
 *   clientConfig: {
 *     remoteEndpoint: '/api/logs',
 *     enableRemote: true
 *   }
 * });
 * ```
 */
export class Logger {
  private options: RequiredLoggerOptions;
  private transports: LogTransport[] = [];
  private winstonLogger: WinstonLoggerType;
  private defaultContext: LogContext;
  private rotatingStream: any;
  private config: EnvironmentConfig;

  /**
   * Creates a new Logger instance with the specified options
   * @param options - Configuration options for the logger
   */
  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level || LogLevel.INFO,
      timestamp: options.timestamp ?? true,
      colorize: options.colorize ?? true,
      logToFile: options.logToFile ?? false,
      logFilePath: options.logFilePath || 'logs/app.log',
      format: options.format || this.defaultFormat.bind(this),
      rotationOptions: undefined,
      defaultContext: options.defaultContext || {},
      structured: options.structured ?? true,
      winstonInstance: options.winstonInstance,
      customFormats: options.customFormats || [],
      environment: process.env.NODE_ENV as Environment || 'development',
      clientConfig: options.clientConfig,
      serverConfig: options.serverConfig
    };

    // Set environment-specific configuration
    this.config = isServer 
      ? { ...DEFAULT_SERVER_CONFIG, ...this.options.serverConfig }
      : { ...DEFAULT_CLIENT_CONFIG, ...this.options.clientConfig };

    this.defaultContext = {
      environment: this.options.environment,
      ...this.options.defaultContext
    };

    // Initialize Winston logger for server-side
    if (isServer) {
      this.winstonLogger = this.options.winstonInstance || this.createWinstonLogger();
    } else {
      // Create a dummy logger for client-side that does nothing
      this.winstonLogger = createLogger({
        silent: true,
        transports: []
      });
    }

    this.setupTransports();
  }

  private setupTransports(): void {
    // Console transport
    if (this.config.enableConsole) {
      this.addTransport({
        log: (entry: LogEntry) => {
          const formattedMessage = this.options.format(entry);
          if (this.config.colorize) {
            console.log(this.colorize(entry.level, formattedMessage));
          } else {
            console.log(formattedMessage);
          }
        }
      });
    }

    // Server-side transports
    if (isServer) {
      const serverConfig = this.config as ServerConfig;
      
      // File transport
      if (serverConfig.enableFile) {
        this.setupFileTransport(serverConfig);
      }

      // Winston logger (server-side only)
      this.winstonLogger = this.createWinstonLogger();
    }
    // Client-side transports
    else {
      const clientConfig = this.config as ClientConfig;
      
      // Remote transport
      if (clientConfig.enableRemote && clientConfig.remoteEndpoint) {
        this.addTransport(new RemoteTransport(clientConfig));
      }
    }
  }

  /**
   * Creates a Winston logger instance with appropriate configuration
   * @private
   */
  private createWinstonLogger(): WinstonLoggerType {
    const formatters = [
      format.timestamp(),
      format.errors({ stack: true }),
      this.config.structured ? format.json() : format.simple(),
      ...(this.options.customFormats || [])
    ];

    if (this.config.colorize) {
      formatters.push(format.colorize());
    }

    return createLogger({
      level: this.config.level,
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
  private setupFileTransport(config: ServerConfig) {
    if (!config.rotationOptions) return;

    const filename = this.options.logFilePath.replace(/%DATE%/g, 'YYYY-MM-DD');
    
    this.rotatingStream = createStream(filename, {
      size: config.rotationOptions.maxSize,
      interval: config.rotationOptions.datePattern === 'YYYY-MM-DD' ? '1d' : config.rotationOptions.datePattern,
      compress: config.rotationOptions.zippedArchive ? "gzip" : false,
      maxFiles: parseInt(config.rotationOptions.maxFiles as string) || 14
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

  /**
   * Cleans up resources and flushes any pending logs
   */
  public async cleanup(): Promise<void> {
    for (const transport of this.transports) {
      if ('cleanup' in transport && typeof transport.cleanup === 'function') {
        await transport.cleanup();
      }
    }

    if (this.rotatingStream) {
      this.rotatingStream.end();
    }
  }
} 