import { NextApiRequest, NextApiResponse } from 'next';
import { Logger, LogLevel, NextjsAdapter } from '../src';

// Create a logger instance
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
  },
  defaultContext: {
    service: 'my-nextjs-app',
    environment: process.env.NODE_ENV
  }
});

// Create and initialize the Next.js adapter
const loggingAdapter = new NextjsAdapter({
  excludePaths: ['/api/health'],
  logBody: true,
  logHeaders: true,
  sensitiveHeaders: ['authorization', 'x-api-key'],
  sensitiveBodyFields: ['password', 'token']
});

loggingAdapter.initialize(logger);

// Example API route handler with logging
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply the logging middleware
  await loggingAdapter.middleware()(req, res);

  try {
    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 100));

    if (req.method === 'POST') {
      // Example of handling a POST request
      const { username } = req.body;

      if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      // Example response
      res.status(201).json({
        id: 123,
        username,
        createdAt: new Date().toISOString()
      });
    } else {
      // Handle other methods
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logger.error('Error handling request', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Example of using the logger in a Next.js API route with custom middleware
export function withLogging(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Apply logging middleware
    await loggingAdapter.middleware()(req, res);

    // Call the original handler
    return handler(req, res);
  };
}

// Example of using the withLogging HOC
export const protectedRoute = withLogging(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Example of authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Example of a protected operation
    const result = await someProtectedOperation();
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in protected route', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example protected operation
async function someProtectedOperation() {
  return {
    data: 'sensitive data',
    timestamp: new Date().toISOString()
  };
} 