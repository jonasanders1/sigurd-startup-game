# Architectural Decisions

Append-only log. Newest at top. Format: `YYYY-MM-DD: <decision>. Reason: <why>.`

---

2026-04-22: Menus and HUD are React components; Phaser owns the 800×600 playfield only. Reason: existing Newsprint Arcade design system in React is mature; rebuilding in Phaser UI primitives would be wasteful and lower quality.

2026-04-22: Use Phaser Arcade Physics, not Matter.js. Reason: spec §3/§4 physics (AABB, smallest-penetration resolution, custom gravity) map cleanly to Arcade; Matter is overkill.

2026-04-22: Custom gravity applied manually on player; `body.allowGravity = false`. Reason: spec §3.2 requires three distinct gravity values (normal/float/fast-fall) that Phaser's single-gravity system can't express.

2026-04-22: Cross-manager communication via EventBus only, no direct references. Reason: 8+ overlapping systems (bombs, 3 coin types, 5 monster types, spawning, scaling, scoring, audio, bridge); direct refs would tangle.

2026-04-22: Bridge access goes through `src/bridge/bridge-adapter.ts` exclusively. Reason: centralizes 3000ms detection timeout and standalone fallback per spec §16.3.
