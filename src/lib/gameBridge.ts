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

  // Open the host's purchase page. Host decides UX (modal, route push, new tab).
  // Fire-and-forget. Optional — older hosts may not implement this; the package
  // falls back to same-tab navigation in that case.
  openPurchase?: () => void;

  // Open the host's leaderboard page. Same UX/contract as openPurchase —
  // host owns navigation; package falls back to same-tab nav otherwise.
  openLeaderboard?: () => void;

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
 * Fallback URLs used only when no host bridge is present (standalone / older
 * hosts without `openPurchase`). When the bridge is active, the host owns the
 * navigation and these are not used.
 *
 * Resolved at runtime from `window.location.hostname` — when the landing page
 * is being served locally (localhost / 127.0.0.1) the embedded package picks
 * the localhost URL; otherwise it picks production.
 */
const PURCHASE_URL_PROD = "https://sigurdstartup.jonasanders1.com/payment";
const PURCHASE_URL_LOCAL = "http://localhost:3000/payment";
const LEADERBOARD_URL_PROD = "https://sigurdstartup.jonasanders1.com/leaderboard";
const LEADERBOARD_URL_LOCAL = "http://localhost:3000/leaderboard";

export function getPurchasePageUrl(): string {
  if (typeof window === "undefined") return PURCHASE_URL_PROD;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? PURCHASE_URL_LOCAL
    : PURCHASE_URL_PROD;
}

export function getLeaderboardPageUrl(): string {
  if (typeof window === "undefined") return LEADERBOARD_URL_PROD;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? LEADERBOARD_URL_LOCAL
    : LEADERBOARD_URL_PROD;
}

/**
 * Trigger the host's purchase flow. Delegates to `bridge.openPurchase()` so
 * the host decides the UX (modal, in-app route, new tab, etc.). Falls back to
 * same-tab navigation in standalone / on older hosts that don't implement it.
 */
export function openPurchasePage(): void {
  const bridge = window.sigurdGame;
  if (bridge?.ready && typeof bridge.openPurchase === "function") {
    try {
      bridge.openPurchase();
      log.debug("openPurchase delegated to host bridge");
      return;
    } catch (error) {
      log.warn("Bridge openPurchase failed, falling back to same-tab nav:", error);
    }
  } else {
    log.debug("No bridge.openPurchase — falling back to same-tab nav");
  }
  window.location.href = getPurchasePageUrl();
}

/**
 * Open the host's leaderboard page. Same delegate-with-fallback contract as
 * openPurchasePage. Hosts that implement `openLeaderboard` own the UX (route
 * push, modal, new tab); otherwise the package navigates same-tab.
 */
export function openLeaderboardPage(): void {
  const bridge = window.sigurdGame;
  if (bridge?.ready && typeof bridge.openLeaderboard === "function") {
    try {
      bridge.openLeaderboard();
      log.debug("openLeaderboard delegated to host bridge");
      return;
    } catch (error) {
      log.warn("Bridge openLeaderboard failed, falling back to same-tab nav:", error);
    }
  } else {
    log.debug("No bridge.openLeaderboard — falling back to same-tab nav");
  }
  window.location.href = getLeaderboardPageUrl();
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
