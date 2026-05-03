import { log } from "./logger";

// ── Types matching the host site's bridge contract ──

export interface BalanceInfo {
  currentBalance: number;
  reason: "initial" | "game-deduct" | "purchase" | "reward" | "refund" | "sync";
}

export interface DeductResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

export interface SigurdGameBridge {
  // Existing
  sendGameCompletion: (data: any) => void;
  sendAudioSettings: (settings: any) => void;
  loadUserAudioSettings: (userId: string) => Promise<void>;

  // Balance
  getBalance: () => number;
  deductCredits: (amount: number) => Promise<DeductResult>;
  refreshBalance: () => Promise<number>;
  onBalanceChanged: (callback: (info: BalanceInfo) => void) => () => void;

  // Forretningsidee grant (F-coin pickup). Fire-and-forget.
  // Host MUST validate server-side: signed session token, per-run cap,
  // rate limit, amount === 1. Without those, devtools = free credits.
  grantBusinessIdea: (amount: number) => void;

  ready: boolean;
}

// Extend Window so TypeScript knows about the bridge
declare global {
  interface Window {
    sigurdGame?: SigurdGameBridge;
  }
}

// ── Bridge detection ──

const BRIDGE_READY_EVENT = "sigurdGame:bridge-ready";
const BRIDGE_TIMEOUT_MS = 3000;

/**
 * Wait for the host bridge to become available.
 * Resolves with the bridge if found, or null after timeout (standalone/dev mode).
 */
export function waitForBridge(): Promise<SigurdGameBridge | null> {
  if (window.sigurdGame?.ready) {
    log.debug("Game bridge already available");
    return Promise.resolve(window.sigurdGame);
  }

  return new Promise((resolve) => {
    const onReady = () => {
      clearTimeout(timer);
      log.debug("Game bridge detected via event");
      resolve(window.sigurdGame ?? null);
    };

    const timer = setTimeout(() => {
      window.removeEventListener(BRIDGE_READY_EVENT, onReady);
      log.debug("Game bridge not found — running in standalone mode");
      resolve(null);
    }, BRIDGE_TIMEOUT_MS);

    window.addEventListener(BRIDGE_READY_EVENT, onReady, { once: true });
  });
}

/**
 * Check if the bridge is currently available (synchronous).
 */
export function hasBridge(): boolean {
  return !!window.sigurdGame?.ready;
}

/**
 * Read the current balance synchronously. Returns null if no bridge.
 */
export function getBalance(): number | null {
  return window.sigurdGame?.ready ? window.sigurdGame.getBalance() : null;
}

/**
 * Deduct credits for a round. Returns the result, or a free-play success if no bridge.
 */
export async function deductCredits(amount: number): Promise<DeductResult> {
  if (!window.sigurdGame?.ready) {
    // Standalone mode — always succeed
    return { success: true, newBalance: -1 };
  }

  try {
    const result = await window.sigurdGame.deductCredits(amount);
    log.debug(`Deduct ${amount} credit(s): success=${result.success}, newBalance=${result.newBalance}`);
    return result;
  } catch (error) {
    log.warn("Failed to deduct credits:", error);
    return { success: false, newBalance: 0, error: "DEDUCTION_FAILED" };
  }
}

/**
 * Subscribe to balance changes. Returns unsubscribe function.
 * No-op if bridge isn't available.
 */
export function subscribeBalance(callback: (info: BalanceInfo) => void): () => void {
  if (!window.sigurdGame?.ready) {
    return () => {};
  }

  return window.sigurdGame.onBalanceChanged(callback);
}

/**
 * Grant Forretningsidee credit on F-coin pickup. Fire-and-forget.
 * Standalone mode: no-op + warning so the visual feedback still shows.
 */
export function grantBusinessIdea(amount: number): void {
  if (!window.sigurdGame?.ready) {
    log.warn(
      `grantBusinessIdea(${amount}) called in standalone mode — no host bridge to credit. Visual feedback only.`
    );
    return;
  }

  try {
    window.sigurdGame.grantBusinessIdea(amount);
    log.debug(`grantBusinessIdea(${amount}) sent to host`);
  } catch (error) {
    log.warn("grantBusinessIdea failed:", error);
  }
}
