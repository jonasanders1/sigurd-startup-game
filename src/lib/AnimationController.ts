import { SpriteInstance } from "./SpriteInstance";

export type AnimationState = {
  isGrounded: boolean;
  isMoving: boolean;
  isFloating: boolean;
  isFalling: boolean;
  gameState: string;
  moveDirection: "left" | "right" | "none";
  lastDirection: "left" | "right";
};

/** ms after touching down to keep playing the land animation. */
const LAND_DURATION_MS = 240;

export class AnimationController {
  private sprite: SpriteInstance;
  private currentState: AnimationState;
  private isMapCleared: boolean = false;
  private wasGrounded: boolean = true;
  private landingUntil: number = 0;

  constructor(sprite: SpriteInstance) {
    this.sprite = sprite;
    this.currentState = {
      isGrounded: true,
      isMoving: false,
      isFloating: false,
      isFalling: false,
      gameState: "",
      moveDirection: "none",
      lastDirection: "right",
    };
  }

  update(
    isGrounded: boolean,
    moveX: number,
    isFloating: boolean = false,
    gameState: string = "",
    velocityY: number = 0
  ): void {
    const newState: AnimationState = {
      isGrounded,
      isMoving: moveX !== 0,
      isFloating,
      isFalling: velocityY > 0,
      gameState,
      moveDirection: moveX > 0 ? "right" : moveX < 0 ? "left" : "none",
      lastDirection: this.getLastDirection(),
    };

    if (gameState === "MAP_CLEARED" && !this.isMapCleared) {
      this.isMapCleared = true;
    } else if (gameState !== "MAP_CLEARED" && this.isMapCleared) {
      this.isMapCleared = false;
    }

    // Detect the air→ground transition and arm the land window.
    if (!this.wasGrounded && isGrounded) {
      this.landingUntil = performance.now() + LAND_DURATION_MS;
    }
    this.wasGrounded = isGrounded;

    this.currentState = newState;
    this.updateAnimation();
  }

  private getLastDirection(): "left" | "right" {
    const currentAnim = this.sprite.currentAnimation.name;
    return currentAnim.includes("right") ? "right" : "left";
  }

  private updateAnimation(): void {
    const {
      isGrounded,
      isMoving,
      isFloating,
      moveDirection,
      lastDirection,
    } = this.currentState;

    // Map-cleared victory takes priority once Sigurd is grounded.
    if (this.isMapCleared && isGrounded) {
      this.handleVictoryAnimations(lastDirection);
      return;
    }

    if (isFloating) {
      this.handleFloatAnimations(moveDirection, lastDirection);
    } else if (!isGrounded) {
      this.handleAirAnimations(moveDirection, lastDirection);
    } else if (performance.now() < this.landingUntil) {
      this.handleLandAnimations(lastDirection);
    } else if (isMoving) {
      this.handleRunAnimations(moveDirection);
    } else {
      this.handleIdleAnimations(lastDirection);
    }
  }

  private handleAirAnimations(
    moveDirection: "left" | "right" | "none",
    lastDirection: "left" | "right"
  ): void {
    // Airborne + holding a direction → frozen mid-run pose.
    if (moveDirection === "right") {
      this.sprite.setAnimation("air-move-right");
      return;
    }
    if (moveDirection === "left") {
      this.sprite.setAnimation("air-move-left");
      return;
    }
    // No directional input → normal jump/fall animation.
    const verb = this.currentState.isFalling ? "fall" : "jump";
    const animation =
      lastDirection === "right" ? `${verb}-right` : `${verb}-left`;
    this.sprite.setAnimationPreserveFrame(animation);
  }

  private handleFloatAnimations(
    moveDirection: "left" | "right" | "none",
    _lastDirection: "left" | "right"
  ): void {
    if (moveDirection === "right") {
      this.sprite.setAnimation("float-right");
    } else if (moveDirection === "left") {
      this.sprite.setAnimation("float-left");
    } else {
      // Stationary float = the dedicated straight-down pose.
      this.sprite.setAnimation("float-down");
    }
  }

  private handleRunAnimations(moveDirection: "left" | "right" | "none"): void {
    if (moveDirection === "right") {
      this.sprite.setAnimation("run-right");
    } else if (moveDirection === "left") {
      this.sprite.setAnimation("run-left");
    }
  }

  private handleIdleAnimations(lastDirection: "left" | "right"): void {
    const animation = lastDirection === "right" ? "idle-right" : "idle-left";
    this.sprite.setAnimation(animation);
  }

  private handleLandAnimations(lastDirection: "left" | "right"): void {
    const animation = lastDirection === "right" ? "land-right" : "land-left";
    this.sprite.setAnimation(animation);
  }

  private handleVictoryAnimations(lastDirection: "left" | "right"): void {
    const animation = lastDirection === "right" ? "victory-right" : "victory-left";
    this.sprite.setAnimation(animation);
  }

  getCurrentState(): AnimationState {
    return { ...this.currentState };
  }

  reset(): void {
    this.isMapCleared = false;
    this.wasGrounded = true;
    this.landingUntil = 0;
  }
}
