// Auto-generated version file
// This file is updated during the build process

import { log } from './lib/logger';

export const VERSION = {
  major: 1,
  minor: 1,
  patch: 0,
  build: 1,
  timestamp: 1751551567610,
  hash: '24TP8P',
  full: '1.1.0'
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
  log.game(`Sigurd Startup Game v${VERSION_STRING} (Build ${VERSION.build})`);
  log.info(`Hash: ${VERSION.hash}`);
  log.info(`Built: ${new Date(VERSION.timestamp).toISOString()}`);
};
