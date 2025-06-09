import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import type { ClientLogger } from './client';
import type { LoggerOptions } from './types';

const LoggerContext = createContext<ClientLogger | null>(null);
LoggerContext.displayName = 'LoggerContext';

export function useLogger() {
  const logger = useContext(LoggerContext);

  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    if (logger) {
      logger.error('Client error', error, context);
    }
  }, [logger]);

  const logEvent = useCallback((event: string, data?: Record<string, any>) => {
    if (logger) {
      logger.info(event, data);
    }
  }, [logger]);

  return { logError, logEvent };
}

interface LoggerProviderProps {
  children: ReactNode;
}

export function createLoggerProvider(logger: ClientLogger) {
  return function LoggerProvider({ children }: LoggerProviderProps) {
    const value = useMemo(() => logger, [logger]);
    return (
      <LoggerContext.Provider value={value}>
        {children}
      </LoggerContext.Provider>
    );
  };
}

export { LoggerContext };
export type { LoggerOptions }; 