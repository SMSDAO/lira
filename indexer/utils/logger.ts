/**
 * Logger utility for indexer
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVELS: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = LOG_LEVELS[level] || LogLevel.INFO;
  }

  private log(level: LogLevel, ...args: any[]) {
    if (level >= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      console.log(`[${timestamp}] [${levelName}]`, ...args);
    }
  }

  debug(...args: any[]) {
    this.log(LogLevel.DEBUG, ...args);
  }

  info(...args: any[]) {
    this.log(LogLevel.INFO, ...args);
  }

  warn(...args: any[]) {
    this.log(LogLevel.WARN, ...args);
  }

  error(...args: any[]) {
    this.log(LogLevel.ERROR, ...args);
  }
}

export const logger = new Logger(process.env.INDEXER_LOG_LEVEL || 'info');
