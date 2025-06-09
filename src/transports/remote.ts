import { LoggerOptions, LogEntry } from '../types';

export class RemoteTransport {
  private options: LoggerOptions;
  private queue: LogEntry[] = [];
  private batchSize: number = 50;
  private flushInterval: number = 5000;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: LoggerOptions) {
    this.options = options;
    this.startTimer();
  }

  log(entry: LogEntry): void {
    this.queue.push(entry);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const logs = this.queue.slice();
    this.queue = [];

    try {
      await fetch(this.options.clientConfig?.remoteEndpoint || '/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs)
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-queue failed logs
      this.queue = [...logs, ...this.queue];
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }
} 