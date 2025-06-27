export enum GameState {
    MENU = 'MENU',
    COUNTDOWN = 'COUNTDOWN',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    BONUS = 'BONUS',
    VICTORY = 'VICTORY',
    GAME_OVER = 'GAME_OVER',
    MAP_CLEARED = 'MAP_CLEARED'
  }
  
  export enum MenuType {
    START = 'START',
    COUNTDOWN = 'COUNTDOWN',
    IN_GAME = 'IN_GAME',
    BONUS = 'BONUS',
    VICTORY = 'VICTORY',
    GAME_OVER = 'GAME_OVER'
  }
  
  export enum MonsterType {
    HORIZONTAL_PATROL = 'HORIZONTAL_PATROL'
  }
  
  export enum AudioEvent {
    GAME_START = 'GAME_START',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    PLAYER_DEATH = 'PLAYER_DEATH',
    GAME_OVER = 'GAME_OVER',
    BONUS_SCREEN = 'BONUS_SCREEN',
    BOMB_COLLECT = 'BOMB_COLLECT',
    MAP_CLEARED = 'MAP_CLEARED',
    BACKGROUND_MUSIC = 'BACKGROUND_MUSIC',
    MONSTER_HIT = 'MONSTER_HIT'
  }
  
  export enum CollisionType {
    PLATFORM = 'PLATFORM',
    BOMB = 'BOMB',
    MONSTER = 'MONSTER',
    BOUNDARY = 'BOUNDARY'
  }
  