# F-coin (Founder Mode) — Design

**Status:** Approved (brainstorm 2026-05-03). Pending PRD + implementation.
**Replaces:** Existing SPECIAL coin (orange, level-skip mechanic).

## 1. Concept

The F-coin is a super-rare "Founder Mode" pickup themed on the FAFO ("fuck around and find out") spirit of founder culture. Sigurd sends it on a wild move; the universe rewards him with a new business idea (Forretningsidee).

Mechanically, picking up an F-coin grants the player **+1 Forretningsidee** to their host-side balance. Forretningsidee is the same currency that the landing page sells via Stripe and that `deductCredits` consumes to start a run. So one F-coin = one free run.

## 2. Coin taxonomy (founder-themed)

Established mappings (M is shipped; B/P/F are the founder-themed direction we're heading):

| Letter | Name | Mechanic | Status |
|---|---|---|---|
| M | Mentor | Extra life | Shipped |
| B | (TBD — Brand / Buzz / Bootstrap) | Score multiplier bump | Theme TBD |
| P | (TBD — Pivot / PMF) | Power mode (freeze + kill monsters) | Theme TBD |
| F | **Founder Mode** | +1 Forretningsidee | **This doc** |

The old "S/SPECIAL" coin and its level-skip mechanic are deleted entirely.

## 3. Decisions

| | |
|---|---|
| Theme | Founder Mode (FAFO) |
| Letter | F |
| Color | Orange `#f97316` (kept from old SPECIAL) |
| Replaces | Old SPECIAL coin; level-skip mechanic deleted |
| Mechanic | On pickup → `window.sigurdGame.grantBusinessIdea(1)` |
| Spawn rate | 5% chance per game, rolled once at game start |
| Spawn placement | Random level 3-8, random valid position on that level |
| Rookie gate | **Never spawns on levels 1 or 2** |
| Hard cap | 2 per run (defense in depth; rarely reached at 5%) |
| Visual style | Same pixel-art octagon, pulse, and shadow as other coins. Letter "F". |
| Pickup feedback | Subtle: standard coin pulse + collection sound (unique variant) + small "+1 💡" floating text |
| Standalone fallback | Bridge call no-ops with warning; visual feedback still shows so devs see the feature |
| Failure handling | Fire-and-forget. No reconcile, no toast. |
| Tutorial | None. Surprise discovery — word-of-mouth design intent. |

## 4. Bridge contract change

Current `window.sigurdGame` (per `CLAUDE.md` §10) only supports `deductCredits`. F-coin requires a new method on the bridge:

```ts
interface SigurdBridge {
  // ...existing methods...
  grantBusinessIdea(amount: number): void;  // fire-and-forget
}
```

- **Fire-and-forget** — no Promise, no callback. The game does not await or branch on success/failure.
- **Idempotency is the host's problem.** The game may retry zero times.
- All bridge interaction goes through `src/bridge/bridge-adapter.ts`. The adapter must handle the standalone-mode fallback (no-op + warning).

This is a contract change. Per CLAUDE.md §6, this needs explicit approval before merging — and coordination with the landing page team since they own the host side.

## 5. Server-side requirements (host team must implement)

**Critical — without these, the game ships with a vulnerability that mints free Stripe-paid currency to anyone with browser devtools.**

The browser exposes `window.sigurdGame.grantBusinessIdea` to the player. A user can call `window.sigurdGame.grantBusinessIdea(99999)` from devtools without ever launching the game. The Firebase backend MUST NOT trust client calls. It must enforce:

1. **Signed game-session token.** When a run starts (after `deductCredits` succeeds), the backend issues a one-time secret tied to that session. `grantBusinessIdea` calls without a valid, unexpired, unreused token are rejected.
2. **Per-run cap.** Backend rejects more than 2 grants per game session, regardless of what the client sends. Mirrors the client-side cap.
3. **Rate limit.** Per-user/per-IP throttle to make automated abuse expensive. e.g. max 1 grant per 10s.
4. **Amount validation.** Reject any grant where `amount !== 1`. The contract is +1 per F-coin pickup; anything else is fraud.

These four mitigations together reduce the attack to "play games legitimately at the 5% drop rate to mint free credits at human speed" — which is the intended design.

## 6. Game-side implementation pointers

(Not implementation — just where the changes will land. Defer details to the PRD.)

- `src/config/coinTypes.ts` — replace `SPECIAL` entry with `FOUNDER_MODE`. New letter mapping. Color stays orange.
- `src/types/enums.ts` — `CoinType.SPECIAL` → `CoinType.FOUNDER_MODE` (or rename/repurpose).
- `src/managers/coinManager.ts` — replace `rollSCoinForLevel` with a game-start roll for F-coin. Enforce levels-1-2 exclusion and `maxFCoinSpawns = 2` cap.
- `src/managers/RenderManager.ts:303-306` — fix the if/else ladder so the F-coin renders the letter "F". (Existing SPECIAL coin currently falls through and renders "C" — that's a current bug.)
- `src/managers/AudioManager.ts` — add unique pickup sound variant for F-coin.
- `src/bridge/bridge-adapter.ts` — wire `grantBusinessIdea(1)` call on pickup; standalone fallback (no-op + warning).
- HUD/effects — small "+1 💡" floating text on pickup. Reuse existing floating-text helper if one exists.
- `specs/game-spec.md` — update coin section to reflect F-coin replacing SPECIAL.

## 7. Out of scope (explicitly)

- B-coin and P-coin theming (TBD; separate brainstorm).
- A future "business idea" coin distinct from F-coin (no longer needed — F-coin grants the Forretningsidee directly).
- Cross-run XP / meta-progression layer (rejected; F-coin instead grants currency directly).
- In-game balance display (Forretningsidee balance is shown by the host landing page, not in the game canvas).
- Tutorial / explicit player education (intentionally surprise-discovery).

## 8. Open items / known risks

- **Silent failure mode.** Fire-and-forget means a network failure at pickup loses the credit with no log. Acceptable for a 5%/run feature; if support tickets arrive, upgrade to optimistic-with-reconcile (see brainstorm transcript).
- **Host team coordination.** This design assumes the landing page team will (a) add `grantBusinessIdea` to the bridge, and (b) implement the four server-side mitigations in §5. Both are blockers for shipping.
- **The current `RenderManager` bug** — SPECIAL renders as "C" because the if/else ladder doesn't handle it. Fix lands as part of this work.
