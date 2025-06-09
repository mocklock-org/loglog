import { Logger, LogLevel, LoggerOptions } from './types';
import { ConsoleTransport } from './transports/console';
import { RemoteTransport } from './transports/remote';

export class ClientLogger extends Logger {
  constructor(options: LoggerOptions) {
    // Override any server-specific options
    const clientOptions = {
      ...options,
      clientConfig: {
        ...options.clientConfig,
        enableFile: false, // Always disable file logging in client
      }
    };

    super(clientOptions);

    // Only initialize browser-safe transports
    if (clientOptions.clientConfig?.enableConsole) {
      this.addTransport(new ConsoleTransport(clientOptions));
    }

    if (clientOptions.clientConfig?.enableRemote) {
      this.addTransport(new RemoteTransport(clientOptions));
    }
  }
}

export { LogLevel };
export type { LoggerOptions };

// Factory function for creating client logger
export function createLogger(options: LoggerOptions) {
  return new ClientLogger(options);
} 