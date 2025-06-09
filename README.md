# LogLog - Advanced Logging System

A scalable, framework-agnostic logging system with built-in support for Express.js and Next.js, featuring environment-specific configurations for both client and server-side logging.

## Features

- Environment-specific configurations (development, staging, production)
- Client-side and server-side logging support
- Remote logging with batching and retries for client-side
- File rotation and compression for server-side
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
    enableRemote: false,
    level: LogLevel.INFO,
    logDirectory: 'logs',
    structured: true,
    colorize: true,
    timestamp: true,
    labels: {
      app: 'my-server-app'
    },
    rotationOptions: {
      maxSize: '10m',
      maxFiles: '7d',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true
    }
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
    },
    batchSize: 50,
    flushInterval: 5000,
    maxRetries: 3
  }
});

logger.info('Application initialized', { version: '1.0.0' });
```

## Express.js Integration

```typescript
import express from 'express';
import { Logger, LogLevel, ExpressAdapter } from 'loglog-core';

const app = express();

// Initialize logger with server config
const logger = new Logger({
  environment: process.env.NODE_ENV || 'development',
  serverConfig: {
    enableConsole: true,
    enableFile: true,
    level: LogLevel.INFO,
    logDirectory: 'logs',
    structured: true
  }
});

// Setup logging adapter
const loggingAdapter = new ExpressAdapter({
  excludePaths: ['/health'],
  logBody: true,
  sensitiveHeaders: ['authorization'],
  sensitiveBodyFields: ['password']
});

loggingAdapter.initialize(logger);
app.use(express.json());
app.use(loggingAdapter.middleware());

// Example route with logging
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  req.context?.logger.info('Login attempt', { username }); // password automatically redacted
  res.json({ success: true });
});
```

## Next.js Integration

### Page Components (React)

```typescript
// lib/logger.ts
import { Logger, LogLevel } from 'loglog-core';

export const logger = new Logger({
  environment: process.env.NODE_ENV || 'development',
  clientConfig: {
    enableConsole: true,
    enableRemote: true,
    remoteEndpoint: '/api/logs',
    level: LogLevel.INFO,
    structured: true,
    labels: {
      app: 'next-app'
    }
  }
});

// hooks/useLogger.ts
import { useCallback } from 'react';
import { logger } from '../lib/logger';

export function useLogger() {
  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    logger.error('Client error', error, context);
  }, []);

  const logEvent = useCallback((event: string, data?: Record<string, any>) => {
    logger.info(event, data);
  }, []);

  return { logError, logEvent };
}

// app/users/page.tsx
'use client';

import { useLogger } from '@/hooks/useLogger';
import { useState } from 'react';

export default function UsersPage() {
  const { logEvent, logError } = useLogger();
  const [users, setUsers] = useState([]);

  async function fetchUsers() {
    try {
      logEvent('Fetching users');
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
      logEvent('Users fetched', { count: data.length });
    } catch (error) {
      logError(error as Error, { component: 'UsersPage' });
    }
  }

  return (
    <div>
      <button onClick={fetchUsers}>Load Users</button>
      {/* ... rest of the component */}
    </div>
  );
}

// app/components/UserForm.tsx
'use client';

import { useLogger } from '@/hooks/useLogger';
import { useState } from 'react';

export default function UserForm() {
  const { logEvent, logError } = useLogger();
  const [status, setStatus] = useState('idle');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('submitting');
    
    try {
      logEvent('User form submitted');
      const formData = new FormData(event.target as HTMLFormElement);
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Submission failed');
      
      setStatus('success');
      logEvent('User created', { success: true });
    } catch (error) {
      setStatus('error');
      logError(error as Error, { 
        component: 'UserForm',
        action: 'submit' 
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" required />
      <button type="submit" disabled={status === 'submitting'}>
        Create User
      </button>
    </form>
  );
}
```

### API Routes

```typescript
// app/api/logs/route.ts
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const logs = await request.json();
    // Process client-side logs
    // You might want to store these in a database or forward to a logging service
    logger.info('Received client logs', { count: logs.length });
    return Response.json({ success: true });
  } catch (error) {
    logger.error('Failed to process client logs', error as Error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// app/api/users/route.ts
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Fetching users');
    const users = await db.users.findMany();
    return Response.json(users);
  } catch (error) {
    logger.error('Failed to fetch users', error as Error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    logger.info('Creating user', { data });
    const user = await db.users.create({ data });
    return Response.json(user);
  } catch (error) {
    logger.error('Failed to create user', error as Error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

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

