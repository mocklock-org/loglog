export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  timestamp?: Date;
  context?: LogContext;
  error?: Error;
  duration?: number;
  labels?: Record<string, string>;
}

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  method?: string;
  path?: string;
  environment?: string;
  [key: string]: any;
}

export interface LogRotationOptions {
  maxSize: string;
  maxFiles: string;
  datePattern: string;
  zippedArchive: boolean;
}

export interface LogTransport {
  log: (entry: LogEntry) => void;
  cleanup?: () => Promise<void>;
}

export interface LoggerOptions {
  level?: LogLevel;
  timestamp?: boolean;
  colorize?: boolean;
  logToFile?: boolean;
  logFilePath?: string;
  format?: (entry: LogEntry) => string;
  rotationOptions?: LogRotationOptions;
  defaultContext?: Record<string, any>;
  structured?: boolean;
  customFormats?: Array<(entry: LogEntry) => string>;
  environment?: string;
  clientConfig?: {
    enableConsole?: boolean;
    enableRemote?: boolean;
    enableFile?: boolean;
    colorize?: boolean;
    timestamp?: boolean;
    remoteEndpoint?: string;
    level?: LogLevel;
    structured?: boolean;
    labels?: Record<string, string>;
  };
  serverConfig?: {
    enableConsole?: boolean;
    enableFile?: boolean;
    logDir?: string;
    level?: LogLevel;
  };
}

export abstract class Logger {
  protected options: LoggerOptions;
  protected transports: Array<{ log: (entry: LogEntry) => void }> = [];

  constructor(options: LoggerOptions) {
    this.options = options;
  }

  protected addTransport(transport: { log: (entry: LogEntry) => void }) {
    this.transports.push(transport);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  warn(message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  protected log(level: LogLevel, message: string, data?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date()
    };

    this.transports.forEach(transport => transport.log(entry));
  }
}