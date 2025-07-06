// Logging utility for the game
// Can be controlled via environment variables or dev mode

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableDevMode: boolean;
}

class Logger {
  private config: LogConfig;

  constructor() {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: true,
      enableDevMode: import.meta.env?.DEV || false,
    };
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = import.meta.env?.VITE_LOG_LEVEL || "INFO";
    console.log("LOG LEVEL", level);
    switch (level.toUpperCase()) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "INFO":
        return LogLevel.INFO;
      case "DEBUG":
        return LogLevel.DEBUG;
      case "TRACE":
        return LogLevel.TRACE;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enableConsole && level <= this.config.level;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return `${prefix} ${message}`;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage("ERROR", message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("INFO", message), ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message), ...args);
    }
  }

  trace(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.log(this.formatMessage("TRACE", message), ...args);
    }
  }

  // Game-specific logging methods
  game(message: string, ...args: unknown[]): void {
    if (this.config.enableDevMode) {
      console.log(`🎮 ${message}`, ...args);
    }
  }

  dev(message: string, ...args: unknown[]): void {
    if (this.config.enableDevMode) {
      console.log(`🔧 ${message}`, ...args);
    }
  }

  audio(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🎵 ${message}`, ...args);
    }
  }

  coin(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🪙 ${message}`, ...args);
    }
  }

  bomb(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`💣 ${message}`, ...args);
    }
  }

  score(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`📊 ${message}`, ...args);
    }
  }

  // Method to disable all logging
  disable(): void {
    this.config.enableConsole = false;
  }

  // Method to enable logging
  enable(): void {
    this.config.enableConsole = true;
  }

  // Method to set log level
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  error: (message: string, ...args: unknown[]) =>
    logger.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  debug: (message: string, ...args: unknown[]) =>
    logger.debug(message, ...args),
  trace: (message: string, ...args: unknown[]) =>
    logger.trace(message, ...args),
  game: (message: string, ...args: unknown[]) => logger.game(message, ...args),
  dev: (message: string, ...args: unknown[]) => logger.dev(message, ...args),
  audio: (message: string, ...args: unknown[]) =>
    logger.audio(message, ...args),
  coin: (message: string, ...args: unknown[]) => logger.coin(message, ...args),
  bomb: (message: string, ...args: unknown[]) => logger.bomb(message, ...args),
  score: (message: string, ...args: unknown[]) =>
    logger.score(message, ...args),
};
