import { SpriteInstance } from "../lib/SpriteInstance";
import { loadSpriteImage } from "../config/assets";

const idleFrames = [
  loadSpriteImage("sprites/sigurdV2/idle/idle_00.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_01.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_02.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_03.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_04.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_05.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_06.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_07.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_08.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_09.png"),
  loadSpriteImage("sprites/sigurdV2/idle/idle_10.png"),
];

const runFrames = [
  loadSpriteImage("sprites/sigurdV2/running/running_00.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_01.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_02.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_03.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_04.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_05.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_06.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_07.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_08.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_09.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_10.png"),
  loadSpriteImage("sprites/sigurdV2/running/running_11.png"),
];

const jumpFrames = [loadSpriteImage("sprites/sigurdV2/jump/jump_0.png")];

const fallFrames = [loadSpriteImage("sprites/sigurdV2/fall/fall_0.png")];

const floatFrames = [
  loadSpriteImage("sprites/sigurdV2/float/float_0.png"),
  loadSpriteImage("sprites/sigurdV2/float/float_1.png"),
  loadSpriteImage("sprites/sigurdV2/float/float_2.png"),
  loadSpriteImage("sprites/sigurdV2/float/float_3.png"),
  loadSpriteImage("sprites/sigurdV2/float/float_4.png"),
];

const floatStationaryFrames = floatFrames;
const floatDirectionalFrames = floatFrames;

const playerAnimations = [
  {
    name: "walk-right",
    frames: runFrames,
    frameDuration: 50,
    loop: true,
  },
  {
    name: "walk-left",
    frames: runFrames,
    frameDuration: 50,
    loop: true,
  },
  {
    name: "idle-right",
    frames: idleFrames,
    frameDuration: 130,
    loop: true,
  },
  {
    name: "idle-left",
    frames: idleFrames,
    frameDuration: 130,
    loop: true,
  },
  { name: "jump-right", frames: jumpFrames, frameDuration: 100, loop: false },
  { name: "jump-left", frames: jumpFrames, frameDuration: 100, loop: false },
  { name: "fall-right", frames: fallFrames, frameDuration: 100, loop: false },
  { name: "fall-left", frames: fallFrames, frameDuration: 100, loop: false },
  {
    name: "float-stationary",
    frames: floatStationaryFrames,
    frameDuration: 120,
    loop: true,
  },
  {
    name: "float-right",
    frames: floatDirectionalFrames,
    frameDuration: 120,
    loop: true,
  },
  {
    name: "float-left",
    frames: floatDirectionalFrames,
    frameDuration: 120,
    loop: true,
  },
];

export const playerSprite = new SpriteInstance(playerAnimations, "idle-left");
