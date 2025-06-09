import { LoggerOptions, LogEntry } from '../types';
import { createStream } from 'rotating-file-stream';
import { join } from 'path';

export class FileTransport {
  private stream: ReturnType<typeof createStream>;

  constructor(options: LoggerOptions) {
    const logDir = options.serverConfig?.logDir || 'logs';
    this.stream = createStream('app.log', {
      path: logDir,
      size: '10M',
      interval: '1d',
      compress: 'gzip'
    });
  }

  log(entry: LogEntry): void {
    const logLine = JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      data: entry.data
    }) + '\n';
    
    this.stream.write(logLine);
  }
} 