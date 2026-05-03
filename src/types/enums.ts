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
  BOMBS = "bombs",
  SURVIVE = "survive",
  KILL = "kill",
}

export enum MonsterType {
  MUMMY = "MUMMY",
  VERTICAL_PATROL = "VERTICAL_PATROL",
  // BJ-aligned name (game-specs §5.1.1). Was CHASER pre-rename.
  BIRD = "BIRD",
  UFO = "UFO",
  HORN = "HORN",
  // BJ-style airborne forms (Monster-Movments.md).
  SPHERE = "SPHERE", // aligns Jack's X column, bobs Y uncontrollably
  ORB = "ORB", // aligns Jack's Y row, bobs X uncontrollably
}

export enum CoinType {
  POWER = "POWER",
  BONUS_MULTIPLIER = "BONUS_MULTIPLIER",
  EXTRA_LIFE = "EXTRA_LIFE",
  MONSTER_FREEZE = "MONSTER_FREEZE",
  // BJ "Special" coin: rare per-level spawn, awards points + skips level.
  SPECIAL = "SPECIAL",
}

export enum AudioEvent {
  GAME_START = "GAME_START",
  LEVEL_COMPLETE = "LEVEL_COMPLETE",
  PLAYER_DEATH = "PLAYER_DEATH",
  GAME_OVER = "GAME_OVER",
  BONUS_SCREEN = "BONUS_SCREEN",
  BOMB_COLLECT = "BOMB_COLLECT",
  MAP_CLEARED = "MAP_CLEARED",
  BACKGROUND_MUSIC = "BACKGROUND_MUSIC",
  MONSTER_HIT = "MONSTER_HIT",
  MONSTER_KILL = "MONSTER_KILL",
  COIN_COLLECT = "COIN_COLLECT",
  POWER_COIN_ACTIVATE = "POWER_COIN_ACTIVATE",
  PLAYER_JUMP = "PLAYER_JUMP",
  POWER_COIN_AMBIENT_START = "POWER_COIN_AMBIENT_START",
  POWER_COIN_AMBIENT_STOP = "POWER_COIN_AMBIENT_STOP",
}

export enum CollisionType {
  PLATFORM = "PLATFORM",
  BOMB = "BOMB",
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
