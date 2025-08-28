// Advanced logging utility for the game with powerful filtering capabilities
// Can be controlled via environment variables, dev mode, or runtime console commands

export enum LogLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

export enum LogCategory {
  AUDIO = "audio",
  PLAYER = "player",
  MONSTER = "monster",
  COIN = "coin",
  BOMB = "bomb",
  POWER = "power",
  LEVEL = "level",
  SCORE = "score",
  GAME = "game",
  INPUT = "input",
  RENDER = "render",
  PHYSICS = "physics",
  SPAWN = "spawn",
  COLLISION = "collision",
  PERFORMANCE = "performance",
  DATA = "data",
  ASSET = "asset",
  DEBUG = "debug",
}

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any[];
}

interface LoggerConfig {
  level: LogLevel;
  enabledCategories: Set<LogCategory>;
  showTimestamp: boolean;
  showCategory: boolean;
  useColors: boolean;
  buffer: boolean;
  bufferSize: number;
}

// Category icons for visual distinction
const CATEGORY_ICONS: Record<LogCategory, string> = {
  [LogCategory.AUDIO]: "🎵",
  [LogCategory.PLAYER]: "👤",
  [LogCategory.MONSTER]: "👹",
  [LogCategory.COIN]: "🪙",
  [LogCategory.BOMB]: "💣",
  [LogCategory.POWER]: "⚡",
  [LogCategory.LEVEL]: "🏁",
  [LogCategory.SCORE]: "📊",
  [LogCategory.GAME]: "🎮",
  [LogCategory.INPUT]: "⌨️",
  [LogCategory.RENDER]: "🎨",
  [LogCategory.PHYSICS]: "⚙️",
  [LogCategory.SPAWN]: "✨",
  [LogCategory.COLLISION]: "💥",
  [LogCategory.PERFORMANCE]: "📈",
  [LogCategory.DATA]: "📡",
  [LogCategory.ASSET]: "📦",
  [LogCategory.DEBUG]: "🔧",
};

// Category colors for console output
const CATEGORY_COLORS: Record<LogCategory, string> = {
  [LogCategory.AUDIO]: "#FF6B6B", // Red
  [LogCategory.PLAYER]: "#4ECDC4", // Teal
  [LogCategory.MONSTER]: "#8B4513", // Brown
  [LogCategory.COIN]: "#FFD700", // Gold
  [LogCategory.BOMB]: "#FF4500", // Orange Red
  [LogCategory.POWER]: "#9370DB", // Medium Purple
  [LogCategory.LEVEL]: "#32CD32", // Lime Green
  [LogCategory.SCORE]: "#1E90FF", // Dodger Blue
  [LogCategory.GAME]: "#FF69B4", // Hot Pink
  [LogCategory.INPUT]: "#708090", // Slate Gray
  [LogCategory.RENDER]: "#FF1493", // Deep Pink
  [LogCategory.PHYSICS]: "#4169E1", // Royal Blue
  [LogCategory.SPAWN]: "#00CED1", // Dark Turquoise
  [LogCategory.COLLISION]: "#DC143C", // Crimson
  [LogCategory.PERFORMANCE]: "#228B22", // Forest Green
  [LogCategory.DATA]: "#4682B4", // Steel Blue
  [LogCategory.ASSET]: "#D2691E", // Chocolate
  [LogCategory.DEBUG]: "#696969", // Dim Gray
};

