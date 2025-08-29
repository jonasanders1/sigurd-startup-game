import { SpriteInstance } from "./SpriteInstance";

export type AnimationState = {
  isGrounded: boolean;
  isMoving: boolean;
  isFloating: boolean;
  gameState: string;
  moveDirection: "left" | "right" | "none";
  lastDirection: "left" | "right";
};

export class AnimationController {
  private sprite: SpriteInstance;
  private currentState: AnimationState;
  private wasInAir: boolean = false; // Track previous air state for landing detection
  private isLanding: boolean = false; // Track if currently playing landing animation
  private isMapCleared: boolean = false; // Track if map is cleared and player should fall
  private mapClearedFallComplete: boolean = false; // Track if falling is complete

  constructor(sprite: SpriteInstance) {
    this.sprite = sprite;
    this.currentState = {
      isGrounded: true,
      isMoving: false,
      isFloating: false,
      gameState: "",
      moveDirection: "none",
      lastDirection: "right",
    };
  }

  update(
    isGrounded: boolean,
    moveX: number,
    isFloating: boolean = false,
    gameState: string = ""
  ): void {
    const newState: AnimationState = {
      isGrounded,
      isMoving: moveX !== 0,
      isFloating,
      gameState,
      moveDirection: moveX > 0 ? "right" : moveX < 0 ? "left" : "none",
      lastDirection: this.getLastDirection(),
    };

    // Check for MAP_CLEARED state transition
    if (gameState === "MAP_CLEARED" && !this.isMapCleared) {
      this.isMapCleared = true;
      this.mapClearedFallComplete = false;

      // If player is already grounded when map is cleared, immediately complete
      if (isGrounded) {
        this.mapClearedFallComplete = true;
      }
    } else if (gameState !== "MAP_CLEARED" && this.isMapCleared) {
      // Reset MAP_CLEARED state when transitioning to a different state
      this.isMapCleared = false;
      this.mapClearedFallComplete = false;
    }

    // Check if landing animation finished
    if (this.isLanding) {
      const currentAnim = this.sprite.currentAnimation.name;
      if (
        currentAnim.includes("land") &&
        this.sprite.currentFrameIndex >=
          this.sprite.currentAnimation.frames.length - 1
      ) {
        this.isLanding = false;

        // If this was the map cleared landing, mark fall as complete
        if (this.isMapCleared) {
          this.mapClearedFallComplete = true;
        }
      }
    }

    // Check for landing transition
    const justLanded = this.wasInAir && isGrounded;

    this.currentState = newState;
    this.wasInAir = !isGrounded;

    if (justLanded && !this.isLanding && this.isMapCleared) {
      // Map cleared landing - play landing animation

      this.setLandingAnimation();
    } else if (justLanded && !this.isLanding) {
      // Normal landing - play landing animation

      this.setLandingAnimation();
    } else if (!this.isLanding) {
      // Normal animation update (only if not currently landing)
      this.updateAnimation();
    }
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
      gameState,
      moveDirection,
      lastDirection,
    } = this.currentState;

    if (this.isMapCleared) {
      if (this.mapClearedFallComplete) {
        // Fall complete - play completion animation

        this.sprite.setAnimation("ghost-complete");
      } else if (!isGrounded) {
        // Still falling - use jump animation

        this.handleAirAnimations(moveDirection, lastDirection);
      } else {
        // Player is on ground - they just landed from falling

        this.mapClearedFallComplete = true;
        this.sprite.setAnimation("ghost-complete");
      }
    } else if (gameState === "MAP_CLEARED") {
      this.isMapCleared = true;
      this.mapClearedFallComplete = false;
      // Start falling immediately
      this.handleAirAnimations(moveDirection, lastDirection);
    } else if (isFloating) {
      // Floating - check direction for float animation
      this.handleFloatAnimations(moveDirection, lastDirection);
    } else if (!isGrounded) {
      // In air - jump animations
      this.handleAirAnimations(moveDirection, lastDirection);
    } else if (isMoving) {
      // On ground and moving - walk animations
      this.handleWalkAnimations(moveDirection);
    } else {
      // On ground and not moving - idle animations
      this.handleIdleAnimations(lastDirection);
    }
  }

  private handleAirAnimations(
    moveDirection: "left" | "right" | "none",
    lastDirection: "left" | "right"
  ): void {
    if (moveDirection === "right") {
      this.sprite.setAnimationPreserveFrame("jump-right");
    } else if (moveDirection === "left") {
      this.sprite.setAnimationPreserveFrame("jump-left");
    } else {
      // No movement in air - maintain last direction
      const animation = lastDirection === "right" ? "jump-right" : "jump-left";
      this.sprite.setAnimationPreserveFrame(animation);
    }
  }

  private handleFloatAnimations(
    moveDirection: "left" | "right" | "none",
    lastDirection: "left" | "right"
  ): void {
    if (moveDirection === "right") {
      this.sprite.setAnimation("float-right");
    } else if (moveDirection === "left") {
      this.sprite.setAnimation("float-left");
    } else {
      // No movement while floating - use stationary float animation
      this.sprite.setAnimation("float-stationary");
    }
  }

  private handleWalkAnimations(moveDirection: "left" | "right" | "none"): void {
    if (moveDirection === "right") {
      this.sprite.setAnimation("walk-right");
    } else if (moveDirection === "left") {
      this.sprite.setAnimation("walk-left");
    }
  }

  private handleIdleAnimations(lastDirection: "left" | "right"): void {
    const animation = lastDirection === "right" ? "idle-right" : "idle-left";
    this.sprite.setAnimation(animation);
  }

  // Optional: Add landing animation support
  setLandingAnimation(): void {
    const { lastDirection } = this.currentState;
    const animation = lastDirection === "right" ? "land-right" : "land-left";

    this.sprite.setAnimation(animation);
    this.isLanding = true;
  }

  // Debug method
  getCurrentState(): AnimationState {
    return { ...this.currentState };
  }

  // Reset method for game state changes
  reset(): void {
    this.isMapCleared = false;
    this.mapClearedFallComplete = false;
    this.isLanding = false;
    this.wasInAir = false;
  }
}
