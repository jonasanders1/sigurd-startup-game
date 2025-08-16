#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version type from command line args
const versionType = process.argv[2] || 'build'; // 'major', 'minor', 'patch', 'build'

// Read current version from package.json first (source of truth)
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Parse current version from package.json
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Read current version file to get build number
const versionFilePath = path.join(__dirname, '../src/version.ts');
let currentBuild = 1;

if (fs.existsSync(versionFilePath)) {
  const versionContent = fs.readFileSync(versionFilePath, 'utf8');
  const buildMatch = versionContent.match(/build: (\d+)/);
  if (buildMatch) {
    currentBuild = parseInt(buildMatch[1]);
  }
}

let newMajor = major;
let newMinor = minor;
let newPatch = patch;
let newBuild = currentBuild;

// Increment version based on type
switch (versionType) {
  case 'major':
    newMajor++;
    newMinor = 0;
    newPatch = 0;
    newBuild = 0;
    break;
  case 'minor':
    newMinor++;
    newPatch = 0;
    newBuild = 0;
    break;
  case 'patch':
    newPatch++;
    newBuild = 0;
    break;
  case 'build':
  default:
    newBuild++;
    break;
}

// Generate new version string
const versionString = `${newMajor}.${newMinor}.${newPatch}`;
const timestamp = Date.now();

// Generate a simple hash (you could use git commit hash here)
const hash = Math.random().toString(36).substring(2, 8).toUpperCase();

// Create new version content
const newVersionContent = `// Auto-generated version file
// This file is updated during the build process

export const VERSION = {
  major: ${newMajor},
  minor: ${newMinor},
  patch: ${newPatch},
  build: ${newBuild},
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
  console.log('🎮 Sigurd Startup Game v' + VERSION_STRING + ' (Build ' + VERSION.build + ')');
  console.log('📦 Hash: ' + VERSION.hash);
  console.log('⏰ Built: ' + new Date(VERSION.timestamp).toISOString());
};
`;

// Write new version file
fs.writeFileSync(versionFilePath, newVersionContent);

// Update package.json version
packageJson.version = versionString;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Version updated to ' + versionString + ' (Build ' + newBuild + ')');
console.log('📦 Hash: ' + hash);
console.log('⏰ Timestamp: ' + new Date(timestamp).toISOString());
console.log('📦 Package.json updated to version ' + versionString);