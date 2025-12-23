# Fixing Global Keyboard Input Conflicts Between a Web Game and Website UI

## Problem Summary

You have a JavaScript game published as an NPM package and rendered on a website via a custom element:

```jsx
<sigurd-startup></sigurd-startup>
The game listens to keyboard inputs (W, A, S, D, ArrowUp, Space, etc.).
After the user leaves the game page (e.g. navigates to /leaderboard), those keys remain blocked or intercepted, preventing normal website interactions like typing in inputs or scrolling.

This happens because the game registers global keyboard listeners (window / document) and never properly releases them.

Root Cause
Most games do one or more of the following:

Attach keyboard listeners to window or document

Call event.preventDefault() on key events

Never remove event listeners when the game is unmounted

Continue running game loops even after navigation

As a result, the game still captures keyboard events even when it is no longer visible.

Correct Solution (Architecture-Level Fix)
✅ Rule #1: Keyboard input must be scoped, not global
The game must only listen to keyboard events when it is active, and stop listening immediately when it is destroyed or blurred.

Step 1: Move Keyboard Handling Behind an “Active” Flag
Inside your game package:

ts
Copy code
let isActive = false;

function onKeyDown(e: KeyboardEvent) {
  if (!isActive) return;

  const allowedKeys = [
    "w", "a", "s", "d",
    "arrowup", "arrowdown", "arrowleft", "arrowright",
    " "
  ];

  if (allowedKeys.includes(e.key.toLowerCase())) {
    e.preventDefault();
    // handle game input
  }
}

export function enableControls() {
  if (isActive) return;
  isActive = true;
  window.addEventListener("keydown", onKeyDown);
}

export function disableControls() {
  isActive = false;
  window.removeEventListener("keydown", onKeyDown);
}
Step 2: Activate / Deactivate Controls Based on Lifecycle
If using a Custom Element (<sigurd-startup>)
ts
Copy code
class SigurdStartup extends HTMLElement {
  connectedCallback() {
    enableControls();
  }

  disconnectedCallback() {
    disableControls();
  }
}

customElements.define("sigurd-startup", SigurdStartup);
This ensures that when the component is removed from the DOM, all controls are released.

Step 3: Stop Using Global preventDefault() Blindly
🚫 Wrong

ts
Copy code
window.addEventListener("keydown", e => {
  e.preventDefault();
});
✅ Correct

ts
Copy code
if (gameIsRunning && allowedKeys.includes(e.key)) {
  e.preventDefault();
}
Only block:

Keys used by the game

While the game is focused / active

Step 4: Scope Keyboard Input to a Focused Container (BEST PRACTICE)
Instead of window, use a focusable container:

html
Copy code
<div id="game-root" tabindex="0"></div>
ts
Copy code
const gameRoot = document.getElementById("game-root");

gameRoot.addEventListener("keydown", onKeyDown);
gameRoot.focus();
Benefits
Keyboard input only works when the game is focused

Leaving the page or clicking elsewhere restores normal website behavior

No global side effects

Step 5: Pause / Cleanup on Route Change (React Example)
tsx
Copy code
useEffect(() => {
  enableControls();

  return () => {
    disableControls();
  };
}, []);
This guarantees cleanup when navigating away from the game route.

Step 6: Stop the Game Loop When Unmounted
If your game has a loop:

ts
Copy code
let animationId: number;

function loop() {
  animationId = requestAnimationFrame(loop);
  update();
  render();
}

function stopGame() {
  cancelAnimationFrame(animationId);
}
Call stopGame() inside disconnectedCallback or React cleanup.

Final Checklist (Use This to Verify)
 No keyboard listeners left on window after leaving the game

 removeEventListener is always called

 preventDefault() only runs when the game is active

 Game input is scoped to a focused element when possible

 Game loop stops when the component unmounts

TL;DR (One-Line Fix)
Never let a game own the keyboard globally. Activate controls only while the game is mounted and focused, and always clean them up on unmount.
```
