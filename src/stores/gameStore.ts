import { create } from 'zustand';
import { GameState, MenuType, CoinType } from '../types/enums';
import { Player, MapDefinition, Bomb, Monster, Platform, Ground, Coin, FloatingText } from '../types/interfaces';
import { GAME_CONFIG, COLORS } from '../types/constants';
import { calculateBombScore } from '../lib/scoringUtils';
import { sendScoreToHost, sendGameStateUpdate, sendMapCompletionData, sendGameCompletionData } from '../lib/communicationUtils';
import { mapDefinitions } from '../maps/mapDefinitions';
import { COIN_TYPES } from '../config/coinTypes';

// Consolidated game state
interface GameStore {
  // Core game state
  currentState: GameState;
  score: number;
  levelScore: number;
  lives: number;
  currentLevel: number;
  showMenu: MenuType;
  previousMenu: MenuType | null;
  isPaused: boolean;
  bonusAnimationComplete: boolean;

  // Player state
  player: Player;

  // Level state
  currentMap: MapDefinition | null;
  monsters: Monster[];
  platforms: Platform[];
  ground: Ground | null;

  // Bomb state
  bombs: Bomb[];
  collectedBombs: number[];
  correctOrderCount: number;
  nextBombOrder: number;
  activeGroup: number | null;

  // Coin state
  coins: Coin[];
  powerModeActive: boolean;
  powerModeEndTime: number;
  firebombCount: number;
  coinSpawnTimers: Map<string, number>;

  // Multiplier state
  multiplier: number;
  multiplierScore: number;

  // Audio settings
  audioSettings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    masterMuted: boolean;
    musicMuted: boolean;
    sfxMuted: boolean;
  };
  audioManager: any | null;

  // Effects
  floatingTexts: FloatingText[];

  // Level history
  levelHistory: any[];

  // Core actions
  setState: (state: GameState) => void;
  setMenuType: (menuType: MenuType) => void;
  resetGame: () => void;

  // Player actions
  updatePlayer: (update: Partial<Player>) => void;
  setPlayerPosition: (x: number, y: number) => void;

  // Level actions
  initializeLevel: (mapData: MapDefinition) => void;
  nextLevel: () => void;
  updateMonsters: (monsters: Monster[]) => void;

  // Score actions
  addScore: (points: number) => void;
  loseLife: () => void;

  // Bomb actions
  collectBomb: (bomb: Bomb) => BombCollectionResult;
  updateBombs: (bombs: Bomb[]) => void;

  // Coin actions
  setCoins: (coins: Coin[]) => void;
  collectCoin: (coin: Coin) => void;
  spawnCoin: (type: CoinType, x: number, y: number) => void;
  updateCoinPhysics: (platforms: Platform[], ground: Ground) => void;

  // Multiplier actions
  addMultiplierScore: (points: number) => void;

  // Audio actions
  updateAudioSettings: (settings: Partial<GameStore['audioSettings']>) => void;
  setAudioManager: (manager: any) => void;

  // Effect actions
  addFloatingText: (text: string, x: number, y: number, duration?: number, color?: string, fontSize?: number) => void;
  updateFloatingTexts: () => void;
  clearAllFloatingTexts: () => void;

  // Utility
  setBonusAnimationComplete: (complete: boolean) => void;
  addLevelResult: (result: any) => void;
}

interface BombCollectionResult {
  isValid: boolean;
  isCorrect: boolean;
  score: number;
}

const createInitialPlayer = (): Player => ({
  x: 100,
  y: 300,
  width: GAME_CONFIG.PLAYER_WIDTH,
  height: GAME_CONFIG.PLAYER_HEIGHT,
  velocityX: 0,
  velocityY: 0,
  moveSpeed: GAME_CONFIG.MOVE_SPEED,
  jumpPower: GAME_CONFIG.JUMP_POWER,
  gravity: GAME_CONFIG.GRAVITY,
  color: COLORS.PLAYER,
  isGrounded: false,
  isFloating: false,
  isJumping: false,
  jumpStartTime: 0,
  floatGravity: GAME_CONFIG.FLOAT_GRAVITY,
});

