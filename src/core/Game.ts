import { EntityManager } from './EntityManager';
import { PhysicsSystem } from './PhysicsSystem';
import { InputManager } from '../managers/InputManager';
import { RenderManager } from '../managers/RenderManager';
import { AudioManager } from '../managers/AudioManager';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types/enums';

export class Game {
  private canvas: HTMLCanvasElement;
  private entityManager: EntityManager;
  private physicsSystem: PhysicsSystem;
  private inputManager: InputManager;
  private renderManager: RenderManager;
  private audioManager: AudioManager;
  
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Initialize systems
    this.entityManager = new EntityManager();
    this.physicsSystem = new PhysicsSystem();
    this.inputManager = new InputManager();
    this.renderManager = new RenderManager(canvas);
    this.audioManager = new AudioManager();
    
    // Store audio manager reference in game store
    const gameStore = useGameStore.getState();
    if ('setAudioManager' in gameStore) {
      gameStore.setAudioManager(this.audioManager);
    }
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.audioManager.stopBackgroundMusic();
  }

  private gameLoop = (currentTime: number = 0): void => {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Get current game state
    const gameState = useGameStore.getState();
    
    // Update based on game state
    if (gameState.currentState === GameState.PLAYING) {
      this.update(deltaTime);
    }
    
    // Always render
    this.render();
    
    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  private update(deltaTime: number): void {
    // Process input
    this.processInput();
    
    // Update all entities
    this.entityManager.update(deltaTime);
    
    // Run physics
    this.physicsSystem.update(this.entityManager.getEntities(), deltaTime);
    
    // Check game conditions
    this.checkGameConditions();
  }

  private processInput(): void {
    const gameState = useGameStore.getState();
    const player = this.entityManager.getPlayer();
    
    if (!player) return;
    
    // Handle pause
    if (this.inputManager.isKeyPressed('p') || this.inputManager.isKeyPressed('P')) {
      gameState.setState(GameState.PAUSED);
      return;
    }
    
    // Handle movement
    if (this.inputManager.isKeyPressed('ArrowLeft')) {
      player.moveLeft();
    } else if (this.inputManager.isKeyPressed('ArrowRight')) {
      player.moveRight();
    } else {
      player.stopMoving();
    }
    
    // Handle jump
    const isShiftPressed = this.inputManager.isShiftPressed();
    if (this.inputManager.isKeyPressed('ArrowUp')) {
      player.continueJump(isShiftPressed);
    }
    
    // Handle float
    if (this.inputManager.isKeyPressed(' ') || this.inputManager.isKeyPressed('Space')) {
      player.startFloating();
    } else {
      player.stopFloating();
    }
  }

  private checkGameConditions(): void {
    // Check win conditions, deaths, etc.
    // This will be implemented based on game logic
  }

  private render(): void {
    const player = this.entityManager.getPlayer();
    const monsters = this.entityManager.getMonsters();
    const coins = this.entityManager.getCoins();
    const bombs = this.entityManager.getBombs();
    const platforms = this.entityManager.getPlatforms();
    const ground = this.entityManager.getGround();
    
    // For now, convert entities back to the old format for compatibility
    // This will be refactored when we update RenderManager
    if (player) {
      const playerData = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height,
        color: '#00FF00',
        velocityX: player.velocityX,
        velocityY: player.velocityY,
        isGrounded: player.isGrounded,
        isFloating: player.isFloating,
        isJumping: player.isJumping,
        jumpStartTime: player.jumpStartTime,
        moveSpeed: player.moveSpeed,
        jumpPower: player.jumpPower,
        gravity: player.gravity,
        floatGravity: player.floatGravity,
      };
      
      const monsterData = monsters.map(m => ({
        x: m.x,
        y: m.y,
        width: m.width,
        height: m.height,
        color: m.color,
        type: m.type,
        patrolStartX: m.patrolStartX,
        patrolEndX: m.patrolEndX,
        speed: m.speed,
        direction: m.direction,
        isActive: m.isActive,
        isFrozen: m.isFrozen,
        isBlinking: m.isBlinking,
      }));
      
      const coinData = coins.map(c => ({
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
        type: c.type,
        isCollected: c.isCollected,
        velocityX: c.velocityX,
        velocityY: c.velocityY,
        spawnX: c.spawnX,
        spawnY: c.spawnY,
        effectDuration: c.effectDuration,
        colorIndex: c.colorIndex,
        spawnTime: c.spawnTime,
      }));
      
      const bombData = bombs.map(b => ({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        order: b.order,
        group: b.group,
        isCollected: b.isCollected,
        isBlinking: b.isBlinking,
        isCorrect: b.isCorrect,
      }));
      
      this.renderManager.render(
        playerData,
        platforms,
        bombData,
        monsterData,
        ground,
        coinData
      );
    }
  }

  cleanup(): void {
    this.stop();
    this.inputManager.cleanup();
    this.audioManager.cleanup();
  }
}