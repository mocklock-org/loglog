import { ClientLogger, LogLevel } from 'loglog-core/client';

export const logger = new ClientLogger({
  environment: process.env.NODE_ENV || 'development',
  clientConfig: {
    enableConsole: true,
    enableRemote: true,
    level: LogLevel.INFO,
    structured: true,
    colorize: true,
    timestamp: true,
    labels: {
      app: 'loglog-demo'
    }
  }
}); 


