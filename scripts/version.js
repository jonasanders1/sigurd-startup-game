#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version type from command line args
const versionType = process.argv[2] || 'build'; // 'major', 'minor', 'patch', 'build'

// Read current version file
const versionFilePath = path.join(__dirname, '../src/version.ts');
const versionContent = fs.readFileSync(versionFilePath, 'utf8');

// Extract current version numbers
const majorMatch = versionContent.match(/major: (\d+)/);
const minorMatch = versionContent.match(/minor: (\d+)/);
const patchMatch = versionContent.match(/patch: (\d+)/);
const buildMatch = versionContent.match(/build: (\d+)/);

let major = parseInt(majorMatch[1]);
let minor = parseInt(minorMatch[1]);
let patch = parseInt(patchMatch[1]);
let build = parseInt(buildMatch[1]);

// Increment version based on type
switch (versionType) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    build = 0;
    break;
  case 'minor':
    minor++;
    patch = 0;
    build = 0;
    break;
  case 'patch':
    patch++;
    build = 0;
    break;
  case 'build':
  default:
    build++;
    break;
}

// Generate new version string
const versionString = `${major}.${minor}.${patch}`;
const timestamp = Date.now();

// Generate a simple hash (you could use git commit hash here)
const hash = Math.random().toString(36).substring(2, 8).toUpperCase();

// Create new version content
const newVersionContent = `// Auto-generated version file
// This file is updated during the build process

export const VERSION = {
  major: ${major},
  minor: ${minor},
  patch: ${patch},
  build: ${build},
  timestamp: ${timestamp},
  hash: '${hash}',
  full: '${versionString}'
};

// Version string for easy access
export const VERSION_STRING = VERSION.full;

// Version object for external sites
export const getVersion = () => ({
  version: VERSION_STRING,
  major: VERSION.major,
  minor: VERSION.minor,
  patch: VERSION.patch,
  build: VERSION.build,
  timestamp: VERSION.timestamp,
  hash: VERSION.hash
});

// Version info for console logging
export const logVersion = () => {
  console.log(\`🎮 Sigurd Startup Game v\${VERSION_STRING} (Build \${VERSION.build})\`);
  console.log(\`📦 Hash: \${VERSION.hash}\`);
  console.log(\`⏰ Built: \${new Date(VERSION.timestamp).toISOString()}\`);
};
`;

// Write new version file
fs.writeFileSync(versionFilePath, newVersionContent);

// Update package.json version
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = versionString;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`✅ Version updated to ${versionString} (Build ${build})`);
console.log(`📦 Hash: ${hash}`);
console.log(`⏰ Timestamp: ${new Date(timestamp).toISOString()}`); 