const defaultAudioSettings = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 90,
  masterMuted: true,
  musicMuted: true,
  sfxMuted: true,
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentState: GameState.MENU,
  score: 0,
  levelScore: 0,
  lives: GAME_CONFIG.STARTING_LIVES,
  currentLevel: 1,
  showMenu: MenuType.START,
  previousMenu: null,
  isPaused: false,
  bonusAnimationComplete: false,

  player: createInitialPlayer(),

  currentMap: null,
  monsters: [],
  platforms: [],
  ground: null,

  bombs: [],
  collectedBombs: [],
  correctOrderCount: 0,
  nextBombOrder: 1,
  activeGroup: null,

  coins: [],
  powerModeActive: false,
  powerModeEndTime: 0,
  firebombCount: 0,
  coinSpawnTimers: new Map(),

  multiplier: 1,
  multiplierScore: 0,

  audioSettings: defaultAudioSettings,
  audioManager: null,

  floatingTexts: [],
  levelHistory: [],

  // Core actions
  setState: (state) => {
    set({
      currentState: state,
      isPaused: state === GameState.PAUSED,
    });
    
    if (state === GameState.MENU) {
      set({ showMenu: MenuType.START });
    } else if (state === GameState.PLAYING) {
      set({ showMenu: MenuType.IN_GAME });
    }

    const currentMap = get().currentMap;
    sendGameStateUpdate(state, currentMap?.name);
  },

  setMenuType: (menuType) => {
    const currentState = get();
    if (menuType === MenuType.SETTINGS) {
      set({ showMenu: menuType, previousMenu: currentState.showMenu });
    } else {
      set({ showMenu: menuType });
    }
  },

  resetGame: () => {
    set({
      currentState: GameState.MENU,
      score: 0,
      levelScore: 0,
      lives: GAME_CONFIG.STARTING_LIVES,
      currentLevel: 1,
      showMenu: MenuType.START,
      previousMenu: null,
      isPaused: false,
      bonusAnimationComplete: false,
      player: createInitialPlayer(),
      currentMap: null,
      monsters: [],
      platforms: [],
      ground: null,
      bombs: [],
      collectedBombs: [],
      correctOrderCount: 0,
      nextBombOrder: 1,
      activeGroup: null,
      coins: [],
      powerModeActive: false,
      powerModeEndTime: 0,
      firebombCount: 0,
      multiplier: 1,
      multiplierScore: 0,
      floatingTexts: [],
      levelHistory: [],
    });
  },

  // Player actions
  updatePlayer: (update) => {
    set({ player: { ...get().player, ...update } });
  },

  setPlayerPosition: (x, y) => {
    set({
      player: {
        ...get().player,
        x,
        y,
        velocityX: 0,
        velocityY: 0,
        isGrounded: false,
        isFloating: false,
        isJumping: false,
        jumpStartTime: 0,
      },
    });
  },

  // Level actions
  initializeLevel: (mapData) => {
    // Sort bombs to find first bomb
    const sortedBombs = [...mapData.bombs].sort((a, b) => a.group - b.group || a.order - b.order);
    const firstBomb = sortedBombs[0];

    // Set up bombs with initial state
    const bombsWithState = mapData.bombs.map(bomb => ({
      ...bomb,
      isBlinking: bomb.group === firstBomb?.group && bomb.order === firstBomb?.order,
      isCollected: false,
      isCorrect: false,
    }));

    set({
      currentMap: mapData,
      platforms: mapData.platforms,
      ground: mapData.ground,
      monsters: mapData.monsters,
      bombs: bombsWithState,
      collectedBombs: [],
      correctOrderCount: 0,
      nextBombOrder: 1,
      activeGroup: null,
      coins: [],
      powerModeActive: false,
      powerModeEndTime: 0,
      firebombCount: 0,
      coinSpawnTimers: new Map(),
    });

    // Set player position
    get().setPlayerPosition(mapData.playerStartX, mapData.playerStartY);
    get().clearAllFloatingTexts();
  },

  nextLevel: () => {
    const { currentLevel } = get();
    set({
      currentLevel: currentLevel + 1,
      levelScore: 0,
      multiplier: 1,
      multiplierScore: 0,
    });
  },

  updateMonsters: (monsters) => {
    set({ monsters });
  },

  // Score actions
  addScore: (points) => {
    const { score, levelScore, currentLevel, lives, multiplier, currentMap } = get();
    const newScore = score + points;

    set({
      score: newScore,
      levelScore: levelScore + points,
    });

    sendScoreToHost(
      newScore,
      currentMap?.name || `Level ${currentLevel}`,
      currentLevel,
      lives,
      multiplier
    );
  },

  loseLife: () => {
    const { lives } = get();
    const newLives = lives - 1;

    set({ lives: newLives });

    if (newLives <= 0) {
      set({
        currentState: GameState.GAME_OVER,
        showMenu: MenuType.GAME_OVER,
      });
      
      sendGameCompletionData({
        finalScore: get().score,
        totalLevels: mapDefinitions.length,
        completedLevels: get().levelHistory.length,
        timestamp: Date.now(),
        lives: newLives,
        multiplier: get().multiplier,
        levelHistory: get().levelHistory,
        totalCoinsCollected: get().levelHistory.reduce((sum, level) => sum + level.coinsCollected, 0),
        totalPowerModeActivations: get().levelHistory.reduce((sum, level) => sum + level.powerModeActivations, 0),
      });
    }
  },

  // Bomb actions
  collectBomb: (bomb) => {
    const state = get();
    const { bombs, collectedBombs, activeGroup, nextBombOrder } = state;

    // Check if already collected
    if (collectedBombs.includes(bomb.order)) {
      return { isValid: false, isCorrect: false, score: 0 };
    }

    // First bomb logic
    if (!activeGroup) {
      set({
        activeGroup: bomb.group,
        nextBombOrder: 1,
        collectedBombs: [...collectedBombs, bomb.order],
      });

      // Update bomb states
      const updatedBombs = bombs.map(b => ({
        ...b,
        isCollected: b.order === bomb.order,
        isBlinking: b.group === bomb.group && b.order === 1,
      }));
      set({ bombs: updatedBombs });

      return { isValid: true, isCorrect: false, score: 0 };
    }

    // Wrong group
    if (bomb.group !== activeGroup) {
      return { isValid: false, isCorrect: false, score: 0 };
    }

    // Check if correct order
    const isCorrect = bomb.order === nextBombOrder;

    if (isCorrect) {
      const newCorrectCount = state.correctOrderCount + 1;
      const scoreCalc = calculateBombScore(true, state.multiplier);

      set({
        collectedBombs: [...collectedBombs, bomb.order],
        correctOrderCount: newCorrectCount,
        nextBombOrder: nextBombOrder + 1,
        firebombCount: state.firebombCount + 1,
      });

      // Update bomb states
      const nextBomb = bombs.find(b => b.group === activeGroup && b.order === nextBombOrder + 1);
      const updatedBombs = bombs.map(b => ({
        ...b,
        isCollected: b.order === bomb.order || b.isCollected,
        isCorrect: b.order === bomb.order || b.isCorrect,
        isBlinking: b === nextBomb,
      }));
      set({ bombs: updatedBombs });

      // Add score
      get().addScore(scoreCalc.actualPoints);
      get().addMultiplierScore(scoreCalc.actualPoints);

      // Check for P-coin spawn (every 9 firebombs)
      if (state.firebombCount >= 9) {
        set({ firebombCount: 0 });
        const spawnPoint = state.currentMap?.coinSpawnPoints?.find(sp => sp.type === CoinType.POWER);
        if (spawnPoint) {
          get().spawnCoin(CoinType.POWER, spawnPoint.x, spawnPoint.y);
        }
      }

      return { isValid: true, isCorrect: true, score: scoreCalc.actualPoints };
    }

    // Wrong order
    return { isValid: false, isCorrect: false, score: 0 };
  },

  updateBombs: (bombs) => {
    set({ bombs });
  },

  // Coin actions
  setCoins: (coins) => {
    set({ coins });
  },

  collectCoin: (coin) => {
    const state = get();
    
    // Mark coin as collected
    const updatedCoins = state.coins.map(c =>
      c === coin ? { ...c, isCollected: true } : c
    );
    set({ coins: updatedCoins });

    // Handle coin effects
    if (coin.type === CoinType.POWER) {
      set({
        powerModeActive: true,
        powerModeEndTime: Date.now() + GAME_CONFIG.POWER_COIN_DURATION,
      });
      get().addScore(GAME_CONFIG.POWER_COIN_POINTS);
      
      // Freeze all monsters
      const frozenMonsters = state.monsters.map(m => ({
        ...m,
        isFrozen: true,
        isBlinking: true,
      }));
      set({ monsters: frozenMonsters });
    } else if (coin.type === CoinType.BONUS_MULTIPLIER) {
      const points = 1000 * state.multiplier;
      get().addScore(points);
      
      // Increase multiplier
      if (state.multiplier < GAME_CONFIG.MAX_MULTIPLIER) {
        const nextMultiplier = state.multiplier + 1;
        set({
          multiplier: nextMultiplier,
          multiplierScore: 0,
        });
      }
    }
  },

  spawnCoin: (type, x, y) => {
    const coinConfig = COIN_TYPES[type];
    if (!coinConfig) return;

    const newCoin: Coin = {
      type: type as string,
      x,
      y,
      width: GAME_CONFIG.COIN_SIZE,
      height: GAME_CONFIG.COIN_SIZE,
      velocityX: 0,
      velocityY: 0,
      isCollected: false,
      spawnX: x,
      spawnY: y,
      spawnTime: Date.now(),
    };

    set({ coins: [...get().coins, newCoin] });
  },

  updateCoinPhysics: (platforms, ground) => {
    const { coins } = get();
    const updatedCoins = coins.map(coin => {
      if (coin.isCollected) return coin;

      // Apply gravity
      let newY = coin.y + coin.velocityY;
      let newVelocityY = coin.velocityY + GAME_CONFIG.GRAVITY * 0.5;
      let grounded = false;

      // Check ground collision
      if (ground && newY + coin.height >= ground.y) {
        newY = ground.y - coin.height;
        newVelocityY = 0;
        grounded = true;
      }

      // Check platform collisions
      for (const platform of platforms) {
        if (
          coin.x < platform.x + platform.width &&
          coin.x + coin.width > platform.x &&
          newY < platform.y + platform.height &&
          newY + coin.height > platform.y
        ) {
          if (coin.velocityY > 0) {
            newY = platform.y - coin.height;
            newVelocityY = 0;
            grounded = true;
          }
        }
      }

      return {
        ...coin,
        y: newY,
        velocityY: grounded ? 0 : newVelocityY,
      };
    });

    // Remove expired coins
    const now = Date.now();
    const filteredCoins = updatedCoins.filter(coin => {
      if (coin.isCollected) return false;
      // P-coins last 7 seconds, other coins don't expire
      if (coin.type === CoinType.POWER) {
        return now - (coin.spawnTime || 0) < GAME_CONFIG.POWER_COIN_DURATION;
      }
      return true; // Other coins don't expire
    });

    set({ coins: filteredCoins });

    // Check power mode expiration
    if (get().powerModeActive && now > get().powerModeEndTime) {
      set({ powerModeActive: false });
      
      // Unfreeze monsters
      const unfrozenMonsters = get().monsters.map(m => ({
        ...m,
        isFrozen: false,
        isBlinking: false,
      }));
      set({ monsters: unfrozenMonsters });
    }
  },

  // Multiplier actions
  addMultiplierScore: (points) => {
    const { multiplier, multiplierScore } = get();
    const newScore = multiplierScore + points;
    
    // Check for multiplier increase
    for (let m = GAME_CONFIG.MAX_MULTIPLIER; m > multiplier; m--) {
      const threshold = GAME_CONFIG.MULTIPLIER_THRESHOLDS[m as keyof typeof GAME_CONFIG.MULTIPLIER_THRESHOLDS];
      if (newScore >= threshold) {
        set({
          multiplier: m,
          multiplierScore: 0,
        });
        return;
      }
    }
    
    set({ multiplierScore: newScore });
  },

  // Audio actions
  updateAudioSettings: (settings) => {
    set({ audioSettings: { ...get().audioSettings, ...settings } });
    
    const audioManager = get().audioManager;
    if (audioManager?.updateVolumes) {
      audioManager.updateVolumes();
    }
  },

  setAudioManager: (manager) => {
    set({ audioManager: manager });
  },

  // Effect actions
  addFloatingText: (text, x, y, duration = 2000, color = '#FFD700', fontSize = 20) => {
    const id = `${Date.now()}_${Math.random()}`;
    const floatingText: FloatingText = {
      id,
      text,
      x,
      y,
      startTime: Date.now(),
      duration,
      color,
      fontSize,
    };
    
    set({ floatingTexts: [...get().floatingTexts, floatingText] });
  },

  updateFloatingTexts: () => {
    const now = Date.now();
    const updated = get().floatingTexts
      .filter(text => now - text.startTime < text.duration)
      .map(text => {
        const elapsed = now - text.startTime;
        const progress = elapsed / text.duration;
        return {
          ...text,
          y: text.y - (progress * 0.5), // Move up slowly
        };
      });
    
    set({ floatingTexts: updated });
  },

  clearAllFloatingTexts: () => {
    set({ floatingTexts: [] });
  },

  // Utility
  setBonusAnimationComplete: (complete) => {
    set({ bonusAnimationComplete: complete });
  },

  addLevelResult: (result) => {
    set({ levelHistory: [...get().levelHistory, result] });
  },
}));