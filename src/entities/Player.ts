import { SpriteInstance } from "../lib/SpriteInstance";

// Sigurd Running
import sigurdRun1 from "../assets/sigurd-run/sigurd-run1.png";
import sigurdRun2 from "../assets/sigurd-run/sigurd-run2.png";
import sigurdRun3 from "../assets/sigurd-run/sigurd-run3.png";
import sigurdRun4 from "../assets/sigurd-run/sigurd-run4.png";

// Sigurd Idle
import sigurdIdle1 from "../assets/sigurd-idle/sigurd-idle1.png";
import sigurdIdle2 from "../assets/sigurd-idle/sigurd-idle2.png";
import sigurdIdle3 from "../assets/sigurd-idle/sigurd-idle3.png";
import sigurdIdle4 from "../assets/sigurd-idle/sigurd-idle4.png";



// Ghost Walking
// import ghostWalkRight1 from "../assets/ghost-walk/ghost-walk1.png";
// import ghostWalkRight2 from "../assets/ghost-walk/ghost-walk2.png";
// import ghostWalkRight3 from "../assets/ghost-walk/ghost-walk3.png";
// import ghostWalkRight4 from "../assets/ghost-walk/ghost-walk4.png";
// import ghostWalkRight5 from "../assets/ghost-walk/ghost-walk5.png";
// import ghostWalkRight6 from "../assets/ghost-walk/ghost-walk6.png";
// import ghostWalkRight7 from "../assets/ghost-walk/ghost-walk7.png";
// import ghostWalkRight8 from "../assets/ghost-walk/ghost-walk8.png";

// Ghost Idle
// import ghostIdle1 from "../assets/ghost-idle/ghost-idle1.png";
// import ghostIdle2 from "../assets/ghost-idle/ghost-idle2.png";
// import ghostIdle3 from "../assets/ghost-idle/ghost-idle3.png";
// import ghostIdle4 from "../assets/ghost-idle/ghost-idle4.png";
// import ghostIdle5 from "../assets/ghost-idle/ghost-idle5.png";
// import ghostIdle6 from "../assets/ghost-idle/ghost-idle6.png";
// Jumping
import ghostJump1 from "../assets/ghost-jump/ghost-jump1.png";
import ghostJump2 from "../assets/ghost-jump/ghost-jump2.png";
import ghostJump3 from "../assets/ghost-jump/ghost-jump3.png";

// Floating
import ghostFloat1 from "../assets/ghost-float/ghost-float1.png";
import ghostFloat2 from "../assets/ghost-float/ghost-float2.png";

// Map Complete
import ghostComplete1 from "../assets/ghost-map-complete/ghost-map-complete1.png";
import ghostComplete2 from "../assets/ghost-map-complete/ghost-map-complete2.png";
import ghostComplete3 from "../assets/ghost-map-complete/ghost-map-complete3.png";
import ghostComplete4 from "../assets/ghost-map-complete/ghost-map-complete4.png";

// Sigurd Jump
import sigurdJump1 from "../assets/sigurd-jump/sigurd-jump1.png";
import sigurdJump2 from "../assets/sigurd-jump/sigurd-jump2.png";
import sigurdJump3 from "../assets/sigurd-jump/sigurd-jump3.png";

// landing
// import ghostLanding1 from "../assets/ghost-landing/ghost-landing1.png";
// import ghostLanding2 from "../assets/ghost-landing/ghost-landing2.png";
// import ghostLanding3 from "../assets/ghost-landing/ghost-landing3.png";

// Sigurd Landing
import sigurdLanding1 from "../assets/sigurd-landing/sigurd-landing1.png";
import sigurdLanding2 from "../assets/sigurd-landing/sigurd-landing2.png";
import sigurdLanding3 from "../assets/sigurd-landing/sigurd-landing3.png";
import sigurdLanding4 from "../assets/sigurd-landing/sigurd-landing4.png";


// Sigurd Float
import sigurdFloat1 from "../assets/sigurd-float/sigurd-float1.png";
import sigurdFloat2 from "../assets/sigurd-float/sigurd-float2.png";
import sigurdFloat3 from "../assets/sigurd-float/sigurd-float3.png";

// Sigurd float directional
import sigurdFloatDir1 from "../assets/sigurd-float-dir/sigurd-float-dir1.png";
import sigurdFloatDir2 from "../assets/sigurd-float-dir/sigurd-float-dir2.png";
import sigurdFloatDir3 from "../assets/sigurd-float-dir/sigurd-float-dir3.png";


const sigurdIdleFrames = [sigurdIdle1, sigurdIdle2, sigurdIdle3, sigurdIdle4].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const sigurdRunFrames = [
  sigurdRun1,
  sigurdRun2,
  sigurdRun3,
  sigurdRun4,
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// const ghostIdleFrames = [
//   ghostIdle1,
//   ghostIdle2,
//   ghostIdle3,
//   ghostIdle4,
//   ghostIdle5,
//   ghostIdle6,
// ].map((src) => {
//   const img = new Image();
//   img.src = src;
//   return img;
// });

const jumpFrames = [sigurdJump1, sigurdJump2, sigurdJump3].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// const floatFrames = [ghostFloat1, ghostFloat2].map((src) => {
//   const img = new Image();
//   img.src = src;
//   return img;
// });

const ghostCompleteFrames = [
  ghostComplete1,
  ghostComplete2,
  ghostComplete3,
  ghostComplete4,
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const floatStationaryFrames = [sigurdFloat1, sigurdFloat2, sigurdFloat3].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const floatDirectionalFrames = [sigurdFloatDir1, sigurdFloatDir2, sigurdFloatDir3].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const landingFrames = [sigurdLanding1, sigurdLanding2, sigurdLanding3, sigurdLanding4].map(
  (src) => {
    const img = new Image();
    img.src = src;
    return img;
  }
);

const playerAnimations = [
  { name: "walk-right", frames: sigurdRunFrames, frameDuration: 100, loop: true },
  { name: "walk-left", frames: sigurdRunFrames, frameDuration: 100, loop: true },
  { name: "idle-right", frames: sigurdIdleFrames, frameDuration: 1000, loop: true },
  { name: "idle-left", frames: sigurdIdleFrames, frameDuration: 1000, loop: true },
  { name: "jump-right", frames: jumpFrames, frameDuration: 100, loop: false },
  { name: "jump-left", frames: jumpFrames, frameDuration: 100, loop: false },
  {
    name: "land-right",
    frames: landingFrames,
    frameDuration: 100,
    loop: false,
  },
  { name: "land-left", frames: landingFrames, frameDuration: 100, loop: false },
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
    frames: ghostCompleteFrames,
    frameDuration: 100,
    loop: false,
  },
  // Add more animations as needed
];

export const playerSprite = new SpriteInstance(playerAnimations, "idle-left");
