import { SpriteInstance } from "../lib/SpriteInstance";

// Walking
import ghostWalkRight1 from "../assets/ghost-walk/ghost-walk1.png";
import ghostWalkRight2 from "../assets/ghost-walk/ghost-walk2.png";
import ghostWalkRight3 from "../assets/ghost-walk/ghost-walk3.png";
import ghostWalkRight4 from "../assets/ghost-walk/ghost-walk4.png";
import ghostWalkRight5 from "../assets/ghost-walk/ghost-walk5.png";
import ghostWalkRight6 from "../assets/ghost-walk/ghost-walk6.png";
import ghostWalkRight7 from "../assets/ghost-walk/ghost-walk7.png";
import ghostWalkRight8 from "../assets/ghost-walk/ghost-walk8.png";

// Idle
import ghostIdle1 from "../assets/ghost-idle/ghost-idle1.png";
import ghostIdle2 from "../assets/ghost-idle/ghost-idle2.png";
import ghostIdle3 from "../assets/ghost-idle/ghost-idle3.png";
import ghostIdle4 from "../assets/ghost-idle/ghost-idle4.png";
import ghostIdle5 from "../assets/ghost-idle/ghost-idle5.png";
import ghostIdle6 from "../assets/ghost-idle/ghost-idle6.png";

// Jumping
import ghostJump1 from "../assets/ghost-jump/ghost-jump1.png";
import ghostJump2 from "../assets/ghost-jump/ghost-jump2.png";
import ghostJump3 from "../assets/ghost-jump/ghost-jump3.png";
import ghostJump4 from "../assets/ghost-jump/ghost-jump4.png";


// landing
import ghostLanding1 from "../assets/ghost-landing/ghost-landing1.png";
import ghostLanding2 from "../assets/ghost-landing/ghost-landing2.png";
import ghostLanding3 from "../assets/ghost-landing/ghost-landing3.png";


const walkFrames = [
  ghostWalkRight1,
  ghostWalkRight2,
  ghostWalkRight3,
  ghostWalkRight4,
  ghostWalkRight5,
  ghostWalkRight6,
  ghostWalkRight7,
  ghostWalkRight8,
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const idleFrames = [
  ghostIdle1,
  ghostIdle2,
  ghostIdle3,
  ghostIdle4,
  ghostIdle5,
  ghostIdle6,
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const jumpFrames = [ghostJump1, ghostJump2, ghostJump3].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const landingFrames = [ghostLanding1, ghostLanding2, ghostLanding3].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const playerAnimations = [
  { name: "walk-right", frames: walkFrames, frameDuration: 100, loop: true },
  { name: "walk-left", frames: walkFrames, frameDuration: 100, loop: true },
  { name: "idle-right", frames: idleFrames, frameDuration: 1000, loop: false },
  { name: "idle-left", frames: idleFrames, frameDuration: 1000, loop: false },
  { name: "jump-right", frames: jumpFrames, frameDuration: 100, loop: false },
  { name: "jump-left", frames: jumpFrames, frameDuration: 100, loop: false },
  { name: "land-right", frames: landingFrames, frameDuration: 100, loop: false },
  { name: "land-left", frames: landingFrames, frameDuration: 100, loop: false },
  // Add more animations as needed
];

export const playerSprite = new SpriteInstance(playerAnimations, "idle-left");