export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private throttleTimers: Map<string, number> = new Map();

  constructor() {
    // Initialize with default config
    this.config = {
      level: this.getInitialLogLevel(),
      enabledCategories: new Set(Object.values(LogCategory)),
      showTimestamp: false,
      showCategory: true,
      useColors: true,
      buffer: false,
      bufferSize: 1000,
    };

    // Parse enabled categories from environment
    this.parseEnabledCategories();

    // Setup browser console commands
    this.setupConsoleCommands();
  }

  private getInitialLogLevel(): LogLevel {
    const envLogLevel = import.meta.env?.VITE_LOG_LEVEL;
    if (envLogLevel) {
      switch (envLogLevel.toLowerCase()) {
        case "off":
          return LogLevel.OFF;
        case "error":
          return LogLevel.ERROR;
        case "warn":
          return LogLevel.WARN;
        case "info":
          return LogLevel.INFO;
        case "debug":
          return LogLevel.DEBUG;
        case "trace":
          return LogLevel.TRACE;
        default:
          return LogLevel.INFO;
      }
    }
    return import.meta.env?.DEV ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private parseEnabledCategories(): void {
    const envCategories = import.meta.env?.VITE_LOG_CATEGORIES;
    if (envCategories) {
      if (envCategories === "none") {
        this.config.enabledCategories.clear();
      } else if (envCategories !== "all") {
        const categories = envCategories
          .split(",")
          .map((c: string) => c.trim().toLowerCase());
        this.config.enabledCategories = new Set(
          categories
            .map((c) => Object.values(LogCategory).find((cat) => cat === c))
            .filter(Boolean) as LogCategory[]
        );
      }
    }
  }

  private setupConsoleCommands(): void {
    if (typeof window !== "undefined") {
      // Expose logger instance for console access
      (window as any).gameLog = {
        // Enable/disable categories
        enable: (category: string) =>
          this.enableCategory(category as LogCategory),
        disable: (category: string) =>
          this.disableCategory(category as LogCategory),
        only: (category: string) => this.showOnly(category as LogCategory),
        all: () => this.enableAll(),
        none: () => this.disableAll(),

        // Log level control
        setLevel: (level: string) => this.setLogLevel(level),

        // View configuration
        showConfig: () => this.showConfig(),
        categories: () => this.listCategories(),

        // Filtering presets
        player: () => this.showOnly(LogCategory.PLAYER),
        audio: () => this.showOnly(LogCategory.AUDIO),
        bombs: () =>
          this.enableCategories([
            LogCategory.BOMB,
            LogCategory.PLAYER,
            LogCategory.SCORE,
          ]),
        coins: () =>
          this.enableCategories([
            LogCategory.COIN,
            LogCategory.PLAYER,
            LogCategory.SCORE,
          ]),
        gameplay: () =>
          this.enableCategories([
            LogCategory.PLAYER,
            LogCategory.MONSTER,
            LogCategory.COIN,
            LogCategory.BOMB,
            LogCategory.POWER,
            LogCategory.SCORE,
          ]),
        technical: () =>
          this.enableCategories([
            LogCategory.RENDER,
            LogCategory.PHYSICS,
            LogCategory.PERFORMANCE,
            LogCategory.SPAWN,
            LogCategory.COLLISION,
          ]),

        // Category-specific filters (singular names as aliases)
        coin: () => this.showOnly(LogCategory.COIN),
        bomb: () => this.showOnly(LogCategory.BOMB),
        monster: () => this.showOnly(LogCategory.MONSTER),
        power: () => this.showOnly(LogCategory.POWER),
        level: () => this.showOnly(LogCategory.LEVEL),
        score: () => this.showOnly(LogCategory.SCORE),
        game: () => this.showOnly(LogCategory.GAME),
        input: () => this.showOnly(LogCategory.INPUT),
        render: () => this.showOnly(LogCategory.RENDER),
        physics: () => this.showOnly(LogCategory.PHYSICS),
        spawn: () => this.showOnly(LogCategory.SPAWN),
        collision: () => this.showOnly(LogCategory.COLLISION),
        performance: () => this.showOnly(LogCategory.PERFORMANCE),
        data: () => this.showOnly(LogCategory.DATA),
        asset: () => this.showOnly(LogCategory.ASSET),
        
        // Coin spawning specific filter (shows coin + spawn + data logs)
        coinSpawn: () =>
          this.enableCategories([
            LogCategory.COIN,
            LogCategory.SPAWN,
            LogCategory.DATA,
          ]),

        // Utility
        clear: () => console.clear(),
        help: () => this.showHelp(),
      };

      // Log the availability of console commands
      if (import.meta.env?.DEV) {
        console.log(
          "%c🎮 Game Logger Ready!",
          "color: #4ECDC4; font-size: 14px; font-weight: bold;"
        );
        console.log(
          "%cType gameLog.help() for available commands",
          "color: #888; font-size: 12px;"
        );
        console.log(
          "%cYou can also use log.data() for data-passing logs",
          "color: #888; font-size: 12px;"
        );
        console.log(
          "%cUse gameLog.coinSpawn() to debug coin spawning logic",
          "color: #888; font-size: 12px;"
        );
      }
    }
  }

  private showHelp(): void {
    console.log(
      "%c📚 Game Logger Commands",
      "color: #4ECDC4; font-size: 16px; font-weight: bold;"
    );
    console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");

    console.log("%c🎯 Quick Filters:", "color: #FFD700; font-weight: bold;");
    console.log("  gameLog.player()    - Show only player logs");
    console.log("  gameLog.audio()     - Show only audio logs");
    console.log("  gameLog.bombs()     - Show bomb progression");
    console.log("  gameLog.coins()     - Show coin collection");
    console.log("  gameLog.coinSpawn() - Show coin spawn debugging");
    console.log("  gameLog.gameplay()  - Show all gameplay logs");
    console.log("  gameLog.technical() - Show technical logs");
    console.log("  gameLog.coin()      - Show only coin logs (singular)");
    console.log("  gameLog.bomb()      - Show only bomb logs (singular)");

    console.log(
      "%c\n🔧 Category Control:",
      "color: #FFD700; font-weight: bold;"
    );
    console.log('  gameLog.enable("audio")     - Enable a category');
    console.log('  gameLog.disable("audio")    - Disable a category');
    console.log('  gameLog.only("player")      - Show only one category');
    console.log("  gameLog.all()               - Enable all categories");
    console.log("  gameLog.none()              - Disable all categories");
    console.log("  gameLog.categories()        - List all categories");

    console.log("%c\n📊 Log Level:", "color: #FFD700; font-weight: bold;");
    console.log(
      '  gameLog.setLevel("debug")   - Set log level (off/error/warn/info/debug/trace)'
    );

    console.log("%c\n🔍 Utility:", "color: #FFD700; font-weight: bold;");
    console.log("  gameLog.showConfig()        - Show current configuration");
    console.log("  gameLog.clear()             - Clear console");
    console.log("  gameLog.help()              - Show this help");

    console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
  }

  private listCategories(): void {
    console.log(
      "%c📂 Available Categories",
      "color: #4ECDC4; font-size: 14px; font-weight: bold;"
    );
    console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");

    Object.values(LogCategory).forEach((category) => {
      const icon = CATEGORY_ICONS[category];
      const enabled = this.config.enabledCategories.has(category);
      const status = enabled ? "✅" : "❌";
      console.log(`  ${status} ${icon} ${category}`);
    });
  }

  private showConfig(): void {
    console.log(
      "%c⚙️ Logger Configuration",
      "color: #4ECDC4; font-size: 14px; font-weight: bold;"
    );
    console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
    console.log(`  Log Level: ${LogLevel[this.config.level]}`);
    console.log(
      `  Enabled Categories: ${this.config.enabledCategories.size}/${
        Object.values(LogCategory).length
      }`
    );
    console.log(`  Show Timestamp: ${this.config.showTimestamp}`);
    console.log(`  Show Category: ${this.config.showCategory}`);
    console.log(`  Use Colors: ${this.config.useColors}`);
  }

  // Category management methods
  public enableCategory(category: LogCategory): void {
    this.config.enabledCategories.add(category);
    console.log(`✅ Enabled category: ${category}`);
  }

  public disableCategory(category: LogCategory): void {
    this.config.enabledCategories.delete(category);
    console.log(`❌ Disabled category: ${category}`);
  }

  public showOnly(category: LogCategory): void {
    this.config.enabledCategories.clear();
    this.config.enabledCategories.add(category);
    console.log(`🎯 Showing only: ${category}`);
  }

  public enableCategories(categories: LogCategory[]): void {
    this.config.enabledCategories.clear();
    categories.forEach((cat) => this.config.enabledCategories.add(cat));
    console.log(`✅ Enabled categories: ${categories.join(", ")}`);
  }

  public enableAll(): void {
    Object.values(LogCategory).forEach((cat) =>
      this.config.enabledCategories.add(cat)
    );
    console.log("✅ All categories enabled");
  }

  public disableAll(): void {
    this.config.enabledCategories.clear();
    console.log("❌ All categories disabled");
  }

  public setLogLevel(level: string): void {
    const levelMap: Record<string, LogLevel> = {
      off: LogLevel.OFF,
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
      trace: LogLevel.TRACE,
    };

    const newLevel = levelMap[level.toLowerCase()];
    if (newLevel !== undefined) {
      this.config.level = newLevel;
      console.log(`📊 Log level set to: ${LogLevel[newLevel]}`);
    } else {
      console.warn(`Invalid log level: ${level}`);
    }
  }

  // Core logging method
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    ...args: any[]
  ): void {
    // Check if should log
    if (this.config.level === LogLevel.OFF) return;
    if (level > this.config.level) return;
    if (!this.config.enabledCategories.has(category)) return;

    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data: args.length > 0 ? args : undefined,
    };

    // Buffer if enabled
    if (this.config.buffer) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length > this.config.bufferSize) {
        this.logBuffer.shift();
      }
    }

    // Format and output
    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const icon = CATEGORY_ICONS[entry.category];
    const color = CATEGORY_COLORS[entry.category];

    let prefix = "";

    if (this.config.showTimestamp) {
      const time = new Date(entry.timestamp)
        .toISOString()
        .split("T")[1]
        .split(".")[0];
      prefix += `[${time}] `;
    }

    if (this.config.showCategory) {
      prefix += `${icon} `;
    }

    const logMethod = this.getConsoleMethod(entry.level);

    if (this.config.useColors && color) {
      logMethod(
        `%c${prefix}${entry.message}`,
        `color: ${color}; font-weight: ${
          entry.level <= LogLevel.WARN ? "bold" : "normal"
        };`,
        ...(entry.data || [])
      );
    } else {
      logMethod(`${prefix}${entry.message}`, ...(entry.data || []));
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      default:
        return console.log;
    }
  }

  // Throttled logging
  public throttled(
    category: LogCategory,
    key: string,
    message: string,
    intervalMs: number = 1000,
    ...args: any[]
  ): void {
    const now = Date.now();
    const lastTime = this.throttleTimers.get(key) || 0;

    if (now - lastTime >= intervalMs) {
      this.throttleTimers.set(key, now);
      this.log(LogLevel.INFO, category, message, ...args);
    }
  }

  // Public logging methods for each category
  public audio(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.AUDIO, message, ...args);
  }

  public player(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.PLAYER, message, ...args);
  }

  public monster(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.MONSTER, message, ...args);
  }

  public coin(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.COIN, message, ...args);
  }

  public bomb(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.BOMB, message, ...args);
  }

  public power(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.POWER, message, ...args);
  }

  public level(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.LEVEL, message, ...args);
  }

  public score(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.SCORE, message, ...args);
  }

  public game(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.GAME, message, ...args);
  }

  public input(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.INPUT, message, ...args);
  }

  public render(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.RENDER, message, ...args);
  }

  public physics(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.PHYSICS, message, ...args);
  }

  public spawn(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.SPAWN, message, ...args);
  }

  public collision(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.COLLISION, message, ...args);
  }

  public performance(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.PERFORMANCE, message, ...args);
  }

  public data(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.DATA, message, ...args);
  }

  public asset(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.ASSET, message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, LogCategory.DEBUG, message, ...args);
  }

  // Level-specific methods
  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, LogCategory.GAME, message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, LogCategory.GAME, message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, LogCategory.GAME, message, ...args);
  }

  public trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, LogCategory.DEBUG, message, ...args);
  }

  // Compatibility methods for existing code
  public flow(message: string, ...args: any[]): void {
    this.level(message, ...args);
  }

  public scaling(message: string, ...args: any[]): void {
    this.performance(message, ...args);
  }

  public pause(message: string, ...args: any[]): void {
    this.game(message, ...args);
  }

  public dataPassing(message: string, ...args: any[]): void {
    this.data(message, ...args);
  }

  public dev(message: string, ...args: any[]): void {
    this.debug(message, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods for backward compatibility
export const log = {
  error: (message: string, ...args: unknown[]) =>
    logger.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  debug: (message: string, ...args: unknown[]) =>
    logger.debug(message, ...args),
  trace: (message: string, ...args: unknown[]) =>
    logger.trace(message, ...args),

  // Category-specific methods
  game: (message: string, ...args: unknown[]) => logger.game(message, ...args),
  audio: (message: string, ...args: unknown[]) =>
    logger.audio(message, ...args),
  player: (message: string, ...args: unknown[]) =>
    logger.player(message, ...args),
  monster: (message: string, ...args: unknown[]) =>
    logger.monster(message, ...args),
  coin: (message: string, ...args: unknown[]) => logger.coin(message, ...args),
  bomb: (message: string, ...args: unknown[]) => logger.bomb(message, ...args),
  power: (message: string, ...args: unknown[]) =>
    logger.power(message, ...args),
  level: (message: string, ...args: unknown[]) =>
    logger.level(message, ...args),
  score: (message: string, ...args: unknown[]) =>
    logger.score(message, ...args),
  input: (message: string, ...args: unknown[]) =>
    logger.input(message, ...args),
  render: (message: string, ...args: unknown[]) =>
    logger.render(message, ...args),
  physics: (message: string, ...args: unknown[]) =>
    logger.physics(message, ...args),
  spawn: (message: string, ...args: unknown[]) =>
    logger.spawn(message, ...args),
  collision: (message: string, ...args: unknown[]) =>
    logger.collision(message, ...args),
  performance: (message: string, ...args: unknown[]) =>
    logger.performance(message, ...args),
  data: (message: string, ...args: unknown[]) => logger.data(message, ...args),
  asset: (message: string, ...args: unknown[]) =>
    logger.asset(message, ...args),

  // Compatibility aliases
  dev: (message: string, ...args: unknown[]) => logger.dev(message, ...args),
  flow: (message: string, ...args: unknown[]) => logger.flow(message, ...args),
  scaling: (message: string, ...args: unknown[]) =>
    logger.scaling(message, ...args),
  pause: (message: string, ...args: unknown[]) =>
    logger.pause(message, ...args),
  dataPassing: (message: string, ...args: unknown[]) =>
    logger.dataPassing(message, ...args),
};

// Expose log to window for console access
if (typeof window !== "undefined") {
  (window as any).log = log;
}

// Type definitions for better IDE support
export type LogMethod = (message: string, ...args: unknown[]) => void;
export type LoggerInstance = typeof logger;
export type LogExports = typeof log;
