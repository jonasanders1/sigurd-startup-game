/**
 * Coin physics tests.
 *
 * Covers the per-type coin behavior from game-specs §7 / CLAUDE.md §7:
 *  - STANDARD coins fall under gravity and bounce off walls/floor with damping;
 *  - POWER (P) coins ignore gravity and reflect (no energy loss);
 *  - collected coins are inert.
 *
 * Constants (config/coins.ts): GRAVITY 0.1, BOUNCE_DAMPING 0.8, BOUNCE_SPEED 3.
 * Canvas width 800; PLAYFIELD_BOTTOM = 575 (600 - 25px floor).
 * deltaTime 16.67ms => frame multiplier 1 (the 60fps baseline).
 */

import { describe, it, expect } from "vitest";
import { CoinPhysics } from "./coinPhysics";
import { COIN_PHYSICS } from "../config/coinTypes";
import { GAME_CONFIG } from "../types/constants";
import { PLAYFIELD_BOTTOM } from "../config/floor";
import type { Coin, Platform } from "../types/interfaces";

const FRAME = 16.67; // ms => frameMultiplier 1

const makeCoin = (over: Partial<Coin> = {}): Coin => ({
  x: 400,
  y: 300,
  width: 25,
  height: 25,
  type: "STANDARD",
  isCollected: false,
  velocityX: 0,
  velocityY: 0,
  spawnX: 400,
  spawnY: 300,
  ...over,
});

describe("CoinPhysics - inert states", () => {
  it("does not move a collected coin", () => {
    const coin = makeCoin({ isCollected: true, velocityX: 5, velocityY: 5 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.STANDARD, FRAME);
    expect(coin.x).toBe(400);
    expect(coin.y).toBe(300);
  });
});

describe("CoinPhysics - STANDARD coin", () => {
  it("applies gravity each frame", () => {
    const coin = makeCoin({ x: 400, y: 100, velocityX: 0, velocityY: 0 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.STANDARD, FRAME);
    expect(coin.velocityY).toBeCloseTo(GAME_CONFIG.COIN_GRAVITY, 10); // 0.1
    expect(coin.y).toBeCloseTo(100 + GAME_CONFIG.COIN_GRAVITY, 10); // 100.1
  });

  it("bounces off the left wall with damping", () => {
    const coin = makeCoin({ x: 2, y: 300, velocityX: -10, velocityY: 0 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.STANDARD, FRAME);
    expect(coin.x).toBe(0);
    // reflected and damped: |−10| * 0.8 = 8, now moving right
    expect(coin.velocityX).toBeCloseTo(8, 10);
  });

  it("bounces off the right wall with damping", () => {
    const coin = makeCoin({ x: 790, y: 300, velocityX: 10, velocityY: 0 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.STANDARD, FRAME);
    expect(coin.x).toBe(GAME_CONFIG.CANVAS_WIDTH - coin.width); // 775
    expect(coin.velocityX).toBeCloseTo(-8, 10); // now moving left
  });

  it("bounces off the floor (PLAYFIELD_BOTTOM) with damping", () => {
    const coin = makeCoin({ x: 400, y: 560, velocityX: 0, velocityY: 10 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.STANDARD, FRAME);
    expect(coin.y).toBe(PLAYFIELD_BOTTOM - coin.height); // 550
    expect(coin.velocityY).toBeLessThan(0); // bounced upward
  });
});

describe("CoinPhysics - POWER coin (reflective, no gravity)", () => {
  it("ignores gravity", () => {
    const coin = makeCoin({ type: "POWER", x: 400, y: 100, velocityY: 0 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.POWER, FRAME);
    expect(coin.velocityY).toBe(0); // no gravity added
  });

  it("reflects off a wall without losing speed", () => {
    const coin = makeCoin({ type: "POWER", x: 2, y: 300, velocityX: -10 });
    CoinPhysics.updateCoin(coin, [], COIN_PHYSICS.POWER, FRAME);
    expect(coin.x).toBe(0);
    expect(coin.velocityX).toBe(10); // perfect reflection, no damping
  });

  it("reflects off a platform face and is pushed clear of it", () => {
    // Platform occupies x[400..500], y[300..400]. Coin drifts in from the
    // left face moving right; after the frame step it overlaps, so it should
    // reflect (vx: +5 -> -5) and be repositioned just left of the platform.
    const platform: Platform = {
      x: 400,
      y: 300,
      width: 100,
      height: 100,
      color: "#000",
    };
    const coin = makeCoin({
      type: "POWER",
      x: 380,
      y: 340,
      velocityX: 5,
      velocityY: 0,
    });
    CoinPhysics.updateCoin(coin, [platform], COIN_PHYSICS.POWER, FRAME);
    expect(coin.velocityX).toBeCloseTo(-5, 10); // horizontal reflection
    expect(coin.x).toBe(platform.x - coin.width - 1); // 374, clear of platform
  });
});

describe("CoinPhysics - initial velocity", () => {
  it("launches standard coins upward within the bounce-speed range", () => {
    const v = CoinPhysics.createInitialVelocity();
    expect(v.velocityY).toBe(-GAME_CONFIG.COIN_BOUNCE_SPEED); // -3, upward
    expect(Math.abs(v.velocityX)).toBeLessThanOrEqual(
      GAME_CONFIG.COIN_BOUNCE_SPEED
    );
  });

  it("gives power coins a fixed-speed velocity at the requested angle", () => {
    // 0 degrees => straight right at full bounce speed.
    const v = CoinPhysics.createPowerCoinVelocity(0);
    expect(v.velocityX).toBeCloseTo(GAME_CONFIG.COIN_BOUNCE_SPEED, 10);
    expect(v.velocityY).toBeCloseTo(0, 10);
  });
});
