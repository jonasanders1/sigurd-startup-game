# Sigurd Startup Game

A web component game about Sigurd's startup journey, built with React and TypeScript.

## Installation

### From GitHub Packages

```bash
npm install @jonasanders1/sigurd-startup-game
```

You'll need to authenticate with GitHub Packages. Create a `.npmrc` file in your project root:

```ini
@jonasanders1:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Or authenticate via npm:

```bash
npm login --registry=https://npm.pkg.github.com --scope=@jonasanders1
```

### From Source

```bash
git clone https://github.com/jonasanders1/sigurd-startup-game.git
cd sigurd-startup-game
npm install
npm run build:lib
```

## Usage

### As a React Component (Recommended for React Apps)

```tsx
import React from 'react';
import { SigurdGameReact } from '@jonasanders1/sigurd-startup-game';

function App() {
  const handleGameLoad = () => {
    console.log('Game loaded successfully!');
  };

  const handleGameError = (error: Error) => {
    console.error('Game failed to load:', error);
  };

  return (
    <div className="App">
      <h1>Welcome to Sigurd's Startup Journey</h1>
      
      <SigurdGameReact
        className="game-container"
        style={{ 
          width: '100%', 
          maxWidth: '800px',
          margin: '20px auto'
        }}
        onGameLoad={handleGameLoad}
        onGameError={handleGameError}
      />
    </div>
  );
}
```

### As a Web Component

The game is available as a custom HTML element:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Sigurd Startup Game</title>
</head>
<body>
    <sigurd-startup></sigurd-startup>
    
    <script type="module">
        import '@jonasanders1/sigurd-startup-game';
    </script>
</body>
</html>
```

### As a Direct React Component

```tsx
import React from 'react';
import { GameElement } from '@jonasanders1/sigurd-startup-game';

function App() {
  return (
    <div>
      <h1>Welcome to Sigurd's Startup Journey</h1>
      <GameElement />
    </div>
  );
}
```

### Programmatic Usage

```tsx
import { getVersion, logVersion } from '@jonasanders1/sigurd-startup-game';

// Get version information
const version = getVersion();
console.log(`Game version: ${version.version}`);

// Log version info
logVersion();
```

## API

### SigurdGameReact (React Component)

A React wrapper component that provides a better React experience.

#### Props

- `className?: string` - CSS class name for the container
- `style?: React.CSSProperties` - Inline styles for the container
- `onGameLoad?: () => void` - Callback when game loads successfully
- `onGameError?: (error: Error) => void` - Callback when game fails to load

### GameElement

The main web component that renders the game.

#### Attributes

- `data-version`: Current game version
- `data-build`: Build number

#### Methods

- `getVersion()`: Returns version information
- `isCompatible(minVersion)`: Checks if current version is compatible with minimum required version

### Version Functions

- `getVersion()`: Returns an object with `version` and `build` properties
- `logVersion()`: Logs version information to console

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build:lib

# Build for production
npm run build

# Version management
npm run version:patch  # 2.3.0 -> 2.3.1
npm run version:minor  # 2.3.0 -> 2.4.0
npm run version:major  # 2.3.0 -> 3.0.0
```

## Building

The library is built using Vite and supports multiple formats:

- **ES Module**: `dist/sigurd-startup.es.js`
- **UMD**: `dist/sigurd-startup.umd.js`
- **TypeScript Definitions**: `dist/index.d.ts`
- **CSS**: `dist/sigurd-startup.css`

## Publishing

The package is automatically published to GitHub Packages when a new release is created on GitHub.

## License

MIT
