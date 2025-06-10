import { NextResponse } from 'next/server';
import { ServerLogger } from 'loglog-core/server';

export async function warningHandler(logger: ServerLogger) {
  logger.warn('Resource usage high', {
    action: 'warning',
    cpuUsage: '85%',
    memoryUsage: '75%'
  });
  
  return NextResponse.json({ 
    status: 'warning', 
    message: 'Resource usage warning' 
  });
} 