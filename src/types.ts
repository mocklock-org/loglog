import { Environment, ClientConfig, ServerConfig } from './types/environment';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  component?: string;
  environment?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
  duration?: number;
  labels?: Record<string, string>;
}

export interface LogTransport {
  log: (entry: LogEntry) => void;
  cleanup?: () => Promise<void>;
}

export interface LogRotationOptions {
  maxSize: string;
  maxFiles: string;
  datePattern: string;
  zippedArchive: boolean;
}

export interface LoggerOptions {
  level?: LogLevel;
  timestamp?: boolean;
  colorize?: boolean;
  logToFile?: boolean;
  logFilePath?: string;
  format?: (entry: LogEntry) => string;
  rotationOptions?: LogRotationOptions;
  defaultContext?: LogContext;
  structured?: boolean;
  customFormats?: any[];
  environment?: Environment;
  clientConfig?: ClientConfig;
  serverConfig?: ServerConfig;
} 