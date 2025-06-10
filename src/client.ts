import { Logger, LogLevel, LoggerOptions } from './types';
import { ConsoleTransport } from './transports/console';
import { RemoteTransport } from './transports/remote';

export class ClientLogger extends Logger {
  constructor(options: LoggerOptions) {
    const clientOptions = {
      ...options,
      clientConfig: {
        ...options.clientConfig,
        enableFile: false,
      }
    };

    super(clientOptions);

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

export function createLogger(options: LoggerOptions) {
  return new ClientLogger(options);
} 