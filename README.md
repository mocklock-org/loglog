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

Choose your preferred package manager:

```bash
# Using npm
npm install loglog-core

# Using yarn
yarn add loglog-core

# Using pnpm
pnpm install loglog-core
```

For CLI usage, install globally:

```bash
# Using npm
npm install -g loglog-core

# Using yarn
yarn global add loglog-core

# Using pnpm
pnpm add -g loglog-core
```

## CLI Commands

LogLog comes with a command-line interface that helps you manage and analyze your logs. Install globally to use the CLI:

```bash
npm install -g loglog-core
```

Available commands:

```bash
# Initialize LogLog configuration in your project
loglog init

# View real-time log stream with optional filtering
loglog tail [--level=<level>] [--format=json|text] [--filter=<pattern>]

# Search through log files
loglog search <pattern> [--from=<date>] [--to=<date>] [--level=<level>]

# Rotate log files manually
loglog rotate

# View log statistics and summaries
loglog stats [--from=<date>] [--to=<date>]

# Validate LogLog configuration
loglog validate

# Clear log files (with confirmation)
loglog clear [--older-than=<days>]
```

### CLI Examples

```bash
# Watch INFO and above logs in real-time
loglog tail --level=info

# Search for error logs from last 24 hours
loglog search "error" --from="24h"

# View log statistics for the current month
loglog stats --from="1M"

# Rotate logs that are older than 7 days
loglog rotate --older-than=7

# Clear all logs older than 30 days
loglog clear --older-than=30
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

