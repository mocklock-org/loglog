import { LoggerOptions, LogLevel, LogEntry } from '../types';
import chalk from 'chalk';

export class ConsoleTransport {
  private options: LoggerOptions;

  constructor(options: LoggerOptions) {
    this.options = options;
  }

  log(entry: LogEntry): void {
    const timestamp = new Date().toISOString();
    const level = entry.level.toUpperCase();
    const message = this.formatMessage(entry);
    
    if (this.options.clientConfig?.colorize) {
      this.logWithColor(level, timestamp, message);
    } else {
      console.log(`[${timestamp}] ${level}: ${message}`);
    }
  }

  private formatMessage(entry: LogEntry): string {
    const { message, data } = entry;
    return data ? `${message} ${JSON.stringify(data)}` : message;
  }

  private logWithColor(level: string, timestamp: string, message: string): void {
    const colorMap = {
      [LogLevel.ERROR]: chalk.red,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.INFO]: chalk.blue,
      [LogLevel.DEBUG]: chalk.gray
    };

    const color = colorMap[level.toLowerCase() as LogLevel] || chalk.white;
    console.log(`[${timestamp}] ${color(level)}: ${message}`);
  }
} 