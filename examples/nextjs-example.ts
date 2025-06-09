import { NextApiRequest, NextApiResponse } from 'next';
import { Logger, LogLevel, NextjsAdapter } from '../src';

// Initialize logger with environment-specific config
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
      app: 'my-nextjs-app'
    }
  }
});

// Setup logging adapter
const loggingAdapter = new NextjsAdapter({
  excludePaths: ['/api/health'],
  logBody: true,
  sensitiveHeaders: ['authorization'],
  sensitiveBodyFields: ['password']
});

loggingAdapter.initialize(logger);

// Example API route with logging
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply logging middleware
  await loggingAdapter.middleware()(req, res);

  try {
    if (req.method === 'POST') {
      const { username } = req.body;
      res.status(200).json({ success: true, username });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logger.error('Request failed', error as Error);
    res.status(500).json({ error: 'Internal error' });
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