# 🎮 Sigurd Startup Game

A self-contained web component game about Sigurd's startup journey, packaged for easy integration into any website or React application.

## ✨ Features

- **🎯 Self-contained package** - All assets bundled inside, no external dependencies
- **🚀 Web Component** - Use as `<sigurd-startup>` in any HTML page
- **⚛️ React Integration** - Easy integration with React applications
- **📱 Responsive** - Works on desktop and mobile devices
- **🎨 Modern UI** - Built with Tailwind CSS and modern design principles
- **🔊 Audio Support** - Background music and sound effects
- **📊 Game Analytics** - Built-in event system for tracking game progress

## 📦 Installation

```bash
npm install sigurd-startup
```

## 🚀 Quick Start

### HTML Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game Page</title>
    <script type="module">
        import 'sigurd-startup-game';
    </script>
</head>
<body>
    <h1>Welcome to Sigurd's Adventure!</h1>
    <sigurd-startup id="game"></sigurd-startup>
</body>
</html>
```

### React Usage

```tsx
import React from 'react';
import 'sigurd-startup';

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sigurd-startup": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

function App() {
  return (
    <div>
      <h1>My Game App</h1>
      <sigurd-startup />
    </div>
  );
}
```

## 🎮 Game Controls

- **WASD / Arrow Keys** - Move Sigurd
- **Space** - Jump
- **Escape** - Pause/Resume
- **F11** - Toggle fullscreen

## 📡 Event System

The game dispatches custom events that you can listen to:

```javascript
const gameElement = document.querySelector('sigurd-startup');

// Game ready
gameElement.addEventListener('game:ready', (event) => {
  console.log('Game is ready to play!');
});

// Score updates
gameElement.addEventListener('game:score-updated', (event) => {
  const { score } = event.detail;
  console.log('Current score:', score);
});

// Game completion
gameElement.addEventListener('game:completed', (event) => {
  const gameData = event.detail;
  console.log('Game finished with score:', gameData.finalScore);
});
```

## 🎨 Customization

### Styling

The game comes with built-in CSS, but you can customize it:

```css
/* Custom game container styles */
sigurd-startup {
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Override game styles */
sigurd-startup::part(game-container) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Configuration

Access game configuration and utilities:

```javascript
import { getVersion, ASSET_PATHS } from 'sigurd-startup';

console.log('Game version:', getVersion());
console.log('Asset paths:', ASSET_PATHS);
```

## 🔧 Development

### Building the Package

```bash
# Build the library
npm run build:lib

# Test the package
npm run test:package

# Build and publish
npm run publish:npm
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Package Structure

```
dist/
├── sigurd-startup.es.js      # ES Module bundle
├── sigurd-startup.umd.js     # UMD bundle
├── sigurd-startup.css        # Styles
├── index.d.ts                # TypeScript definitions
└── assets/                   # Game assets (images, audio)
```

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions:

1. Check the [examples](./examples/) folder
2. Review the [documentation](./docs/)
3. Open an issue on GitHub

## 🎯 Roadmap

- [ ] Additional game levels
- [ ] Multiplayer support
- [ ] Mobile touch controls
- [ ] Accessibility improvements
- [ ] Performance optimizations

---

**Made with ❤️ by Jonas Andersen**
