import { Founding } from "../types/interfaces";
import { DEV_CONFIG } from "../types/constants";
import { log } from "../lib/logger";

export class FoundingManager {
  private foundings: Founding[] = [];
  private collectedFoundings = new Set<string>();
  private correctFoundings = new Set<string>();
  private activeGroup: number | null = null;
  private nextFoundingOrder: number | null = null;
  private gameStarted = false;

  constructor(foundings: Founding[]) {
    this.setFoundings(foundings);
  }

  reset(): void {
    this.collectedFoundings.clear();
    this.correctFoundings.clear();
    this.activeGroup = null;
    this.nextFoundingOrder = null;
    this.gameStarted = false;
  }

  /** Clear active group/next-order tracking; preserves collection progress. */
  resetActiveSequence(): void {
    this.activeGroup = null;
    this.nextFoundingOrder = null;
    this.gameStarted = false;
  }

  setFoundings(foundings: Founding[]): void {
    this.foundings = foundings;
  }

  handleFoundingClick(
    group: number,
    order: number
  ): { isValid: boolean; isCorrect: boolean; gameCompleted: boolean } {
    const foundingId = `${group}-${order}`;

    if (DEV_CONFIG.ENABLED) {
      log.debug(`USER CLICK: Group ${group}, Order ${order}`);
    }

    // Check if founding is already collected
    if (this.collectedFoundings.has(foundingId)) {
      if (DEV_CONFIG.ENABLED) {
        log.debug("Founding already collected!");
      }
      return { isValid: false, isCorrect: false, gameCompleted: false };
    }

    // If game hasn't started yet, start it with this founding
    if (!this.gameStarted) {
      if (DEV_CONFIG.ENABLED) {
        log.debug("Starting new game...");
      }
      this.startGame(group, order);
      this.collectFounding(foundingId, true);
      this.updateNextFounding();
      return {
        isValid: true,
        isCorrect: true,
        gameCompleted: this.isGameCompleted(),
      };
    }

    // Check if this is a valid founding to click (correct order)
    const isCorrectOrder = this.isValidFounding(group, order);

    if (isCorrectOrder) {
      if (DEV_CONFIG.ENABLED) {
        log.debug("Correct order - collecting founding");
      }
      this.collectFounding(foundingId, true);
      this.updateNextFounding();
    } else {
      if (DEV_CONFIG.ENABLED) {
        log.debug("Wrong order - but collecting anyway");
        log.debug(
          `   Expected: Group ${this.activeGroup}, Order ${this.nextFoundingOrder}`
        );
        log.debug(`   Clicked: Group ${group}, Order ${order}`);
      }
      this.collectFounding(foundingId, false);
      // Don't update next founding - keep the same target
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
    this.nextFoundingOrder = this.findLowestOrderInGroup(group);

    if (DEV_CONFIG.ENABLED) {
      log.debug(`GAME STARTED:`);
      log.debug(`   Started with: Group ${group}, Order ${order}`);
      log.debug(`   Active group: ${this.activeGroup}`);
      log.debug(`   Next target: Order ${this.nextFoundingOrder}`);
    }
  }

  private isValidFounding(group: number, order: number): boolean {
    if (this.activeGroup === null || this.nextFoundingOrder === null) {
      return false;
    }

    return (
      group === this.activeGroup &&
      order === this.nextFoundingOrder &&
      !this.collectedFoundings.has(`${group}-${order}`)
    );
  }

  private collectFounding(foundingId: string, isCorrect: boolean): void {
    this.collectedFoundings.add(foundingId);

    if (isCorrect) {
      this.correctFoundings.add(foundingId);
      if (DEV_CONFIG.ENABLED) {
        log.debug(
          `Correct founding collected (${this.correctFoundings.size} correct so far)`
        );
      }
    } else {
      if (DEV_CONFIG.ENABLED) {
        log.debug(
          `Wrong founding collected (${this.correctFoundings.size} correct so far)`
        );
      }
    }

    if (DEV_CONFIG.ENABLED) {
      log.founding(`FOUNDING COLLECTED: ${foundingId}`);
      log.founding(
        `Progress: ${this.collectedFoundings.size}/${this.foundings.length} foundings collected`
      );
    }
  }

  private updateNextFounding(): void {
    if (this.activeGroup === null) return;

    if (DEV_CONFIG.ENABLED) {
      log.debug(`UPDATING NEXT FOUNDING:`);
    }

    // Check if current group is completed
    if (this.isGroupCompleted(this.activeGroup)) {
      log.debug(`GROUP ${this.activeGroup} COMPLETED!`);
      const nextGroup = this.findNextAvailableGroup();

      if (nextGroup !== null) {
        this.activeGroup = nextGroup;
        this.nextFoundingOrder = this.findLowestOrderInGroup(nextGroup);
        if (DEV_CONFIG.ENABLED) {
          log.debug(
            `Moving to next group: Group ${this.activeGroup}, Order ${this.nextFoundingOrder}`
          );
        }
      } else {
        if (DEV_CONFIG.ENABLED) {
          log.debug("ALL GROUPS COMPLETED!");
        }
        this.activeGroup = null;
        this.nextFoundingOrder = null;
        return;
      }
    } else {
      // Find the next available order in the current group
      const nextOrder = this.findNextAvailableOrderInGroup(this.activeGroup);
      if (nextOrder !== null) {
        this.nextFoundingOrder = nextOrder;
        if (DEV_CONFIG.ENABLED) {
          log.debug(`Next in current group: Order ${this.nextFoundingOrder}`);
        }
      }
    }
  }

  private isGroupCompleted(group: number): boolean {
    const groupFoundings = this.foundings.filter((founding) => founding.group === group);
    return groupFoundings.every((founding) => {
      const foundingId = `${founding.group}-${founding.order}`;
      return this.collectedFoundings.has(foundingId);
    });
  }

  private findNextAvailableGroup(): number | null {
    const allGroups = [...new Set(this.foundings.map((founding) => founding.group))].sort(
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
    const groupFoundings = this.foundings.filter((founding) => founding.group === group);
    const uncollectedFoundings = groupFoundings.filter((founding) => {
      const foundingId = `${founding.group}-${founding.order}`;
      return !this.collectedFoundings.has(foundingId);
    });

    if (uncollectedFoundings.length > 0) {
      return Math.min(...uncollectedFoundings.map((founding) => founding.order));
    }
    return null;
  }

  private findNextAvailableOrderInGroup(group: number): number | null {
    return this.findLowestOrderInGroup(group);
  }

  private isGameCompleted(): boolean {
    return this.collectedFoundings.size === this.foundings.length;
  }

  // Getters for accessing state
  getCollectedFoundings(): Set<string> {
    return new Set(this.collectedFoundings);
  }

  getCorrectFoundings(): Set<string> {
    return new Set(this.correctFoundings);
  }

  getActiveGroup(): number | null {
    return this.activeGroup;
  }

  getNextFoundingOrder(): number | null {
    return this.nextFoundingOrder;
  }

  isGameStarted(): boolean {
    return this.gameStarted;
  }

  getCorrectOrderCount(): number {
    return this.correctFoundings.size;
  }
}
