// A simple logger utility

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const logLevel: LogLevel = LogLevel.DEBUG; // In a real app, this would be configurable

const logger = {
  debug: (...args: unknown[]) => {
    if (logLevel <= LogLevel.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (logLevel <= LogLevel.INFO) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (logLevel <= LogLevel.WARN) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (logLevel <= LogLevel.ERROR) {
      console.error('[ERROR]', ...args);
    }
  },
};

export default logger; 