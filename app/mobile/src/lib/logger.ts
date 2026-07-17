/**
 * Structured logger for the mobile app.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = __DEV__;
  }

  private log(level: LogLevel, message: string, ...data: any[]) {
    if (this.isDev) {
      const prefix = `[${level.toUpperCase()}] ${new Date().toISOString()}`;
      console[level === 'debug' ? 'log' : level](prefix, message, ...data);
    }
  }

  debug(message: string, ...data: any[]) { this.log('debug', message, ...data); }
  info(message: string, ...data: any[]) { this.log('info', message, ...data); }
  warn(message: string, ...data: any[]) { this.log('warn', message, ...data); }
  error(message: string, ...data: any[]) { this.log('error', message, ...data); }
}

export const logger = new Logger();
export default logger;