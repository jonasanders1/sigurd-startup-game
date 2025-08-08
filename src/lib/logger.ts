// Logging utility for the game
// Can be controlled via environment variables or dev mode

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
  DATAPASSING = 5, // New level for data passing only
}

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableDevMode: boolean;
}

export class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private lastLogTime: Map<string, number> = new Map();
  private logThrottle: Map<string, number> = new Map();

  constructor(level: LogLevel = LogLevel.INFO) {
    // Read log level from environment variable
    const envLogLevel = import.meta.env?.VITE_LOG_LEVEL;
    if (envLogLevel) {
      switch (envLogLevel.toLowerCase()) {
        case 'error':
          this.logLevel = LogLevel.ERROR;
          break;
        case 'warn':
          this.logLevel = LogLevel.WARN;
          break;
        case 'info':
          this.logLevel = LogLevel.INFO;
          break;
        case 'debug':
          this.logLevel = LogLevel.DEBUG;
          break;
        case 'trace':
          this.logLevel = LogLevel.TRACE;
          break;
        case 'datapassing':
          this.logLevel = LogLevel.DATAPASSING;
          break;
        default:
          this.logLevel = level;
      }
    } else {
      this.logLevel = level;
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Throttled logging - only log once per specified interval
  private shouldLog(key: string, throttleMs: number = 1000): boolean {
    const now = Date.now();
    const lastTime = this.lastLogTime.get(key) || 0;
    
    if (now - lastTime >= throttleMs) {
      this.lastLogTime.set(key, now);
      return true;
    }
    return false;
  }

  // Game state events (important events that should always be logged)
  game(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`🎮 ${message}`, ...args);
    }
  }

  // Game flow events (level start, completion, etc.)
  flow(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`🌊 ${message}`, ...args);
    }
  }

  // Player actions (collecting items, dying, etc.)
  player(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`👤 ${message}`, ...args);
    }
  }

  // Monster events (spawning, dying, behavior changes)
  monster(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`👹 ${message}`, ...args);
    }
  }

  // Coin events (spawning, collecting)
  coin(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`🪙 ${message}`, ...args);
    }
  }

  // Bomb events (collecting, completing)
  bomb(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`💣 ${message}`, ...args);
    }
  }

  // Power mode events
  power(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`⚡ ${message}`, ...args);
    }
  }

  // Data passing events (data sent to external website)
  dataPassing(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.DATAPASSING) {
      console.log(`📡 ${message}`, ...args);
    }
  }

  // Pause/resume events (throttled to avoid spam)
  pause(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      const key = 'pause';
      if (this.shouldLog(key, 500)) { // Only log pause events every 500ms
        console.log(`⏸️ ${message}`, ...args);
      }
    }
  }

  // Scaling events (throttled to avoid spam)
  scaling(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      const key = 'scaling';
      if (this.shouldLog(key, 2000)) { // Only log scaling events every 2 seconds
        console.log(`📈 ${message}`, ...args);
      }
    }
  }

  // Debug info (only when debug level is enabled)
  debug(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`🔧 ${message}`, ...args);
    }
  }

  // Audio events
  audio(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`🎵 ${message}`, ...args);
    }
  }

  // Error events
  error(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  // Warning events
  warn(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  // Info events
  info(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  // Trace events (only when trace level is enabled)
  trace(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.TRACE) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  // Dev mode events (only when DEV_CONFIG.ENABLED is true)
  dev(message: string, ...args: any[]): void {
    // Only log dev messages when explicitly enabled
    // This prevents spam when DEV_CONFIG.ENABLED is false
    if (import.meta.env?.DEV && (window as any).__DEV_LOGGING_ENABLED__) {
      console.log(`🔧 ${message}`, ...args);
    }
  }

  // Score events
  score(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.TRACE) {
      console.log(`📊 ${message}`, ...args);
    }
  }

  // Clear throttled log timestamps
  clearThrottle(): void {
    this.lastLogTime.clear();
  }

  // Method to disable all logging
  disable(): void {
    this.logLevel = LogLevel.ERROR;
  }

  // Method to enable logging
  enable(): void {
    this.logLevel = LogLevel.INFO;
  }

  // Method to set log level
  setLevel(level: LogLevel): void {
    this.logLevel = level;
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
  dataPassing: (message: string, ...args: unknown[]) =>
    logger.dataPassing(message, ...args),
};
