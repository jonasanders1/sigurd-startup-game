import { SpriteInstance } from "../lib/SpriteInstance";
import { loadSpriteImage } from "../config/assets";

const idleFrames = [
  loadSpriteImage("sigurd-idle/sigurd-idle1.png"),
  loadSpriteImage("sigurd-idle/sigurd-idle2.png"),
  loadSpriteImage("sigurd-idle/sigurd-idle3.png"),
  loadSpriteImage("sigurd-idle/sigurd-idle4.png"),
];

const runFrames = [
  loadSpriteImage("running/run1.png"),
  loadSpriteImage("running/run2.png"),
  loadSpriteImage("running/run3.png"),
];

const jumpFrames = [
  loadSpriteImage("jumping/jump1.png"),
  loadSpriteImage("jumping/jump2.png"),
  loadSpriteImage("jumping/jump3.png"),
];



const completeFrames = [
  loadSpriteImage("complete/complete1.png"),
  loadSpriteImage("complete/complete2.png"),
  loadSpriteImage("complete/complete3.png"),
  loadSpriteImage("complete/complete4.png"),
  loadSpriteImage("complete/complete5.png"),
];

const floatStationaryFrames = [loadSpriteImage("float/float1.png")];

const floatDirectionalFrames = [loadSpriteImage("float-dir/float-dir1.png")];

const landingFrames = [loadSpriteImage("landing/landing1.png")];

const playerAnimations = [
  {
    name: "walk-right",
    frames: runFrames,
    frameDuration: 100,
    loop: true,
  },
  {
    name: "walk-left",
    frames: runFrames,
    frameDuration: 100,
    loop: true,
  },
  {
    name: "idle-right",
    frames: idleFrames,
    frameDuration: 1000,
    loop: true,
  },
  {
    name: "idle-left",
    frames: idleFrames,
    frameDuration: 1000,
    loop: true,
  },
  { name: "jump-right", frames: jumpFrames, frameDuration: 100, loop: false },
  { name: "jump-left", frames: jumpFrames, frameDuration: 100, loop: false },
  {
    name: "land-right",
    frames: landingFrames,
    frameDuration: 500,
    loop: false,
  },
  { name: "land-left", frames: landingFrames, frameDuration: 500, loop: false },
  {
    name: "float-stationary",
    frames: floatStationaryFrames,
    frameDuration: 100,
    loop: true,
  },
  {
    name: "float-right",
    frames: floatDirectionalFrames,
    frameDuration: 100,
    loop: false,
  },
  {
    name: "float-left",
    frames: floatDirectionalFrames,
    frameDuration: 100,
    loop: true,
  },
  {
    name: "ghost-complete",
    frames: completeFrames,
    frameDuration: 100,
    loop: false,
  },
  // Add more animations as needed
];

export const playerSprite = new SpriteInstance(playerAnimations, "idle-left");
