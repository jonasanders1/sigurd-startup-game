export enum GameState {
  MENU = "MENU",
  COUNTDOWN = "COUNTDOWN",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  BONUS = "BONUS",
  VICTORY = "VICTORY",
  GAME_OVER = "GAME_OVER",
  MAP_CLEARED = "MAP_CLEARED",
}

export enum MenuType {
  START = "START",
  COUNTDOWN = "COUNTDOWN",
  IN_GAME = "IN_GAME",
  PAUSE = "PAUSE",
  SETTINGS = "SETTINGS",
  BONUS = "BONUS",
  VICTORY = "VICTORY",
  GAME_OVER = "GAME_OVER",
  AUDIO_SETTINGS = "AUDIO_SETTINGS",
  CONTROLS = "CONTROLS",
  TUTORIAL_SELECT = "TUTORIAL_SELECT",
  TUTORIAL_BRIEF = "TUTORIAL_BRIEF",
  TUTORIAL_RESULT = "TUTORIAL_RESULT",
}

export enum TutorialMissionId {
  MOVEMENTS = "movements",
  FOUNDINGS = "foundings",
  SURVIVE = "survive",
  KILL = "kill",
}

export enum MonsterType {
  BUREAUCRAT = "BUREAUCRAT",
  // BJ-aligned name (game-specs §5.1.1). Was CHASER pre-rename.
  WISP = "WISP",
  TAXGHOST = "TAXGHOST",
  FOUNDER = "FOUNDER",
  // BJ-style airborne forms (Monster-Movments.md).
  CONSULTANT = "CONSULTANT", // aligns Jack's X column, bobs Y uncontrollably
  ROBOT = "ROBOT", // aligns Jack's Y row, bobs X uncontrollably
}

export enum CoinType {
  POWER = "POWER",
  BONUS_MULTIPLIER = "BONUS_MULTIPLIER",
  EXTRA_LIFE = "EXTRA_LIFE",
  MONSTER_FREEZE = "MONSTER_FREEZE",
  // F-coin (Founder Mode, FAFO): super-rare run-level spawn. Pickup grants
  // +1 Forretningsidee to the host balance via the bridge. Replaces the
  // old "SPECIAL" / level-skip coin.
  FOUNDER_MODE = "FOUNDER_MODE",
}

// Reason tokens for the reason-set pause API on ScalingManager,
// OptimizedSpawnManager, and OptimizedRespawnManager. Stringly-typed reasons
// were error-prone — a typo in one call site silently broke pause/resume
// pairing. Using a const enum keeps runtime values as plain strings (so
// existing `pauseReasons: Set<string>` storage works unchanged) while
// catching typos at the call site.
export enum PauseReason {
  /** Game-state transitions (countdown, pause menu, bonus, etc.). */
  Default = "default",
  /** P-coin power mode is active — managers stay paused for the duration. */
  PowerMode = "power_mode",
  /** Per-monster scaling pause used during state transitions. */
  MonsterScaling = "monster_scaling",
}

export enum AudioEvent {
  GAME_START = "GAME_START",
  LEVEL_COMPLETE = "LEVEL_COMPLETE",
  PLAYER_DEATH = "PLAYER_DEATH",
  GAME_OVER = "GAME_OVER",
  BONUS_SCREEN = "BONUS_SCREEN",
  FOUNDING_COLLECT = "FOUNDING_COLLECT",
  MAP_CLEARED = "MAP_CLEARED",
  BACKGROUND_MUSIC = "BACKGROUND_MUSIC",
  MONSTER_HIT = "MONSTER_HIT",
  MONSTER_KILL = "MONSTER_KILL",
  COIN_COLLECT = "COIN_COLLECT",
  F_COIN_COLLECT = "F_COIN_COLLECT",
  POWER_COIN_ACTIVATE = "POWER_COIN_ACTIVATE",
  PLAYER_JUMP = "PLAYER_JUMP",
  POWER_COIN_AMBIENT_START = "POWER_COIN_AMBIENT_START",
  POWER_COIN_AMBIENT_STOP = "POWER_COIN_AMBIENT_STOP",
  TUTORIAL_SUBTASK_COMPLETE = "TUTORIAL_SUBTASK_COMPLETE",
}

export enum CollisionType {
  PLATFORM = "PLATFORM",
  FOUNDING = "FOUNDING",
  MONSTER = "MONSTER",
  BOUNDARY = "BOUNDARY",
  COIN = "COIN",
}

export enum InputKey {
  LEFT = "ArrowLeft",
  RIGHT = "ArrowRight",
  UP = "ArrowUp",
  DOWN = "ArrowDown",
  SPACE = " ",
  ENTER = "Enter",
  ESCAPE = "Escape",
  P = "p",
  R = "r",
}
