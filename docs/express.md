# Express.js Integration Guide

This guide demonstrates how to integrate LogLog with Express.js applications.

## Basic Setup

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
    logDir: 'logs'
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
```

## Route Logging

### Basic Route Logging

```typescript
app.get('/api/users', (req, res) => {
  req.context?.logger.info('Fetching users');
  // Your route logic here
  res.json({ users: [] });
});
```

### Error Handling

```typescript
app.post('/api/users', async (req, res) => {
  const logger = req.context?.logger;
  
  try {
    logger?.info('Creating user', { data: req.body });
    // Your creation logic here
    res.json({ success: true });
  } catch (error) {
    logger?.error('Failed to create user', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Request Context

```typescript
app.use((req, res, next) => {
  if (req.context?.logger) {
    // Add custom context to all subsequent logs
    req.context.logger = req.context.logger.withContext({
      userId: req.headers['x-user-id'],
      ip: req.ip
    });
  }
  next();
});
```

## Performance Monitoring

```typescript
app.get('/api/data', async (req, res) => {
  const logger = req.context?.logger;
  
  try {
    const result = await logger?.time(
      'Data fetch completed',
      async () => {
        // Your async operation here
        return await fetchData();
      },
      { endpoint: '/api/data' }
    );
    
    res.json(result);
  } catch (error) {
    logger?.error('Data fetch failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Custom Middleware Integration

```typescript
import { getRequestLogger } from 'loglog-core';

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const logger = getRequestLogger(req);
  
  try {
    // Your auth logic here
    logger.info('User authenticated');
    next();
  } catch (error) {
    logger.error('Authentication failed', error as Error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.use('/api/protected', authMiddleware);
```

## Error Handling Middleware

```typescript
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const logger = req.context?.logger;
  
  logger?.error('Unhandled error', error, {
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ error: 'Internal server error' });
});
``` 