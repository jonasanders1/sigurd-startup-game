import { Bomb } from "../types/interfaces";
import { DEV_CONFIG } from "../types/constants";
import { log } from "../lib/logger";

export class BombManager {
  private bombs: Bomb[] = [];
  private collectedBombs = new Set<string>();
  private correctBombs = new Set<string>();
  private activeGroup: number | null = null;
  private nextBombOrder: number | null = null;
  private gameStarted = false;

  constructor(bombs: Bomb[]) {
    this.setBombs(bombs);
  }

  reset(): void {
    this.collectedBombs.clear();
    this.correctBombs.clear();
    this.activeGroup = null;
    this.nextBombOrder = null;
    this.gameStarted = false;
  }

  setBombs(bombs: Bomb[]): void {
    this.bombs = bombs;
  }

  handleBombClick(
    group: number,
    order: number
  ): { isValid: boolean; isCorrect: boolean; gameCompleted: boolean } {
    const bombId = `${group}-${order}`;

    if (DEV_CONFIG.ENABLED) {
      log.dev(`USER CLICK: Group ${group}, Order ${order}`);
    }

    // Check if bomb is already collected
    if (this.collectedBombs.has(bombId)) {
      if (DEV_CONFIG.ENABLED) {
        log.dev("Bomb already collected!");
      }
      return { isValid: false, isCorrect: false, gameCompleted: false };
    }

    // If game hasn't started yet, start it with this bomb
    if (!this.gameStarted) {
      if (DEV_CONFIG.ENABLED) {
        log.dev("Starting new game...");
      }
      this.startGame(group, order);
      this.collectBomb(bombId, true);
      this.updateNextBomb();
      return {
        isValid: true,
        isCorrect: true,
        gameCompleted: this.isGameCompleted(),
      };
    }

    // Check if this is a valid bomb to click (correct order)
    const isCorrectOrder = this.isValidBomb(group, order);

    if (isCorrectOrder) {
      if (DEV_CONFIG.ENABLED) {
        log.dev("Correct order - collecting bomb");
      }
      this.collectBomb(bombId, true);
      this.updateNextBomb();
    } else {
      if (DEV_CONFIG.ENABLED) {
        log.dev("Wrong order - but collecting anyway");
        log.dev(
          `   Expected: Group ${this.activeGroup}, Order ${this.nextBombOrder}`
        );
        log.dev(`   Clicked: Group ${group}, Order ${order}`);
      }
      this.collectBomb(bombId, false);
      // Don't update next bomb - keep the same target
    }

    return {
      isValid: true,
      isCorrect: isCorrectOrder,
      gameCompleted: this.isGameCompleted(),
    };
  }

  private startGame(group: number, order: number): void {
    this.gameStarted = true;
    this.activeGroup = group;
    this.nextBombOrder = this.findLowestOrderInGroup(group);

    if (DEV_CONFIG.ENABLED) {
      log.dev(`GAME STARTED:`);
      log.dev(`   Started with: Group ${group}, Order ${order}`);
      log.dev(`   Active group: ${this.activeGroup}`);
      log.dev(`   Next target: Order ${this.nextBombOrder}`);
    }
  }

  private isValidBomb(group: number, order: number): boolean {
    if (this.activeGroup === null || this.nextBombOrder === null) {
      return false;
    }

    return (
      group === this.activeGroup &&
      order === this.nextBombOrder &&
      !this.collectedBombs.has(`${group}-${order}`)
    );
  }

  private collectBomb(bombId: string, isCorrect: boolean): void {
    this.collectedBombs.add(bombId);

    if (isCorrect) {
      this.correctBombs.add(bombId);
      if (DEV_CONFIG.ENABLED) {
        log.dev(
          `Correct bomb collected (${this.correctBombs.size} correct so far)`
        );
      }
    } else {
      if (DEV_CONFIG.ENABLED) {
        log.dev(
          `Wrong bomb collected (${this.correctBombs.size} correct so far)`
        );
      }
    }

    if (DEV_CONFIG.ENABLED) {
      log.bomb(`BOMB COLLECTED: ${bombId}`);
      log.bomb(
        `Progress: ${this.collectedBombs.size}/${this.bombs.length} bombs collected`
      );
    }
  }

  private updateNextBomb(): void {
    if (this.activeGroup === null) return;

    if (DEV_CONFIG.ENABLED) {
      log.dev(`UPDATING NEXT BOMB:`);
    }

    // Check if current group is completed
    if (this.isGroupCompleted(this.activeGroup)) {
      log.dev(`GROUP ${this.activeGroup} COMPLETED!`);
      const nextGroup = this.findNextAvailableGroup();

      if (nextGroup !== null) {
        this.activeGroup = nextGroup;
        this.nextBombOrder = this.findLowestOrderInGroup(nextGroup);
        if (DEV_CONFIG.ENABLED) {
          log.dev(
            `Moving to next group: Group ${this.activeGroup}, Order ${this.nextBombOrder}`
          );
        }
      } else {
        if (DEV_CONFIG.ENABLED) {
          log.dev("ALL GROUPS COMPLETED!");
        }
        this.activeGroup = null;
        this.nextBombOrder = null;
        return;
      }
    } else {
      // Find the next available order in the current group
      const nextOrder = this.findNextAvailableOrderInGroup(this.activeGroup);
      if (nextOrder !== null) {
        this.nextBombOrder = nextOrder;
        if (DEV_CONFIG.ENABLED) {
          log.dev(`Next in current group: Order ${this.nextBombOrder}`);
        }
      }
    }
  }

  private isGroupCompleted(group: number): boolean {
    const groupBombs = this.bombs.filter((bomb) => bomb.group === group);
    return groupBombs.every((bomb) => {
      const bombId = `${bomb.group}-${bomb.order}`;
      return this.collectedBombs.has(bombId);
    });
  }

  private findNextAvailableGroup(): number | null {
    const allGroups = [...new Set(this.bombs.map((bomb) => bomb.group))].sort(
      (a, b) => a - b
    );

    for (const group of allGroups) {
      if (!this.isGroupCompleted(group)) {
        return group;
      }
    }
    return null;
  }

  private findLowestOrderInGroup(group: number): number | null {
    const groupBombs = this.bombs.filter((bomb) => bomb.group === group);
    const uncollectedBombs = groupBombs.filter((bomb) => {
      const bombId = `${bomb.group}-${bomb.order}`;
      return !this.collectedBombs.has(bombId);
    });

    if (uncollectedBombs.length > 0) {
      return Math.min(...uncollectedBombs.map((bomb) => bomb.order));
    }
    return null;
  }

  private findNextAvailableOrderInGroup(group: number): number | null {
    return this.findLowestOrderInGroup(group);
  }

  private isGameCompleted(): boolean {
    return this.collectedBombs.size === this.bombs.length;
  }

  // Getters for accessing state
  getCollectedBombs(): Set<string> {
    return new Set(this.collectedBombs);
  }

  getCorrectBombs(): Set<string> {
    return new Set(this.correctBombs);
  }

  getActiveGroup(): number | null {
    return this.activeGroup;
  }

  getNextBombOrder(): number | null {
    return this.nextBombOrder;
  }

  isGameStarted(): boolean {
    return this.gameStarted;
  }

  getCorrectOrderCount(): number {
    return this.correctBombs.size;
  }
}
