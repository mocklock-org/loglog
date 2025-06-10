import { useCallback } from 'react';
import { logger } from '../lib/logger';

export function useLogger() {
  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    logger.error('Client error', error, context);
  }, []);

  const logInfo = useCallback((message: string, data?: Record<string, any>) => {
    logger.info(message, data);
  }, []);

  const logWarning = useCallback((message: string, data?: Record<string, any>) => {
    logger.warn(message, data);
  }, []);

  const logDebug = useCallback((message: string, data?: Record<string, any>) => {
    logger.debug(message, data);
  }, []);

  return { logError, logInfo, logWarning, logDebug };
} 