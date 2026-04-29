import {
  useGameStore,
  useInputStore,
  usePlayerStore,
  useStateStore,
} from "../stores/gameStore";
import { Player } from "../types/interfaces";
import { GAME_CONFIG } from "../types/constants";
import { CollisionManager } from "./CollisionManager";
import { AnimationController } from "../lib/AnimationController";

export class PlayerManager {
  private collisionManager: CollisionManager;
  private animationController: AnimationController;
  private bounds: { width: number; height: number };
  private onPlayerDeath?: () => void;

  // Tutorial Mission 1: hold-time tracking + jump edge-latch
  private tutorialHoldStart: {
    left: number;
    right: number;
    jump: number;
    float: number;
    fastFall: number;
  } = { left: 0, right: 0, jump: 0, float: 0, fastFall: 0 };
  private tutorialJumpLatch = false;
  // "fall" doesn't complete on the fast-fall input alone — the player has to
  // see the ground before it counts. Set true once they've fast-fallen for the
  // hold window; cleared the next time they touch ground.
  private tutorialFastFallArmed = false;

  constructor(animationController: AnimationController) {
    this.collisionManager = new CollisionManager();
    this.animationController = animationController;
    this.bounds = {
      width: GAME_CONFIG.CANVAS_WIDTH,
      height: GAME_CONFIG.CANVAS_HEIGHT,
    };
  }

  public setDeathCallback(callback: () => void): void {
    this.onPlayerDeath = callback;
  }

  update(deltaTime: number): void {
    const { player, updatePlayer } = usePlayerStore.getState();
    const { input } = useInputStore.getState();
    const { currentState, loseLife, tutorialMission, markTutorialSubTask } =
      useStateStore.getState();

    // Tutorial Mission 1 sub-task tracking — only mark a sub-task when the
    // input is held long enough (or the player has moved a meaningful distance)
    // so a single tap doesn't tick everything off at once.
    if (tutorialMission === "movements") {
      const HOLD_MS = 250;
      const now = Date.now();
      const t = this.tutorialHoldStart;

      const tickHold = (
        key: "left" | "right" | "jump" | "float" | "fastFall",
        subId: string,
        actuallyDoingIt: boolean
      ) => {
        if (input[key] && actuallyDoingIt) {
          if (!t[key]) t[key] = now;
          if (now - (t[key] ?? now) >= HOLD_MS) markTutorialSubTask(subId);
        } else {
          t[key] = 0;
        }
      };
      // Sub-task counts only when the player is *actually* doing the action,
      // not just pressing the key (e.g. holding ↓ while standing on a platform
      // shouldn't tick "fall"; pressing space on the ground shouldn't tick
      // "float"; pushing into a wall shouldn't tick "moveLeft").
      tickHold("left", "moveLeft", player.velocityX < 0);
      tickHold("right", "moveRight", player.velocityX > 0);
      tickHold("float", "float", player.isFloating);

      // Fast-fall: arm the flag once the player has actually fast-fallen for
      // the hold window, then mark "fall" only when they hit the ground.
      const isFastFalling =
        input.fastFall && !player.isGrounded && player.velocityY > 0;
      if (isFastFalling) {
        if (!t.fastFall) t.fastFall = now;
        if (now - t.fastFall >= HOLD_MS) this.tutorialFastFallArmed = true;
      } else {
        t.fastFall = 0;
      }
      if (this.tutorialFastFallArmed && player.isGrounded) {
        markTutorialSubTask("fall");
        this.tutorialFastFallArmed = false;
      }

      // Jump variants — fire on the rising edge while grounded; super-jump
      // requires Shift. (Hold-detection isn't useful here since jump is a
      // discrete event.)
      if (input.jump && player.isGrounded && !this.tutorialJumpLatch) {
        markTutorialSubTask(input.superJump ? "superJump" : "jump");
        this.tutorialJumpLatch = true;
      }
      if (!input.jump) this.tutorialJumpLatch = false;
    }
    // Handle input from store
    const moveX = this.processInput(input);

    // Update animation state
    this.animationController.update(
      player.isGrounded,
      moveX,
      player.isFloating,
      currentState,
      player.velocityY
    );

    // Handle jumping mechanics
    this.handleJumping(player, input);

    // Handle fast fall and floating
    this.handleAirMovement(player, input);

    // Apply movement with frame-rate compensation
    this.applyMovement(player, moveX, deltaTime);

    // Apply physics (gravity, velocity)
    this.applyPhysics(player, deltaTime);

    // Handle boundary collisions
    const boundaryResult = this.collisionManager.resolveBoundaryCollision(
      player,
      this.bounds
    );

    if (boundaryResult.fellOffScreen) {
      // Player fell off screen - use death callback if available
      if (this.onPlayerDeath) {
        this.onPlayerDeath();
      } else {
        // Fallback to direct loseLife if no callback set
        loseLife();
      }
      return;
    }

    // Update player with boundary-resolved position
    const updatedPlayer = boundaryResult.player;

    // Reset grounded state before collision detection sets it back to true
    updatedPlayer.isGrounded = false;

    // Update the store
    updatePlayer(updatedPlayer);
  }

