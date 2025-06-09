# LogLog - Advanced Logging System

A scalable, framework-agnostic logging system with built-in support for Express.js and Next.js, featuring environment-specific configurations for both client and server-side logging.

## Features

- Environment-specific configurations (development, staging, production)
- Client-side and server-side logging support
- Remote logging for client-side
- File rotation for server-side
- Framework-specific adapters (Express.js, Next.js)
- Structured logging with JSON support
- Sensitive data redaction
- OpenTelemetry integration
- Performance timing
- Colorized console output

## Installation

```bash
npm install loglog-core
```

## Basic Usage

### Server-Side Logging

```typescript
import { Logger, LogLevel } from 'loglog-core';

const logger = new Logger({
  environment: process.env.NODE_ENV || 'development',
  serverConfig: {
    enableConsole: true,
    enableFile: true,
    level: LogLevel.INFO,
    logDir: 'logs'
  }
});

logger.info('Server started', { port: 3000 });
logger.error('Error occurred', new Error('Something went wrong'));
```

### Client-Side Logging

```typescript
import { Logger, LogLevel } from 'loglog-core';

const logger = new Logger({
  environment: process.env.NODE_ENV || 'development',
  clientConfig: {
    enableConsole: true,
    enableFile: false,
    enableRemote: true,
    remoteEndpoint: '/api/logs',
    level: LogLevel.INFO,
    structured: true,
    colorize: true,
    timestamp: true,
    labels: {
      app: 'my-client-app'
    }
  }
});

logger.info('Application initialized', { version: '1.0.0' });
```

## Framework Integration

For detailed framework-specific integration guides, please refer to:

- [Express.js Integration Guide](./docs/express.md)
- [Next.js Integration Guide](./docs/nextjs.md)

## Advanced Features

### Context Propagation

```typescript
const logger = new Logger();

// Add context that will be included in all subsequent logs
const userLogger = logger.withContext({ userId: '123' });
userLogger.info('Processing user'); // Includes userId in context
```

### Performance Timing

```typescript
const logger = new Logger();

// Automatically time async operations
const result = await logger.time(
  'Database query completed',
  async () => await db.query('SELECT * FROM users'),
  { operation: 'user_query' }
);
```

### Cleanup

```typescript
const logger = new Logger();

// Clean up resources and flush pending logs
await logger.cleanup();
```

## Creating Custom Adapters

```typescript
import { LoggingAdapter, Logger, RequestInfo, ResponseInfo } from 'loglog-core';

export class CustomAdapter implements LoggingAdapter {
  initialize(logger: Logger): void {
    // Initialize adapter
  }

  createRequestLogger(requestInfo: RequestInfo): Logger {
    // Create request-specific logger
  }

  logRequest(logger: Logger, requestInfo: RequestInfo): void {
    // Log request details
  }

  logResponse(logger: Logger, responseInfo: ResponseInfo): void {
    // Log response details
  }
}
```

