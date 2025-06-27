import { Bomb } from '../types/interfaces';

export class BombManager {
  private bombs: Bomb[] = [];
  private collectedBombs = new Set<string>();
  private correctBombs = new Set<string>();
  private activeGroup: number | null = null;
  private nextBombOrder: number | null = null;
  private gameStarted = false;

  constructor(bombs: Bomb[]) {
    this.bombs = bombs;
    this.reset();
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
    this.reset();
  }

  handleBombClick(group: number, order: number): { isValid: boolean; isCorrect: boolean; gameCompleted: boolean } {
    const bombId = `${group}-${order}`;
    
    console.log(`🎯 USER CLICK: Group ${group}, Order ${order}`);
    
    // Check if bomb is already collected
    if (this.collectedBombs.has(bombId)) {
      console.log("❌ Bomb already collected!");
      return { isValid: false, isCorrect: false, gameCompleted: false };
    }

    // If game hasn't started, start with this bomb
    if (!this.gameStarted) {
      console.log("🎮 Starting new game...");
      this.startGame(group, order);
      this.collectBomb(bombId, true);
      this.updateNextBomb();
      return { 
        isValid: true, 
        isCorrect: true, 
        gameCompleted: this.isGameCompleted() 
      };
    }

    // Check if this is a valid bomb to click (correct order)
    const isCorrectOrder = this.isValidBomb(group, order);
    
    if (isCorrectOrder) {
      console.log("✅ Correct order - collecting bomb");
      this.collectBomb(bombId, true);
      this.updateNextBomb();
    } else {
      console.log("⚠️  Wrong order - but collecting anyway");
      console.log(`   Expected: Group ${this.activeGroup}, Order ${this.nextBombOrder}`);
      console.log(`   Clicked: Group ${group}, Order ${order}`);
      this.collectBomb(bombId, false);
      // Don't update next bomb - keep the same target
    }

    return { 
      isValid: true, 
      isCorrect: isCorrectOrder, 
      gameCompleted: this.isGameCompleted() 
    };
  }

  private startGame(group: number, order: number): void {
    this.gameStarted = true;
    this.activeGroup = group;
    this.nextBombOrder = this.findLowestOrderInGroup(group);
    
    console.log(`🎮 GAME STARTED:`);
    console.log(`   Started with: Group ${group}, Order ${order}`);
    console.log(`   Active group: ${this.activeGroup}`);
    console.log(`   Next target: Order ${this.nextBombOrder}`);
  }

  private isValidBomb(group: number, order: number): boolean {
    if (this.activeGroup === null || this.nextBombOrder === null) {
      return false;
    }

    return group === this.activeGroup && 
           order === this.nextBombOrder && 
           !this.collectedBombs.has(`${group}-${order}`);
  }

  private collectBomb(bombId: string, isCorrect: boolean): void {
    this.collectedBombs.add(bombId);
    
    if (isCorrect) {
      this.correctBombs.add(bombId);
      console.log(`✅ Correct bomb collected (${this.correctBombs.size} correct so far)`);
    } else {
      console.log(`⚠️  Wrong bomb collected (${this.correctBombs.size} correct so far)`);
    }
    
    console.log(`💣 BOMB COLLECTED: ${bombId}`);
    console.log(`📈 Progress: ${this.collectedBombs.size}/${this.bombs.length} bombs collected`);
  }

  private updateNextBomb(): void {
    if (this.activeGroup === null) return;

    console.log(`🔄 UPDATING NEXT BOMB:`);
    
    // Check if current group is completed
    if (this.isGroupCompleted(this.activeGroup)) {
      console.log(`🏆 GROUP ${this.activeGroup} COMPLETED!`);
      const nextGroup = this.findNextAvailableGroup();
      
      if (nextGroup !== null) {
        this.activeGroup = nextGroup;
        this.nextBombOrder = this.findLowestOrderInGroup(nextGroup);
        console.log(`➡️  Moving to next group: Group ${this.activeGroup}, Order ${this.nextBombOrder}`);
      } else {
        console.log("🎉 ALL GROUPS COMPLETED!");
        this.activeGroup = null;
        this.nextBombOrder = null;
        return;
      }
    } else {
      // Find the next available order in the current group
      const nextOrder = this.findNextAvailableOrderInGroup(this.activeGroup);
      if (nextOrder !== null) {
        this.nextBombOrder = nextOrder;
        console.log(`➡️  Next in current group: Order ${this.nextBombOrder}`);
      }
    }
  }

  private isGroupCompleted(group: number): boolean {
    const groupBombs = this.bombs.filter(bomb => bomb.group === group);
    return groupBombs.every(bomb => {
      const bombId = `${bomb.group}-${bomb.order}`;
      return this.collectedBombs.has(bombId);
    });
  }

  private findNextAvailableGroup(): number | null {
    const allGroups = [...new Set(this.bombs.map(bomb => bomb.group))].sort((a, b) => a - b);
    
    for (let group of allGroups) {
      if (!this.isGroupCompleted(group)) {
        return group;
      }
    }
    return null;
  }

  private findLowestOrderInGroup(group: number): number | null {
    const groupBombs = this.bombs.filter(bomb => bomb.group === group);
    const uncollectedBombs = groupBombs.filter(bomb => {
      const bombId = `${bomb.group}-${bomb.order}`;
      return !this.collectedBombs.has(bombId);
    });

    if (uncollectedBombs.length > 0) {
      return Math.min(...uncollectedBombs.map(bomb => bomb.order));
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