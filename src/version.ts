// Auto-generated version file
// This file is updated during the build process

export const VERSION = {
  major: 2,
  minor: 7,
  patch: 2,
  build: 0,
  timestamp: 1756158125768,
  hash: 'M5VIVU',
  full: '2.7.2'
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