  private processInput(input: any): number {
    const { player } = usePlayerStore.getState();
    let moveX = 0;
    if (input.left) {
      moveX = -player.moveSpeed;
    }
    if (input.right) {
      moveX = player.moveSpeed;
    }
    return moveX;
  }

  private handleJumping(player: Player, input: any): void {
    const isUpPressed = input.jump;
    const isShiftPressed = input.superJump;

    if (isUpPressed && player.isGrounded && !player.isJumping) {
      // Start jump
      player.isJumping = true;
      player.jumpStartTime = Date.now();
      player.isGrounded = false;

      // Initial jump velocity (minimum jump)
      const baseJumpPower = isShiftPressed
        ? GAME_CONFIG.SUPER_JUMP_POWER
        : GAME_CONFIG.JUMP_POWER;
      player.velocityY = -baseJumpPower * 0.6; // Start with 60% of jump power
    }

    // Continue jump if key is held and we're still in jump phase
    if (isUpPressed && player.isJumping && player.velocityY < 0) {
      const jumpDuration = Date.now() - player.jumpStartTime;

      if (jumpDuration <= GAME_CONFIG.MAX_JUMP_DURATION) {
        // Calculate additional jump power based on hold duration
        const holdRatio = Math.min(
          jumpDuration / GAME_CONFIG.MAX_JUMP_DURATION,
          1
        );
        const baseJumpPower = isShiftPressed
          ? GAME_CONFIG.SUPER_JUMP_POWER
          : GAME_CONFIG.JUMP_POWER;
        const targetVelocity = -baseJumpPower * (0.6 + 0.4 * holdRatio); // Scale from 60% to 100%

        // Gradually increase jump power with frame-rate compensation
        if (player.velocityY > targetVelocity) {
          player.velocityY = targetVelocity;
        }
      }
    }

    // End jump when key is released or max duration reached
    if (
      (!isUpPressed ||
        Date.now() - player.jumpStartTime > GAME_CONFIG.MAX_JUMP_DURATION) &&
      player.isJumping
    ) {
      player.isJumping = false;
    }
  }

  private handleAirMovement(player: Player, input: any): void {
    const isDownPressed = input.fastFall;
    const isSpacePressed = input.float;

    // Fast fall mechanic - Arrow Down kills upward momentum and speeds up fall
    if (isDownPressed && !player.isGrounded) {
      // Kill any upward momentum immediately
      if (player.velocityY < 0) {
        player.velocityY = 0;
      }
      // Set fast fall state
      player.isFastFalling = true;
    } else {
      player.isFastFalling = false;
    }

    // Floating mechanism - works anytime the player is in the air
    if (isSpacePressed && !player.isGrounded) {
      // Only kill momentum if we're just starting to float (not already floating)
      if (!player.isFloating) {
        player.velocityY = 0;
      }
      // Set floating state for slower fall
      player.isFloating = true;
    } else {
      // Key is not pressed or player is grounded - disable floating
      player.isFloating = false;
    }

    // Additional safety: disable floating if player becomes grounded
    if (player.isGrounded) {
      player.isFloating = false;
      player.isFastFalling = false;
    }
  }

