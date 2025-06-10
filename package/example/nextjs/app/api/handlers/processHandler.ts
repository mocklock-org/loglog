import { NextResponse } from 'next/server';
import { ServerLogger } from 'loglog-core/server';

export async function processHandler(logger: ServerLogger) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  logger.info('Processing completed', { 
    duration: '1.5s',
    action: 'process',
    result: 'success'
  });
  
  return NextResponse.json({ 
    status: 'success', 
    message: 'Processing completed' 
  });
} 