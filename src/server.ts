import { Logger, LogLevel, LoggerOptions } from './types';
import { ConsoleTransport } from './transports/console';
import { FileTransport } from './transports/file';

export class ServerLogger extends Logger {
  constructor(options: LoggerOptions) {
    super(options);

    // Initialize all server-side transports
    if (options.serverConfig?.enableConsole) {
      this.addTransport(new ConsoleTransport(options));
    }

    if (options.serverConfig?.enableFile) {
      this.addTransport(new FileTransport(options));
    }
  }
}

export { LogLevel };
export type { LoggerOptions };

// Factory function for creating server logger
export function createLogger(options: LoggerOptions) {
  return new ServerLogger(options);
} 