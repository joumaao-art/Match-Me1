/**
 * Structured logger utility.
 * Provides consistent logging with levels and context.
 * In production, this could be connected to an external service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  private log(level: LogLevel, message: string, ...data: any[]) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data: data.length > 0 ? data : undefined,
    };

    if (this.isDev) {
      const styles: Record<LogLevel, string> = {
        debug: 'color: #6b7280',
        info: 'color: #2563eb',
        warn: 'color: #d97706',
        error: 'color: #dc2626',
      };

      console[level === 'debug' ? 'log' : level](
        `%c[${level.toUpperCase()}] ${entry.timestamp}`,
        styles[level],
        message,
        ...data
      );
    }

    // In production, send to external logging service
    if (level === 'error' && !this.isDev) {
      this.reportError(entry);
    }
  }

  debug(message: string, ...data: any[]) {
    this.log('debug', message, ...data);
  }

  info(message: string, ...data: any[]) {
    this.log('info', message, ...data);
  }

  warn(message: string, ...data: any[]) {
    this.log('warn', message, ...data);
  }

  error(message: string, ...data: any[]) {
    this.log('error', message, ...data);
  }

  private reportError(_entry: LogEntry) {
    // Placeholder for external error reporting (Sentry, etc.)
  }
}

export const logger = new Logger();
export default logger;