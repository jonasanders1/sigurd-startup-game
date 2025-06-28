import { SpriteInstance } from "../lib/SpriteInstance";
import { ASSET_PATHS } from "../config/assets";

// Helper function to load images from public folder
const loadImage = (path: string): HTMLImageElement => {
  const img = new Image();
  img.src = `${ASSET_PATHS.images}/${path}`;
  return img;
};

const sigurdIdleFrames = [
  loadImage("sigurd-idle/sigurd-idle1.png"),
  loadImage("sigurd-idle/sigurd-idle2.png"),
  loadImage("sigurd-idle/sigurd-idle3.png"),
  loadImage("sigurd-idle/sigurd-idle4.png"),
];

const runningFrames = [
  loadImage("running/run1.png"),
  loadImage("running/run2.png"),
  loadImage("running/run3.png"),
];

const jumpFrames = [
  loadImage("jumping/jump1.png"),
  loadImage("jumping/jump2.png"),
  loadImage("jumping/jump3.png"),
];

// const floatFrames = [ghostFloat1, ghostFloat2].map((src) => {
//   const img = new Image();
//   img.src = src;
//   return img;
// });

// const ghostCompleteFrames = [
//   loadImage("ghost-map-complete/ghost-map-complete1.png"),
//   loadImage("ghost-map-complete/ghost-map-complete2.png"),
//   loadImage("ghost-map-complete/ghost-map-complete3.png"),
//   loadImage("ghost-map-complete/ghost-map-complete4.png"),
// ];

const completeFrames = [
  loadImage("complete/complete1.png"),
  loadImage("complete/complete2.png"),
  loadImage("complete/complete3.png"),
  loadImage("complete/complete4.png"),
  loadImage("complete/complete5.png"),
];

const floatStationaryFrames = [loadImage("float/float1.png")];

const floatDirectionalFrames = [loadImage("float-dir/float-dir1.png")];

const landingFrames = [loadImage("landing/landing1.png")];

const playerAnimations = [
  {
    name: "walk-right",
    frames: runningFrames,
    frameDuration: 100,
    loop: true,
  },
  {
    name: "walk-left",
    frames: runningFrames,
    frameDuration: 100,
    loop: true,
  },
  {
    name: "idle-right",
    frames: sigurdIdleFrames,
    frameDuration: 1000,
    loop: true,
  },
  {
    name: "idle-left",
    frames: sigurdIdleFrames,
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
