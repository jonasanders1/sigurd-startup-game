import { loadSpriteImage } from "./assets";

export interface MonsterAnimation {
  name: string;
  frames: HTMLImageElement[];
  frameDuration: number; // ms per frame
  loop: boolean;
}

// Skatte-Spøkelset (Tax Ghost) - doesn't need directions
const skatteSpøkelsetIdleFrames = [
  loadSpriteImage("sprites/skatte-spøkelset/skatte-spøkelse_0.png")
];

const skatteSpøkelsetMoveFrames = [
  loadSpriteImage("sprites/skatte-spøkelset/skatte-spøkelse_1.png"),
  loadSpriteImage("sprites/skatte-spøkelset/skatte-spøkelse_2.png")
];

// Vertikal-Byråkrat (Vertical Bureaucrat) - doesn't need directions
const vertikalByråkratIdleFrames = [
  loadSpriteImage("sprites/vertikal-byråkrat/vertikal-byråkrat_0.png")
];

const vertikalByråkratMoveFrames = [
  loadSpriteImage("sprites/vertikal-byråkrat/vertikal-byråkrat_1.png"),
  loadSpriteImage("sprites/vertikal-byråkrat/vertikal-byråkrat_2.png")
];

// Hodeløs-Konsulent (Headless Consultant) - doesn't need directions
const hodeløsKonsulentIdleFrames = [
  loadSpriteImage("sprites/hodeløs-konsulent/hodeløs-konsulent_0.png")
];

const hodeløsKonsulentMoveFrames = [
  loadSpriteImage("sprites/hodeløs-konsulent/hodeløs-konsulent_1.png"),
  loadSpriteImage("sprites/hodeløs-konsulent/hodeløs-konsulent_2.png")
];

// Regel-Robot (Rule Robot) - doesn't need directions
const regelRobotIdleFrames = [
  loadSpriteImage("sprites/regel-robot/regel-robot_0.png")
];

const regelRobotMoveFrames = [
  loadSpriteImage("sprites/regel-robot/regel-robot_1.png"),
  loadSpriteImage("sprites/regel-robot/regel-robot_2.png")
];

// Byråkrat-Klonen (Bureaucrat Clone) - NEEDS directions (horizontal patrol)
const byråkratKlonenIdleFrames = [
  loadSpriteImage("sprites/byråkrat-klonen/byråkrat-klonen_0.png")
];

const byråkratKlonenMoveFrames = [
  loadSpriteImage("sprites/byråkrat-klonen/byråkrat-klonen_1.png"),
  loadSpriteImage("sprites/byråkrat-klonen/byråkrat-klonen_2.png")
];

// Animation configurations for each monster type
export const skatteSpøkelsetAnimations: MonsterAnimation[] = [
  {
    name: "idle",
    frames: skatteSpøkelsetIdleFrames,
    frameDuration: 1000,
    loop: true
  },
  {
    name: "move",
    frames: skatteSpøkelsetMoveFrames,
    frameDuration: 300,
    loop: true
  }
];

export const vertikalByråkratAnimations: MonsterAnimation[] = [
  {
    name: "idle",
    frames: vertikalByråkratIdleFrames,
    frameDuration: 1000,
    loop: true
  },
  {
    name: "move",
    frames: vertikalByråkratMoveFrames,
    frameDuration: 300,
    loop: true
  }
];

export const hodeløsKonsulentAnimations: MonsterAnimation[] = [
  {
    name: "idle",
    frames: hodeløsKonsulentIdleFrames,
    frameDuration: 1000,
    loop: true
  },
  {
    name: "move",
    frames: hodeløsKonsulentMoveFrames,
    frameDuration: 250,
    loop: true
  }
];

export const regelRobotAnimations: MonsterAnimation[] = [
  {
    name: "idle",
    frames: regelRobotIdleFrames,
    frameDuration: 1000,
    loop: true
  },
  {
    name: "move",
    frames: regelRobotMoveFrames,
    frameDuration: 200,
    loop: true
  }
];

// Byråkrat-Klonen has directional animations
export const byråkratKlonenAnimations: MonsterAnimation[] = [
  {
    name: "idle",
    frames: byråkratKlonenIdleFrames,
    frameDuration: 1000,
    loop: true
  },
  {
    name: "walk-right",
    frames: byråkratKlonenMoveFrames,
    frameDuration: 200,
    loop: true
  },
  {
    name: "walk-left",
    frames: byråkratKlonenMoveFrames,
    frameDuration: 200,
    loop: true
  }
];

// Map monster types to their animations
import { MonsterType } from "../types/enums";

export const getMonsterAnimations = (type: MonsterType): MonsterAnimation[] => {
  switch (type) {
    case MonsterType.FLOATER:
      return skatteSpøkelsetAnimations; // Tax Ghost floats
    case MonsterType.VERTICAL_PATROL:
      return vertikalByråkratAnimations; // Vertical Bureaucrat patrols vertically
    case MonsterType.CHASER:
      return hodeløsKonsulentAnimations; // Headless Consultant chases
    case MonsterType.AMBUSHER:
      return regelRobotAnimations; // Rule Robot ambushes
    case MonsterType.HORIZONTAL_PATROL:
      return byråkratKlonenAnimations; // Bureaucrat Clone patrols horizontally
    default:
      // Default to a simple animation if type not matched
      return skatteSpøkelsetAnimations;
  }
};

// Helper function to determine if a monster type needs directional animations
export const monsterNeedsDirection = (type: MonsterType): boolean => {
  return type === MonsterType.HORIZONTAL_PATROL;
};