# LogLog - Advanced Logging System

A scalable, framework-agnostic logging system with built-in support for Express.js and Next.js.

## Features

- 🚀 Framework agnostic core with framework-specific adapters
- 📝 Structured logging with JSON support
- 🔄 Log rotation and compression
- 🔍 Request/response logging middleware
- 🔒 Sensitive data redaction
- 📊 OpenTelemetry integration
- ⚡ Performance timing
- 🎨 Colorized console output
- 🔧 Highly configurable

## Installation

```bash
npm install @loglog/core
```

For framework-specific features, ensure you have the necessary peer dependencies:

```bash
# For Express.js
npm install express

# For Next.js
npm install next
```

## Basic Usage

```typescript
import { Logger, LogLevel } from '@loglog/core';

const logger = new Logger({
  level: LogLevel.DEBUG,
  logToFile: true,
  logFilePath: 'logs/app-%DATE%.log',
  structured: true,
  rotationOptions: {
    maxSize: '10m',
    maxFiles: '7d',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true
  }
});

logger.info('Application started');
logger.debug('Debug message', { userId: 123 });
logger.error('Error occurred', new Error('Something went wrong'));
```

## Express.js Integration

```typescript
import express from 'express';
import { Logger, LogLevel, ExpressAdapter } from '@loglog/core';

const app = express();
const logger = new Logger({
  level: LogLevel.INFO,
  structured: true
});

const loggingAdapter = new ExpressAdapter({
  excludePaths: ['/health'],
  logBody: true,
  logHeaders: true,
  sensitiveHeaders: ['authorization'],
  sensitiveBodyFields: ['password']
});

loggingAdapter.initialize(logger);
app.use(loggingAdapter.middleware());

app.post('/api/users', (req, res) => {
  try {
    // Your route handler code
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to create user', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Next.js Integration

### API Routes

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { Logger, LogLevel, NextjsAdapter } from '@loglog/core';

const logger = new Logger({
  level: LogLevel.INFO,
  structured: true
});

const loggingAdapter = new NextjsAdapter({
  excludePaths: ['/api/health'],
  logBody: true
});

loggingAdapter.initialize(logger);

// Create a HOC for logging
export function withLogging(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await loggingAdapter.middleware()(req, res);
    return handler(req, res);
  };
}

// Use in your API route
export default withLogging(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Your API route code
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('API error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### App Router (Next.js 13+)

```typescript
// app/api/logger.ts
import { Logger, LogLevel } from '@loglog/core';

export const logger = new Logger({
  level: LogLevel.INFO,
  structured: true,
  defaultContext: {
    service: 'my-nextjs-app'
  }
});

// app/api/users/route.ts
import { logger } from '../logger';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    logger.info('Creating user', { data });
    
    // Your route logic here
    
    return Response.json({ success: true });
  } catch (error) {
    logger.error('Failed to create user', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Advanced Configuration

### Custom Transport

```typescript
import { Logger, LogTransport, LogEntry } from '@loglog/core';

const customTransport: LogTransport = {
  log: (entry: LogEntry) => {
    // Send logs to your custom destination
    console.log(`[Custom] ${entry.level}: ${entry.message}`);
  }
};

const logger = new Logger({
  level: LogLevel.INFO
});

logger.addTransport(customTransport);
```

### Performance Timing

```typescript
const logger = new Logger();

async function performOperation() {
  return logger.time(
    'Operation completed',
    async () => {
      // Your async operation here
      await someAsyncWork();
      return result;
    },
    { operation: 'important_task' }
  );
}
```

### Context Propagation

```typescript
const logger = new Logger();

function processUser(userId: string) {
  const userLogger = logger.withContext({ userId });
  userLogger.info('Processing user');
  
  // All logs will include userId in context
  userLogger.debug('User details fetched');
}
```

## Creating Custom Adapters

You can create adapters for other frameworks by implementing the `LoggingAdapter` interface:

```typescript
import { LoggingAdapter, Logger, RequestInfo, ResponseInfo } from '@loglog/core';

export class CustomAdapter implements LoggingAdapter {
  initialize(logger: Logger): void {
    // Initialize your adapter
  }

  createRequestLogger(requestInfo: RequestInfo): Logger {
    // Create a logger instance for the request
  }

  logRequest(logger: Logger, requestInfo: RequestInfo): void {
    // Log request information
  }

  logResponse(logger: Logger, responseInfo: ResponseInfo): void {
    // Log response information
  }

  // ... implement other required methods
}
```

