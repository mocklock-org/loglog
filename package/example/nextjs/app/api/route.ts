import { NextResponse } from 'next/server';
import { ServerLogger, LogLevel } from 'loglog-core/server';
import {
  processHandler,
  errorHandler,
  warningHandler,
  debugHandler
} from './handlers';

const logger = new ServerLogger({
  environment: process.env.NODE_ENV || 'development',
  serverConfig: {
    enableConsole: true,
    enableFile: true,
    level: LogLevel.INFO,
    logDir: 'logs',
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    logger.info('Received API request', { action, payload });

    // Map actions to handlers
    const handlers = {
      process: processHandler,
      error: errorHandler,
      warning: warningHandler,
      debug: debugHandler
    };

    const handler = handlers[action as keyof typeof handlers];

    if (handler) {
      return await handler(logger);
    }

    logger.warn('Unknown action requested', { action });
    return NextResponse.json(
      { status: 'error', message: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Unexpected error in API route', error as Error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
