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

export class AnimationController {
  private sprite: SpriteInstance;
  private currentState: AnimationState;
  private isMapCleared: boolean = false;

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

    if (isFloating) {
      this.handleFloatAnimations(moveDirection, lastDirection);
    } else if (!isGrounded) {
      this.handleAirAnimations(moveDirection, lastDirection);
    } else if (isMoving) {
      this.handleWalkAnimations(moveDirection);
    } else {
      // On ground and not moving — idle (covers both normal idle and victory).
      this.handleIdleAnimations(lastDirection);
    }
  }

  private handleAirAnimations(
    moveDirection: "left" | "right" | "none",
    lastDirection: "left" | "right"
  ): void {
    // Use fall sprite while descending, jump sprite while rising
    const verb = this.currentState.isFalling ? "fall" : "jump";
    if (moveDirection === "right") {
      this.sprite.setAnimationPreserveFrame(`${verb}-right`);
    } else if (moveDirection === "left") {
      this.sprite.setAnimationPreserveFrame(`${verb}-left`);
    } else {
      const animation =
        lastDirection === "right" ? `${verb}-right` : `${verb}-left`;
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

  getCurrentState(): AnimationState {
    return { ...this.currentState };
  }

  reset(): void {
    this.isMapCleared = false;
  }
}