  private applyMovement(
    player: Player,
    moveX: number,
    deltaTime: number
  ): void {
    player.velocityX = moveX;
    player.x += player.velocityX * (deltaTime / 16.67); // 16.67ms = 60fps for consistent speed
  }

  private applyPhysics(player: Player, deltaTime: number): void {
    // Apply gravity - handle different gravity states
    let gravity = player.gravity; // Default gravity

    if (player.isFloating && player.velocityY >= 0) {
      // Use float gravity when floating and falling
      gravity = player.floatGravity;
    } else if (player.isFastFalling) {
      // Use fast fall gravity multiplier when fast falling
      gravity = player.gravity * GAME_CONFIG.FAST_FALL_GRAVITY_MULTIPLIER;
    }

    player.velocityY += gravity * (deltaTime / 16.67); // Frame-rate compensation for gravity
    player.y += player.velocityY * (deltaTime / 16.67); // Frame-rate compensation for vertical movement
  }

  // Handle platform and ground collisions (called from GameManager)
  handlePlatformCollision(
    player: Player,
    platforms: any[],
    ground: any
  ): Player {
    let updatedPlayer = { ...player };

    // Iterate so a single frame resolves all overlapping rects (e.g. floor +
    // wall in an L-corner). Picking only the smallest leaves the other and
    // causes per-frame jitter as the loser snaps the next frame.
    const MAX_ITERS = 4;
    for (let i = 0; i < MAX_ITERS; i++) {
      const collision = this.collisionManager.checkPlayerPlatformCollision(
        updatedPlayer,
        platforms
      );
      if (
        !collision.hasCollision ||
        !collision.normal ||
        collision.penetration === undefined ||
        collision.penetration <= 0
      ) {
        break;
      }
      this.applyResolution(updatedPlayer, collision);
    }

    if (ground) {
      for (let i = 0; i < MAX_ITERS; i++) {
        const groundCollision =
          this.collisionManager.checkPlayerGroundCollision(updatedPlayer, ground);
        if (
          !groundCollision.hasCollision ||
          !groundCollision.normal ||
          groundCollision.penetration === undefined ||
          groundCollision.penetration <= 0
        ) {
          break;
        }
        this.applyResolution(updatedPlayer, groundCollision);
      }
    }

    return updatedPlayer;
  }

  /** Mutates `p`: snaps out of collider along normal, zeros that axis's velocity. */
  private applyResolution(
    p: Player,
    collision: { normal?: { x: number; y: number }; penetration?: number }
  ): void {
    if (!collision.normal || collision.penetration === undefined) return;
    if (collision.normal.y === -1) {
      // Landing on top of surface
      p.y -= collision.penetration;
      p.velocityY = 0;
      p.isGrounded = true;
      p.isFloating = false;
    } else if (collision.normal.y === 1) {
      // Hitting surface from below
      p.y += collision.penetration;
      p.velocityY = 0;
    } else if (collision.normal.x === 1) {
      // Hit from the right
      p.x += collision.penetration;
      p.velocityX = 0;
    } else if (collision.normal.x === -1) {
      // Hit from the left
      p.x -= collision.penetration;
      p.velocityX = 0;
    }
  }

  // Reset player position and state
  resetPlayer(x: number, y: number): void {
    const { setPlayerPosition } = usePlayerStore.getState();
    // Use setPlayerPosition to properly reset all movement properties
    setPlayerPosition(x, y);

    // Reset animation controller state
    this.animationController.reset();
  }

  // Get current player state
  getPlayer(): Player {
    const { player } = usePlayerStore.getState();
    return player;
  }
}
