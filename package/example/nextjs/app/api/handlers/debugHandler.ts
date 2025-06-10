import { NextResponse } from 'next/server';
import { ServerLogger } from 'loglog-core/server';

export async function debugHandler(logger: ServerLogger) {
  logger.debug('Detailed system state', {
    action: 'debug',
    systemInfo: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  });
  
  return NextResponse.json({ 
    status: 'success', 
    message: 'Debug info logged' 
  });
} 