# Game Component Architecture & Communication Guide

Complete breakdown of how the `sigurd-startup` game component is rendered, its architecture, and how it communicates with the parent application.

## Table of Contents

1. [Component Rendering Lifecycle](#component-rendering-lifecycle)
2. [Architecture Overview](#architecture-overview)
3. [Web Component Structure](#web-component-structure)
4. [Communication Mechanisms](#communication-mechanisms)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [Integration Points](#integration-points)
8. [Event System Reference](#event-system-reference)

---

## Component Rendering Lifecycle

### 1. Page Navigation

When a user navigates to `/game`:

```
User clicks "Spill" link
  ↓
React Router navigates to /game route
  ↓
ProtectedRoute checks authentication
  ↓
Game component mounts
```

### 2. Dynamic Module Loading

The game component uses **dynamic imports** to load the game package only when needed:

```typescript
// src/pages/Game.tsx - useEffect hook
useEffect(() => {
  const loadGame = async () => {
    // Dynamically import the npm package
    const gameModule = await import("sigurd-startup");
    
    // Wait for custom element registration
    checkGameElement();
  };
  
  loadGame();
  
  // Cleanup: Remove game element on unmount
  return () => {
    const gameElement = document.querySelector("sigurd-startup");
    if (gameElement) {
      gameElement.remove();
    }
  };
}, []);
```

**Why Dynamic Loading?**
- Reduces initial bundle size
- Prevents global keyboard event interference until needed
- Allows code splitting for better performance

### 3. Custom Element Registration

The game package registers a Web Component:

```typescript
// Inside sigurd-startup package
customElements.define("sigurd-startup", SigurdStartupElement);
```

### 4. Component Mount Sequence

```
1. Game.tsx component renders
   ↓
2. Shows loading spinner while gameModule loads
   ↓
3. Dynamic import resolves → gameModule available
   ↓
4. checkGameElement() polls until customElements.get("sigurd-startup") exists
   ↓
5. setIsGameLoaded(true) → renders <sigurd-startup></sigurd-startup>
   ↓
6. Web Component connects to DOM
   ↓
7. Web Component's connectedCallback() fires
   ↓
8. React app inside Shadow DOM initializes
   ↓
9. GameManager starts
   ↓
10. Canvas renders and game begins
```

### 5. Cleanup on Unmount

When user navigates away from `/game`:

```
Component unmounts
  ↓
Cleanup function executes
  ↓
Game element removed from DOM
  ↓
Shadow DOM destroyed
  ↓
All game resources cleaned up
```

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
│  (Website: sigurd-startup-site)                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Game.tsx Component                      │    │
│  │  - Dynamic import of sigurd-startup package        │    │
│  │  - Manages game lifecycle                          │    │
│  │  - Handles keyboard event patching                 │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│                   │ Renders                                  │
│                   ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │        <sigurd-startup> Web Component              │    │
│  │        (from npm package: sigurd-startup)          │    │
│  │                                                     │    │
│  │  ┌───────────────────────────────────────────┐    │    │
│  │  │          Shadow DOM                       │    │    │
│  │  │                                           │    │    │
│  │  │  ┌─────────────────────────────────┐     │    │    │
│  │  │  │      React Root                 │     │    │    │
│  │  │  │      (Internal to game)         │     │    │    │
│  │  │  │                                 │     │    │    │
│  │  │  │  MainGame Component             │     │    │    │
│  │  │  │    ├─ GameCanvas                │     │    │    │
│  │  │  │    ├─ GameManager               │     │    │    │
│  │  │  │    │   ├─ InputManager          │     │    │    │
│  │  │  │    │   ├─ AudioManager          │     │    │    │
│  │  │  │    │   └─ StateManager          │     │    │    │
│  │  │  │    └─ Canvas Element            │     │    │    │
│  │  │  └─────────────────────────────────┘     │    │    │
│  │  └───────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Game Store (Zustand)                     │    │
│  │  - Tracks game runs                                │    │
│  │  - Listens for game events                         │    │
│  │  - Manages game state                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Website (Parent App)**:
- React + TypeScript
- React Router (navigation)
- Zustand (state management)
- Firebase (data persistence)

**Game Package (Web Component)**:
- Web Components API (Custom Elements)
- Shadow DOM (encapsulation)
- React (internal UI)
- Canvas API (rendering)
- Web Audio API (sound)

---

## Web Component Structure

### Custom Element Definition

```typescript
// Inside sigurd-startup package
class SigurdStartupElement extends HTMLElement {
  connectedCallback() {
    // Initialize when element is added to DOM
    this.attachShadow({ mode: 'open' });
    // Render React app into Shadow DOM
  }
  
  disconnectedCallback() {
    // Cleanup when element is removed
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    // Handle attribute changes (e.g., data-version, data-build)
  }
}

customElements.define("sigurd-startup", SigurdStartupElement);
```

### Shadow DOM Isolation

The game uses Shadow DOM for:
- **Style Encapsulation**: Game styles don't leak to website
- **DOM Encapsulation**: Game DOM is isolated from website
- **Scoped Event Handling**: Events can be scoped to Shadow DOM

**Important**: Keyboard events still bubble to `window`/`document`, which is why keyboard patching is needed.

### Component Hierarchy (Inside Shadow DOM)

```
<sigurd-startup> (Web Component Host)
  └── #shadow-root
      └── React Root
          └── MainGame Component
              ├── gameContainerRef (div)
              │   └── GameCanvas Component
              │       └── <canvas> element
              │           └── GameManager (non-React class)
              │               ├── InputManager
              │               ├── AudioManager
              │               └── StateManager
              └── UI Components (menus, HUD, etc.)
```

---

## Communication Mechanisms

The game and website communicate through multiple channels:

### 1. Custom Events (Primary Communication)

**Game → Website Events**:

| Event Name | When Fired | Data Payload |
|------------|------------|--------------|
| `game:completed` | Game ends (victory/failure) | `GameCompletionData` |
| `game:ready` | Game fully initialized | None |
| `game:level-started` | New level begins | `{ level, mapName, timestamp }` |
| `game:map-completed` | Level successfully completed | `MapCompletionData` |
| `game:level-failed` | Level failed/player died | `LevelHistoryEntry` (isPartial: true) |
| `game:audio-settings-updated` | User changes audio settings | `AudioSettingsUpdateData` |
| `sigurd-startup-fullscreen-change` | Fullscreen toggle | `{ isFullscreen: boolean }` |
| `scoreUpdate` | Real-time score updates | `{ score, level?, lives?, multiplier? }` |

**Website → Game Events**:

| Event Name | When Fired | Data Payload |
|------------|------------|--------------|
| `game:load-audio-settings` | Website sends audio settings | `AudioSettingsUpdateData` |

### 2. Global API (`window.sigurdGame`)

The website exposes a global API for the game to use:

```typescript
interface Window {
  sigurdGame?: {
    // Send game completion data
    sendGameCompletion: (completionData: GameCompletionData) => void;
    
    // Send audio settings to game
    sendAudioSettings: (audioSettings: AudioSettingsUpdateData) => void;
    
    // Load user audio settings from Firebase and send to game
    loadUserAudioSettings: (userId: string) => Promise<void>;
  };
}
```

**Initialization**:
- Set up in `game-store.ts` when the store initializes
- Available globally once the website loads

**Usage Flow**:
```typescript
// Game wants to send completion data
window.sigurdGame?.sendGameCompletion(completionData);

// Website wants to send audio settings
window.sigurdGame?.sendAudioSettings(audioSettings);

// Website wants to load and send user's saved audio settings
await window.sigurdGame?.loadUserAudioSettings(userId);
```

### 3. localStorage (User Data Sharing)

The website stores user data in localStorage for the game to access:

```typescript
// Website stores user data
localStorage.setItem("user", JSON.stringify({
  uid: "user123",
  email: "user@example.com",
  displayName: "John Doe"
}));

// Game can read user data
const userString = localStorage.getItem("user");
const user = JSON.parse(userString);
```

**Purpose**:
- Allows game to access user information without direct API calls
- Used when saving audio settings (needs userId)

**Data Stored**:
- User object from Firebase Auth (uid, email, displayName, etc.)

### 4. DOM Attributes (Metadata)

The game component exposes metadata via HTML attributes:

```html
<sigurd-startup 
  data-version="1.0.0"
  data-build="1234567890"
></sigurd-startup>
```

**Access**:
```typescript
const gameElement = document.querySelector("sigurd-startup");
const version = gameElement.getAttribute("data-version");
const build = gameElement.getAttribute("data-build");
```

---

## Data Flow

### Game Start Flow

```
1. User navigates to /game
   ↓
2. Game.tsx mounts → Dynamic import starts
   ↓
3. Game package loads → Custom element registers
   ↓
4. <sigurd-startup> renders
   ↓
5. Website: localStorage.setItem("user", userData)
   ↓
6. Website: window.sigurdGame.loadUserAudioSettings(userId)
   ↓
7. Website → Game: "game:load-audio-settings" event
   ↓
8. Game applies audio settings
   ↓
9. Website: useGameStore.startNewGameRun(userId, name, email)
   ↓
10. Game: GameManager.start()
    ↓
11. Game begins
```

### Game Completion Flow

```
1. Player completes/fails game
   ↓
2. Game: window.sigurdGame.sendGameCompletion(data)
   ↓
3. Website receives: "game:completed" event
   ↓
4. useGameStore.completeGameRun(data) called
   ↓
5. Game run data saved to Firebase
   ↓
6. Leaderboard updated
   ↓
7. User stats updated
```

### Audio Settings Flow

**Loading Settings (Website → Game)**:
```
1. User logs in
   ↓
2. Game.tsx: window.sigurdGame.loadUserAudioSettings(userId)
   ↓
3. Website: Fetches from Firebase
   ↓
4. Website: window.sigurdGame.sendAudioSettings(settings)
   ↓
5. Game: Receives "game:load-audio-settings" event
   ↓
6. Game applies settings
```

**Saving Settings (Game → Website)**:
```
1. User changes audio in game
   ↓
2. Game: Dispatches "game:audio-settings-updated" event
   ↓
3. Website: Listens for event in game-store.ts
   ↓
4. Website: Reads userId from localStorage
   ↓
5. Website: Saves to Firebase
```

### Fullscreen Toggle Flow

```
1. User presses F key in game (or clicks fullscreen button)
   ↓
2. Game: Dispatches "sigurd-startup-fullscreen-change" event
   ↓
3. Website: useFullscreen hook listens for event
   ↓
4. Website: Hides/shows sidebar, header, etc.
   ↓
5. Website: Updates layout margins
```

---

## State Management

### Website State (Zustand Store)

**Location**: `src/stores/game-store.ts`

**State Structure**:
```typescript
interface GameState {
  // Status flags
  isGameLoaded: boolean;
  isGameRunning: boolean;
  
  // Score tracking
  highScore: number;
  
  // Current game run
  currentGameRun: Partial<GameRun> | null;
  
  // Historical game runs
  gameRuns: GameRun[];
  
  // Actions
  setGameLoaded: (loaded: boolean) => void;
  setGameRunning: (running: boolean) => void;
  startNewGameRun: (userId, name, email) => void;
  completeGameRun: (data: GameCompletionData) => Promise<void>;
  // ... more actions
}
```

**Key Features**:
- Tracks game lifecycle (loaded, running)
- Manages current game run session
- Stores historical game runs
- Persists data to Firebase

### Game Internal State

The game manages its own state internally:
- Game state (playing, paused, menu, etc.)
- Player state (position, velocity, lives, score)
- Level state (current level, map data)
- Audio state (volume, mute settings)

**Communication**: Game state is exposed to website only through events, not direct access.

---

## Integration Points

### 1. Game Component Integration

**File**: `src/pages/Game.tsx`

**Responsibilities**:
- Dynamic module loading
- Game element lifecycle management
- Keyboard event patching (prevents interference)
- User authentication check
- Audio settings initialization

**Key Code Sections**:
```typescript
// Dynamic loading
const gameModule = await import("sigurd-startup");

// Wait for custom element
if (customElements.get("sigurd-startup")) {
  setIsGameLoaded(true);
}

// Render game element
{isGameLoaded ? (
  <sigurd-startup></sigurd-startup>
) : (
  <Loader />
)}
```

### 2. Event Listener Setup

**File**: `src/stores/game-store.ts`

**Initialization**:
```typescript
// Set up global listeners when store initializes
window.addEventListener("game:completed", (event) => {
  const data = event.detail;
  useGameStore.getState().completeGameRun(data);
});

window.addEventListener("game:ready", () => {
  useGameStore.getState().setGameLoaded(true);
});

window.addEventListener("game:audio-settings-updated", async (event) => {
  // Save audio settings to Firebase
});
```

### 3. Global API Setup

**File**: `src/stores/game-store.ts`

**Initialization**:
```typescript
window.sigurdGame = {
  sendGameCompletion: (data) => {
    document.dispatchEvent(new CustomEvent("game:completed", { detail: data }));
  },
  sendAudioSettings: (settings) => {
    window.dispatchEvent(new CustomEvent("game:load-audio-settings", { detail: settings }));
  },
  loadUserAudioSettings: async (userId) => {
    // Fetch from Firebase and send to game
  }
};
```

### 4. Fullscreen Integration

**File**: `src/hooks/use-fullscreen.ts`

**Purpose**: Syncs game fullscreen state with website layout

**Mechanism**:
- Listens for `sigurd-startup-fullscreen-change` event
- Hides/shows sidebar, header, navigation
- Adjusts layout margins
- Updates React state for UI rendering

### 5. Firebase Integration

**Game Run Persistence**:
- `completeGameRun()` saves to Firestore
- Creates leaderboard entries
- Updates user statistics

**Audio Settings Persistence**:
- Loads user settings on game start
- Saves settings when user changes them in game

---

## Event System Reference

### Complete Event Catalog

#### Game → Website Events

**`game:completed`**
- **When**: Game ends (victory or game over)
- **Payload**: `GameCompletionData`
- **Handler**: `useGameStore.completeGameRun()`
- **Action**: Saves game run to Firebase, updates leaderboard

**`game:ready`**
- **When**: Game fully initialized
- **Payload**: None
- **Handler**: `useGameStore.setGameLoaded(true)`
- **Action**: Updates game loaded state

**`game:level-started`**
- **When**: New level begins
- **Payload**: `{ level, mapName, timestamp }`
- **Handler**: (Currently not used, but available)
- **Action**: Could be used for analytics

**`game:map-completed`**
- **When**: Level successfully completed
- **Payload**: `MapCompletionData`
- **Handler**: (Currently not used)
- **Action**: Could be used for mid-game analytics

**`game:level-failed`**
- **When**: Level failed/player died
- **Payload**: `LevelHistoryEntry` (isPartial: true)
- **Handler**: (Currently not used)
- **Action**: Could be used for analytics

**`game:audio-settings-updated`**
- **When**: User changes audio settings in game
- **Payload**: `AudioSettingsUpdateData`
- **Handler**: Saves to Firebase
- **Action**: Persists user preferences

**`sigurd-startup-fullscreen-change`**
- **When**: Fullscreen mode toggles
- **Payload**: `{ isFullscreen: boolean }`
- **Handler**: `useFullscreen` hook
- **Action**: Updates website layout

**`scoreUpdate`**
- **When**: Real-time score updates
- **Payload**: `{ score, level?, lives?, multiplier? }`
- **Handler**: (Currently not used)
- **Action**: Could be used for live UI updates

#### Website → Game Events

**`game:load-audio-settings`**
- **When**: Website wants to send audio settings to game
- **Payload**: `AudioSettingsUpdateData`
- **Handler**: Game's audio manager
- **Action**: Applies audio settings in game

### Event Propagation

**Custom Events**:
- Use `bubbles: true` to allow propagation
- Dispatched on `window` or `document`
- Can be listened to from anywhere in the app

**Example**:
```typescript
// Dispatch event
const event = new CustomEvent("game:completed", {
  detail: completionData,
  bubbles: true
});
document.dispatchEvent(event);

// Listen for event
window.addEventListener("game:completed", (event) => {
  const data = event.detail;
  // Handle data
});
```

---

## Key Design Patterns

### 1. Web Component Encapsulation

The game is completely encapsulated as a Web Component:
- Self-contained React app in Shadow DOM
- No direct DOM access from website
- Communication only through events

### 2. Event-Driven Architecture

All communication is event-driven:
- Loose coupling between game and website
- Easy to extend with new events
- Clear separation of concerns

### 3. Dynamic Loading

Game package loaded on-demand:
- Smaller initial bundle
- Faster page loads
- Conditional loading based on route

### 4. Global API Pattern

`window.sigurdGame` provides:
- Type-safe interface
- Centralized communication methods
- Easy access from both sides

### 5. State Synchronization

- Website manages game runs and persistence
- Game manages its own internal state
- Events bridge the gap

---

## Security & Isolation

### Shadow DOM Benefits

- **Style Isolation**: Game CSS doesn't affect website
- **DOM Isolation**: Game DOM is hidden from website JavaScript
- **Encapsulation**: Prevents accidental interference

### Event Security

- Events use standard CustomEvent API
- No sensitive data in events (user data from localStorage)
- Firebase handles authentication

### Keyboard Event Patching

- Prevents game controls from interfering with website inputs
- Scoped to game page only
- Patches `document.addEventListener` to filter events

---

## Troubleshooting Guide

### Game Not Loading

1. Check browser console for import errors
2. Verify `customElements.get("sigurd-startup")` returns element
3. Check if game package is installed in node_modules
4. Verify user is authenticated (ProtectedRoute)

### Events Not Firing

1. Check event listeners are registered
2. Verify event names match exactly
3. Check event payload structure
4. Use browser DevTools to monitor events

### Audio Settings Not Saving

1. Check user is logged in (localStorage has user)
2. Verify Firebase permissions
3. Check network tab for Firebase requests
4. Verify event is firing correctly

### Keyboard Interference

1. Check keyboard patching is active
2. Verify route is `/game`
3. Check input element detection logic
4. See KEYBOARD_INTERFERENCE_FIX.md for details

---

## Future Enhancements

### Potential Improvements

1. **Type-Safe Events**: Use TypeScript interfaces for all events
2. **Event Middleware**: Add logging/analytics middleware
3. **State Sync**: Real-time state synchronization
4. **Multiple Instances**: Support multiple game instances
5. **Plugin System**: Allow website to extend game functionality

---

## Summary

The game component architecture uses:

- **Web Components** for encapsulation
- **Shadow DOM** for isolation
- **Custom Events** for communication
- **Global API** for direct method calls
- **localStorage** for user data sharing
- **Dynamic Loading** for performance
- **Event-Driven** architecture for loose coupling

This design allows the game to be a self-contained package that integrates seamlessly with the website while maintaining clear boundaries and communication channels.

