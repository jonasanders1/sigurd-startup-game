import {
  useCoinStore,
  useGameStore,
  useInputStore,
  usePlayerStore,
  useScoreStore,
  useStateStore,
} from "../stores/gameStore";
import { Player } from "../types/interfaces";
import { GAME_CONFIG } from "../types/constants";
import { PHYSICS_CONFIG } from "../config/game";
import { PLAYFIELD_BOTTOM } from "../config/floor";
import { CollisionManager } from "./CollisionManager";
import { AnimationController } from "../lib/AnimationController";
import { log } from "../lib/logger";
import { trampolineBasePoints } from "../lib/bjRules";
import {
  advanceGravityIndex,
  decideJumpType,
  GRAVITY_APEX_INDEX,
  gravityVelocityAt,
  jumpInitParams,
} from "../lib/gravityLUT";
import { getTuned } from "../stores/systems/tuningStore";
import { useAudioStore } from "../stores/systems/audioStore";
import { AudioEvent } from "../types/enums";
import type { SubTaskId } from "./TutorialManager";

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

  // BJ trampoline / P-coin color advance: fires on jump-start, wall-hit,
  // fall-off-platform. Wall-hit uses edge detection across frames so that
  // holding the joystick into a wall counts as ONE event, not 60/sec.
  private wallContactedLastFrame = false;
  private wallContactedThisFrame = false;
  private wasGroundedLastFrame = true;
  // Jump edge-latch: input.jump is a sustained boolean (held while key is
  // down), so the gameplay-jump check would fire again the instant the
  // player landed while still holding ↑/W. That re-fired both the jump SFX
  // and the trampoline → P-coin color advance every landing, which the
  // player perceives as rapid color cycling and overlapping audio. Latch
  // consumes the press until the key is released and re-pressed.
  private jumpInputLatched = false;
  // Jump-feel timers (ms, ticked off loop delta — pause-safe). Coyote grants
  // a short grace to jump after walking off a ledge; the buffer holds a
  // slightly-early press until touchdown. See PHYSICS_CONFIG.
  private coyoteMsRemaining = 0;
  private jumpBufferMsRemaining = 0;
  private prevJumpHeld = false;

  constructor(animationController: AnimationController) {
    this.collisionManager = new CollisionManager();
    this.animationController = animationController;
    this.bounds = {
      width: GAME_CONFIG.CANVAS_WIDTH,
      // Bottom of the playable area = top of the decorative floor strip.
      // The floor itself is restricted ground; the player cannot enter it.
      height: PLAYFIELD_BOTTOM,
    };
  }

  public setDeathCallback(callback: () => void): void {
    this.onPlayerDeath = callback;
  }

  // BJ: jumping / hitting a wall / falling off a platform awards 10 × multiplier
  // and advances every live P-coin's color tier. Discrete events only —
  // edge detection upstream prevents wall-hold and multi-iter resolver bursts.
  private fireTrampolineAction(reason: string): void {
    const scoreStore = useScoreStore.getState();
    const base = trampolineBasePoints();
    const actual = base * scoreStore.multiplier;
    scoreStore.addScore(base); // multiplies internally

    const coinStore = useCoinStore.getState();
    if (coinStore.coinManager) {
      coinStore.coinManager.advanceLivePcoinColors();
      // BJ canonical: trampoline points count toward B-coin threshold.
      coinStore.onPointsEarned(actual, false);
    }

    log.debug(`Trampoline action: ${reason}`);
  }

  // Wall-hit edge gate: fires once per fresh contact. Returns true if the
  // caller should fire the trampoline event for this contact.
  private registerWallContact(): boolean {
    const wasContact = this.wallContactedThisFrame;
    this.wallContactedThisFrame = true;
    // Already counted this frame, or already against a wall last frame:
    // don't fire.
    if (wasContact) return false;
    if (this.wallContactedLastFrame) return false;
    return true;
  }

  update(deltaTime: number): void {
    const { player, updatePlayer } = usePlayerStore.getState();
    const { input } = useInputStore.getState();
    const { currentState, tutorialMission, markTutorialSubTask } =
      useStateStore.getState();

    // Wall-hit edge gate: roll thisFrame → lastFrame, then clear thisFrame.
    // Subsequent in-frame wall events go through registerWallContact() which
    // only fires the trampoline on the false→true edge.
    this.wallContactedLastFrame = this.wallContactedThisFrame;
    this.wallContactedThisFrame = false;

    // BJ fall-off-platform detection. Compares end-of-last-frame's grounded
    // state (still true here, before the in-frame reset) to current. !isJumping
    // filters out jumps, which fire their own trampoline event.
    if (
      this.wasGroundedLastFrame &&
      !player.isGrounded &&
      !player.isJumping &&
      currentState === "PLAYING"
    ) {
      this.fireTrampolineAction("falloff");
    }

    // Tutorial Mission 1 sub-task tracking — only mark a sub-task when the
    // input is held long enough (or the player has moved a meaningful distance)
    // so a single tap doesn't tick everything off at once.
    if (tutorialMission === "movements") {
      const HOLD_MS = 250;
      const now = Date.now();
      const t = this.tutorialHoldStart;

      const tickHold = (
        key: "left" | "right" | "jump" | "float" | "fastFall",
        subId: SubTaskId,
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
    this.handleJumping(player, input, deltaTime);

    // Handle fast fall and floating
    this.handleAirMovement(player, input);

    // Apply movement with frame-rate compensation
    this.applyMovement(player, moveX, deltaTime);

    // Apply physics (gravity, velocity)
    this.applyPhysics(player, deltaTime);

    // Handle boundary collisions
    const xBeforeBoundary = player.x;
    const boundaryResult = this.collisionManager.resolveBoundaryCollision(
      player,
      this.bounds
    );
    // BJ wall-hit (boundary): horizontal clamp counts as a wall touch.
    // Edge gate prevents the hold-against-wall exploit.
    if (
      !boundaryResult.fellOffScreen &&
      boundaryResult.player.x !== xBeforeBoundary &&
      currentState === "PLAYING"
    ) {
      if (this.registerWallContact()) {
        this.fireTrampolineAction("wall-boundary");
      }
    }

    // Update player with boundary-resolved position. The bottom boundary is
    // now a floor (Ground removed); fellOffScreen is wired but always false.
    const updatedPlayer = boundaryResult.player;

    // Snapshot grounded state for next frame's fall-off detection BEFORE the
    // pre-collision reset zeros it. handleCollisions runs after this and may
    // set isGrounded=true; that final value is what the next frame reads at start.
    this.wasGroundedLastFrame = player.isGrounded;

    // Reset grounded state before collision detection sets it back to true
    updatedPlayer.isGrounded = false;

    // Update the store
    updatePlayer(updatedPlayer);
  }

  private processInput(input: any): number {
    // Read tuned move speed live so the panel slider takes effect mid-walk.
    const speed = getTuned("PLAYER_MOVE_SPEED");
    let moveX = 0;
    if (input.left) moveX = -speed;
    if (input.right) moveX = speed;
    return moveX;
  }

  // BJ-style jump (game-specs §4.4): three jump heights driven by held
  // modifiers at jump-press time, all sharing the same gravity LUT.
  //   ↑          → normal (LUT[0], rate 1.0)
  //   ↑ + SHIFT  → high   (LUT[0], slower ascent → higher peak)
  //   ↓ + ↑      → short  (LUT[16], skips strongest upward velocity)
  // Modifier priority is encoded in decideJumpType (down wins over shift).
  private handleJumping(player: Player, input: any, deltaTime: number): void {
    const isUpPressed = input.jump;
    const pressedThisFrame = isUpPressed && !this.prevJumpHeld;
    this.prevJumpHeld = isUpPressed;

    // Release the latch as soon as the jump key goes up so the next press
    // can fire. With the key released, holding it again is a fresh press.
    if (!isUpPressed) {
      this.jumpInputLatched = false;
    }

    // Coyote window: refilled while grounded, drains while airborne. After a
    // real jump the ascent alone far outlasts the window, so this can never
    // grant a double jump.
    if (player.isGrounded) {
      this.coyoteMsRemaining = PHYSICS_CONFIG.COYOTE_TIME_MS;
    } else {
      this.coyoteMsRemaining = Math.max(0, this.coyoteMsRemaining - deltaTime);
    }

    // Jump buffer: armed on the press EDGE only, then drains. A held key
    // does not re-arm it — that's what bounds the old infinite
    // press-in-midair-fires-on-any-later-landing behavior.
    this.jumpBufferMsRemaining = Math.max(
      0,
      this.jumpBufferMsRemaining - deltaTime
    );
    if (pressedThisFrame) {
      this.jumpBufferMsRemaining = PHYSICS_CONFIG.JUMP_BUFFER_MS;
    }

    const wantsJump =
      isUpPressed && !this.jumpInputLatched && this.jumpBufferMsRemaining > 0;
    const canGroundJump = player.isGrounded;
    // Coyote jump: recently walked off a ledge (not from a jump — the
    // descent guard also blocks post-apex re-jumps where isJumping already
    // flipped false mid-air).
    const canCoyoteJump =
      !player.isGrounded &&
      !player.isJumping &&
      player.velocityY >= 0 &&
      this.coyoteMsRemaining > 0;

    if (wantsJump && !player.isJumping && (canGroundJump || canCoyoteJump)) {
      const params = jumpInitParams(
        decideJumpType({
          fastFall: !!input.fastFall,
          superJump: !!input.superJump,
        })
      );
      player.isJumping = true;
      player.jumpStartTime = Date.now();
      player.isGrounded = false;
      player.gravityIndex = params.startIdx;
      player.jumpAdvanceRate = params.ascendAdvanceRate;
      player.velocityY = gravityVelocityAt(params.startIdx);
      this.jumpInputLatched = true;
      this.coyoteMsRemaining = 0;
      this.jumpBufferMsRemaining = 0;

      useAudioStore.getState().audioManager?.playSound(AudioEvent.PLAYER_JUMP);

      // BJ trampoline: each jump-start awards 10 × multiplier and advances
      // any live P-coin's color tier.
      this.fireTrampolineAction("jump");
    }

    // Late-Shift upgrade: if the player tapped Up a hair before Shift, the
    // jump already committed as "normal" because the keydown for ↑ landed
    // on an earlier animation frame than Shift's. Inside a brief grace
    // window after liftoff, while still rising and not holding ↓, promote
    // a normal jump to a high jump by swapping in JUMP_HIGH_RATE. Fixes
    // the timing race without adding any pre-press input buffer.
    const UPGRADE_WINDOW_MS = 80;
    if (
      player.isJumping &&
      !!input.superJump &&
      !input.fastFall &&
      player.gravityIndex < GRAVITY_APEX_INDEX &&
      Date.now() - player.jumpStartTime <= UPGRADE_WINDOW_MS
    ) {
      const highRate = getTuned("JUMP_HIGH_RATE");
      if (player.jumpAdvanceRate > highRate) {
        player.jumpAdvanceRate = highRate;
      }
    }

    // End "isJumping" once apex passed (descending phase). Gates fast-fall
    // input so a player still ascending can't ↓-cancel their own jump.
    if (player.isJumping && player.gravityIndex >= GRAVITY_APEX_INDEX) {
      player.isJumping = false;
    }
  }

  // BJ float / fast-fall via LUT-index manipulation (game-specs §4.5).
  // Float (hold SPACE in air) snaps idx back to apex so the player hangs.
  // Fast-fall (hold DOWN in air, AFTER apex) jumps idx forward into descent.
  // The !isJumping gate prevents ↓ from cancelling a still-ascending jump —
  // important when DOWN was held to TRIGGER a short jump and remains held.
  private handleAirMovement(player: Player, input: any): void {
    const isDownPressed = input.fastFall;
    const isSpacePressed = input.float;

    if (isDownPressed && !player.isGrounded && !player.isJumping) {
      player.isFastFalling = true;
      const fastFallIdx = getTuned("GRAVITY_FAST_FALL_INDEX");
      if (player.gravityIndex < fastFallIdx) {
        player.gravityIndex = fastFallIdx;
      }
    } else {
      player.isFastFalling = false;
    }

    // Float — pins idx slightly past apex while held, giving a slight
    // downward drift instead of perfect hover. Counters the infinite-float
    // exploit that the hold-SPACE control creates (spec's tap-to-float
    // re-decays naturally; ours doesn't, so we nerf hover speed instead).
    if (isSpacePressed && !player.isGrounded) {
      player.isFloating = true;
      player.gravityIndex = getTuned("GRAVITY_FLOAT_INDEX");
    } else {
      player.isFloating = false;
    }

    // Safety: clear air-movement flags on landing.
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

  // BJ LUT-driven vertical physics (game-specs §4.3, §4.4). vy is the LUT
  // entry at the current gravity index. During the ascending half (idx <
  // APEX), the index advances at jumpAdvanceRate — high jumps use rate < 1
  // to stretch the ascent and produce a higher peak. Past apex, descent
  // always runs at full rate.
  private applyPhysics(player: Player, deltaTime: number): void {
    // Float pins idx; don't advance it. Read vy from LUT so the player
    // drifts down at the FLOAT_INDEX-derived velocity each frame.
    if (player.isFloating) {
      player.velocityY = gravityVelocityAt(player.gravityIndex);
      player.y += player.velocityY * (deltaTime / 16.67);
      return;
    }

    // Walking on a platform: don't tick the LUT forward. Without this, idx
    // accumulates each frame past APEX → LUT[idx] creeps positive → Jack
    // sinks sub-pixel into the platform → collision snaps him back the next
    // frame → visible up/down bob while walking. Pinning idx at APEX while
    // grounded makes Y truly stationary.
    if (player.isGrounded) {
      player.gravityIndex = GRAVITY_APEX_INDEX;
      player.velocityY = 0;
      return;
    }

    // Ascending uses the jump-type's rate (set on jump init). Descending uses
    // the tunable JUMP_DESCENT_RATE — lower stretches the early-fall LUT
    // entries before terminal velocity saturates, giving a more pronounced
    // "starts slow, then accelerates" feel.
    const isAscending = player.gravityIndex < GRAVITY_APEX_INDEX;
    const rate = isAscending
      ? player.jumpAdvanceRate
      : getTuned("JUMP_DESCENT_RATE");
    player.gravityIndex = advanceGravityIndex(
      player.gravityIndex,
      deltaTime * rate
    );
    player.velocityY = gravityVelocityAt(player.gravityIndex);
    player.y += player.velocityY * (deltaTime / 16.67);
  }

  // Handle platform collisions (called from GameManager). The Ground entity
  // was removed; the canvas bottom is now the floor and is handled in
  // CollisionManager.resolveBoundaryCollision instead.
  handlePlatformCollision(player: Player, platforms: any[]): Player {
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

    // Resting-contact probe. The penetration test in CollisionManager uses
    // strict `>` inequality, so a player snapped exactly to a surface top
    // (where bottom-edge === surface.y after applyResolution) reads as
    // "not colliding" the next frame. Without this probe, isGrounded would
    // oscillate every frame on stationary play — visible animation flicker,
    // sub-pixel y jitter, AND a false fall-off trampoline trickling +10
    // points every other frame at idle (BJ §5.4 falloff award firing on a
    // phantom edge). Probe: if the bottom edge is within 1 px of any
    // surface top with horizontal overlap, latch grounded. The canvas bottom
    // counts as a virtual surface — standing on it = grounded.
    // Only while not moving upward: on the jump frame the player rises less
    // than the probe's 1px tolerance at high refresh rates (e.g. ~0.7px at
    // 240Hz), so without the velocity check the probe would re-ground the
    // player and swallow the jump.
    if (!updatedPlayer.isGrounded && updatedPlayer.velocityY >= 0) {
      if (this.isRestingOnSurfaces(updatedPlayer, platforms)) {
        updatedPlayer.isGrounded = true;
        updatedPlayer.velocityY = 0;
      }
    }

    return updatedPlayer;
  }

  private isRestingOnSurfaces(p: Player, platforms: any[]): boolean {
    const TOL = 1.0;
    const bottom = p.y + p.height;
    for (const s of platforms) {
      if (
        bottom >= s.y - TOL &&
        bottom <= s.y + TOL &&
        p.x < s.x + s.width &&
        p.x + p.width > s.x
      ) {
        return true;
      }
    }
    // Floor-top resting check — the floor sprite's top is the new ground.
    if (
      bottom >= PLAYFIELD_BOTTOM - TOL &&
      p.x < GAME_CONFIG.CANVAS_WIDTH &&
      p.x + p.width > 0
    ) {
      return true;
    }
    return false;
  }

  /** Mutates `p`: snaps out of collider along normal, zeros that axis's velocity. */
  private applyResolution(
    p: Player,
    collision: { normal?: { x: number; y: number }; penetration?: number }
  ): void {
    if (!collision.normal || collision.penetration === undefined) return;
    if (collision.normal.y === -1) {
      // Landing on top of surface — reset gravity to apex (vy=0 baseline)
      // so walking off the next platform falls naturally. Also reset
      // jumpAdvanceRate so the next jump's modifier-derived rate applies
      // cleanly without inheriting the previous jump's slow-ascent state.
      p.y -= collision.penetration;
      p.velocityY = 0;
      p.isGrounded = true;
      p.isFloating = false;
      p.isJumping = false;
      p.gravityIndex = GRAVITY_APEX_INDEX;
      p.jumpAdvanceRate = 1.0;
    } else if (collision.normal.y === 1) {
      // Hitting surface from below — kill upward momentum, snap LUT to apex
      // so the next frame begins the natural descent.
      p.y += collision.penetration;
      p.velocityY = 0;
      p.gravityIndex = GRAVITY_APEX_INDEX;
    } else if (collision.normal.x === 1) {
      // Hit from the right
      p.x += collision.penetration;
      p.velocityX = 0;
      if (this.registerWallContact()) {
        this.fireTrampolineAction("wall-platform");
      }
    } else if (collision.normal.x === -1) {
      // Hit from the left
      p.x -= collision.penetration;
      p.velocityX = 0;
      if (this.registerWallContact()) {
        this.fireTrampolineAction("wall-platform");
      }
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
