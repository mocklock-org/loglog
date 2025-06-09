import { LogLevel } from '../types';

export type Environment = 'development' | 'staging' | 'production' | 'test' | string;

export interface EnvironmentConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  structured: boolean;
  colorize: boolean;
  timestamp: boolean;
  labels: Record<string, string>;
}

export interface ClientConfig extends EnvironmentConfig {
  remoteEndpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  maxRetries?: number;
}

export interface ServerConfig extends EnvironmentConfig {
  logDirectory: string;
  rotationOptions?: {
    maxSize: string;
    maxFiles: string;
    datePattern: string;
    zippedArchive: boolean;
  };
}

export const DEFAULT_CLIENT_CONFIG: ClientConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableRemote: true,
  structured: true,
  colorize: true,
  timestamp: true,
  labels: {},
  batchSize: 50,
  flushInterval: 5000,
  maxRetries: 3
};

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  enableRemote: false,
  structured: true,
  colorize: true,
  timestamp: true,
  labels: {},
  logDirectory: 'logs'
}; 