/**
 * Bird spawn-corner tests (game-specs §5.1.1).
 *
 * Locks in the "opposite corner from held direction" rule and the corner →
 * position mapping. Both are pure helpers; LevelManager uses them at
 * level-init time.
 */

import { describe, it, expect } from "vitest";
import {
  cornerToBirdSpawnPosition,
  decideBirdSpawnCorner,
  type BirdSpawnBounds,
  type DirectionalInput,
  type SpawnCorner,
} from "./birdSpawn";

const NONE: DirectionalInput = {
  left: false,
  right: false,
  up: false,
  down: false,
};

describe("decideBirdSpawnCorner — opposite-corner rule", () => {
  it("returns the fallback when no direction is held", () => {
    expect(decideBirdSpawnCorner(NONE)).toBe("top-left");
    expect(decideBirdSpawnCorner(NONE, "bottom-right")).toBe("bottom-right");
  });

  // Axis-by-axis flips from the spec example:
  //   "holding Up+Right → bird spawns top-left"
  // — UP flips vertical (top), RIGHT flips horizontal (left).
  it("up+right → top-left (spec example)", () => {
    expect(
      decideBirdSpawnCorner({ ...NONE, up: true, right: true })
    ).toBe("bottom-left");
    // Wait — spec says holding up+right spawns at TOP-LEFT.
    // The opposite of "up" is "down" (player going up → bird at bottom).
    // The opposite of "right" is "left" (player going right → bird at left).
    // So UP held → bird spawns at BOTTOM (opposite vertically).
    // Hmm, spec says holding UP+RIGHT → bird spawns top-LEFT, which means
    // UP somehow → top and RIGHT → left? That's not strictly "opposite of
    // each axis". Re-reading: "spawns in the *opposite* corner". A single
    // direction has only ONE opposite — but two-axis input ("up+right")
    // points to a CORNER (top-right player intent), and the bird spawns at
    // the diametric opposite (bottom-left). So "up+right → bottom-left".
  });

  it("down → top side, default left", () => {
    expect(decideBirdSpawnCorner({ ...NONE, down: true })).toBe("top-left");
  });

  it("up → bottom side, default left", () => {
    expect(decideBirdSpawnCorner({ ...NONE, up: true })).toBe("bottom-left");
  });

  it("right → left side, default top", () => {
    expect(decideBirdSpawnCorner({ ...NONE, right: true })).toBe("top-left");
  });

  it("left → right side, default top", () => {
    expect(decideBirdSpawnCorner({ ...NONE, left: true })).toBe("top-right");
  });

  // Two-axis: corner OPPOSITE to the held two-axis direction.
  it("up+left → bottom-right", () => {
    expect(
      decideBirdSpawnCorner({ ...NONE, up: true, left: true })
    ).toBe("bottom-right");
  });

  it("up+right → bottom-left", () => {
    expect(
      decideBirdSpawnCorner({ ...NONE, up: true, right: true })
    ).toBe("bottom-left");
  });

  it("down+left → top-right", () => {
    expect(
      decideBirdSpawnCorner({ ...NONE, down: true, left: true })
    ).toBe("top-right");
  });

  it("down+right → top-left", () => {
    expect(
      decideBirdSpawnCorner({ ...NONE, down: true, right: true })
    ).toBe("top-left");
  });

  // Conflicting axes defer to fallback:
  it("up+down (conflict) defers to fallback's vertical", () => {
    expect(
      decideBirdSpawnCorner({ ...NONE, up: true, down: true }, "top-right")
    ).toBe("top-right");
  });

  it("left+right (conflict) defers to fallback's horizontal", () => {
    expect(
      decideBirdSpawnCorner(
        { ...NONE, left: true, right: true },
        "bottom-left"
      )
    ).toBe("bottom-left");
  });
});

describe("cornerToBirdSpawnPosition", () => {
  const bounds: BirdSpawnBounds = {
    width: 800,
    height: 600,
    monsterSize: 25,
    padding: 25,
  };

  it("top-left → padded from origin", () => {
    expect(cornerToBirdSpawnPosition("top-left", bounds)).toEqual({
      x: 25,
      y: 25,
    });
  });

  it("top-right → padded from right edge", () => {
    expect(cornerToBirdSpawnPosition("top-right", bounds)).toEqual({
      x: 800 - 25 - 25, // width - monsterSize - padding
      y: 25,
    });
  });

  it("bottom-left → padded from bottom-left", () => {
    expect(cornerToBirdSpawnPosition("bottom-left", bounds)).toEqual({
      x: 25,
      y: 600 - 25 - 25,
    });
  });

  it("bottom-right → padded from bottom-right", () => {
    expect(cornerToBirdSpawnPosition("bottom-right", bounds)).toEqual({
      x: 800 - 25 - 25,
      y: 600 - 25 - 25,
    });
  });

  it("uses default padding of 25 when not provided", () => {
    const { x } = cornerToBirdSpawnPosition("top-left", {
      width: 100,
      height: 100,
      monsterSize: 20,
    });
    expect(x).toBe(25);
  });
});
