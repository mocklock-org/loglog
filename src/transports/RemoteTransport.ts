import { LogEntry, LogTransport } from '../types';
import { ClientConfig } from '../types/environment';

export class RemoteTransport implements LogTransport {
  private queue: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private retryCount: number = 0;

  constructor(private config: ClientConfig) {
    this.startTimer();
  }

  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => this.flush(), this.config.flushInterval || 5000);
  }

  public log(entry: LogEntry): void {
    if (!this.config.enableRemote) return;
    
    this.queue.push(entry);
    if (this.queue.length >= (this.config.batchSize || 50)) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (!this.queue.length) return;

    const batch = this.queue.splice(0, this.config.batchSize || 50);
    
    try {
      const response = await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: batch,
          timestamp: new Date().toISOString(),
          labels: this.config.labels
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.statusText}`);
      }

      this.retryCount = 0;
    } catch (error) {
      this.retryCount++;
      if (this.retryCount <= (this.config.maxRetries || 3)) {
        // Put logs back in queue for retry
        this.queue.unshift(...batch);
        setTimeout(() => this.flush(), Math.pow(2, this.retryCount) * 1000);
      } else {
        console.error('Failed to send logs to remote endpoint:', error);
        // After max retries, log to console as fallback
        batch.forEach(entry => {
          console.error('[Remote Log Failed]', entry);
        });
      }
    }
  }

  public async cleanup(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
} 