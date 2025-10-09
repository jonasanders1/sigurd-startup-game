# Sigurd Startup — Drop-in Arcade Experience

## What it is
- A fast, funny platformer about the chaos of building a startup in Norway.
- Collect bombs, dodge bureaucracy, stack multipliers, clear levels.

## Plug-and-play component
- Use it as a single tag: `<sigurd-startup>`.
- Self-contained via Shadow DOM; no style collisions with your site.
- Ships version info so hosts can verify compatibility.

## Under the hood (brief)
- React + TypeScript + Vite
- Canvas rendering for smooth arcade feel
- Lightweight state with modular stores (Zustand)

## Core game loop
- Canvas host boots the game and scales responsively.
- Menus and overlays render in React over the canvas.
- Animation system drives player/bomb states (idle, run, jump, float, celebrate).
- Shortcuts: F fullscreen, Esc exit, P pause, M mute.
