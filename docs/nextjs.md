# Next.js Integration Guide

This guide demonstrates how to integrate LogLog with Next.js applications.

## Setup

### Logger Configuration

```typescript
// lib/logger.ts
import { Logger, LogLevel } from 'loglog-core/client'; // Client-side bundle

// Client-side logger
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
```

### Server Logger Configuration

```typescript
// lib/server-logger.ts
import { Logger, LogLevel } from 'loglog-core/server'; // Server-side bundle

// Server-side logger
export const serverLogger = new Logger({
  environment: process.env.NODE_ENV || 'development',
  serverConfig: {
    enableConsole: true,
    enableFile: true,
    level: LogLevel.INFO,
    logDir: 'logs'
  }
});
```

### React Hook

```typescript
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
```

## Client Components

### Basic Usage

```typescript
// app/components/UserList.tsx
'use client';

import { useLogger } from '@/hooks/useLogger';
import { useState } from 'react';

export default function UserList() {
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
      logError(error as Error, { component: 'UserList' });
    }
  }

  return (
    <div>
      <button onClick={fetchUsers}>Load Users</button>
      {/* ... render users ... */}
    </div>
  );
}
```

### Form Handling

```typescript
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
      logEvent('User created');
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

## API Routes

### Client Log Collection

```typescript
// app/api/logs/route.ts
import { serverLogger as logger } from '@/lib/server-logger';

export async function POST(request: Request) {
  try {
    const logs = await request.json();
    logger.info('Received client logs', { count: logs.length });
    return Response.json({ success: true });
  } catch (error) {
    logger.error('Failed to process client logs', error as Error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### API Endpoint Logging

```typescript
// app/api/users/route.ts
import { serverLogger as logger } from '@/lib/server-logger';

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

## Error Boundary

```typescript
// app/components/ErrorBoundary.tsx
'use client';

import { useLogger } from '@/hooks/useLogger';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private logger = useLogger();

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.logger.logError(error, {
      ...errorInfo,
      component: 'ErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
``` 