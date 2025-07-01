# Versioning System

The Sigurd Startup Game includes an automatic versioning system that tracks versions and makes them available to external sites.

## Version Format

Versions follow semantic versioning: `MAJOR.MINOR.PATCH` with an additional build number:

- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible
- **Build**: Auto-incremented build number

Example: `1.2.3 (Build 42)`

## Build Commands

### Auto-increment build number (default)
```bash
npm run build
# or
npm run build:dev
```

### Increment patch version
```bash
npm run build:patch
```

### Increment minor version
```bash
npm run build:minor
```

### Increment major version
```bash
npm run build:major
```

### Version only (no build)
```bash
npm run version:build    # Increment build
npm run version:patch    # Increment patch
npm run version:minor    # Increment minor
npm run version:major    # Increment major
```

## Version Information

### In the Game
- Version is displayed in the bottom-right corner
- Console logs version info when game loads

### For External Sites

#### 1. HTML Attributes
```html
<sigurd-startup data-version="1.0.0" data-build="1"></sigurd-startup>
```

#### 2. JavaScript Methods
```javascript
const gameElement = document.querySelector('sigurd-startup');

// Get full version info
const versionInfo = gameElement.getVersion();
console.log(versionInfo);
// {
//   version: "1.0.0",
//   major: 1,
//   minor: 0,
//   patch: 0,
//   build: 1,
//   timestamp: 1722528623501,
//   hash: "MZWQL6"
// }

// Check compatibility
const isCompatible = gameElement.isCompatible("1.0.0");
console.log(isCompatible); // true
```

#### 3. Direct Import (if available)
```javascript
import { getVersion, logVersion } from './path/to/sigurd-startup-game.js';

const version = getVersion();
logVersion();
```

## Version File

The version information is stored in `src/version.ts` and is automatically updated during builds:

```typescript
export const VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 1,
  timestamp: 1722528623501,
  hash: 'MZWQL6',
  full: '1.0.0'
};
```

## Integration Example


## Best Practices

1. **Always check compatibility** before using game features
2. **Log version info** for debugging purposes
3. **Use semantic versioning** appropriately:
   - `build`: Regular builds, no API changes
   - `patch`: Bug fixes only
   - `minor`: New features, backward compatible
   - `major`: Breaking changes

4. **Monitor version changes** in external sites to ensure compatibility

## Console Output

When the game loads, you'll see:
```
🎮 Sigurd Startup Game v1.0.0 (Build 1)
📦 Hash: MZWQL6
⏰ Built: 2025-07-01T16:10:23.501Z
``` 