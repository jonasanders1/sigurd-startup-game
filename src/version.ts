// Auto-generated version file
// This file is updated during the build process

import { log } from './lib/logger';

export const VERSION = {
  major: 2,
  minor: 5,
  patch: 0,
  build: 11,
  timestamp: 1756021660145,
  hash: 'DV9BEK',
  full: '2.5.0'
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
  log.game('Sigurd Startup Game v' + VERSION_STRING + ' (Build ' + VERSION.build + ')');
  log.game('Hash: ' + VERSION.hash);
  log.game('Built: ' + new Date(VERSION.timestamp).toISOString());
};
