import { NextResponse } from 'next/server';
import { ServerLogger } from 'loglog-core/server';

export async function errorHandler(logger: ServerLogger) {
  logger.error('Error during processing', new Error('Simulated server error'), {
    action: 'error',
    errorCode: 'SIMULATION_ERROR'
  });
  
  return NextResponse.json(
    { status: 'error', message: 'Server error occurred' },
    { status: 500 }
  );
} 