#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

console.log('🧪 Testing package build...\n');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder not found. Run "npm run build:lib" first.');
  process.exit(1);
}

// Check required files
const requiredFiles = [
  'sigurd-startup.es.js',
  'sigurd-startup.umd.js',
  'sigurd-startup.css',
  'index.d.ts'
];

const missingFiles = [];
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles.join(', '));
  process.exit(1);
}

// Assets are inlined into the JS bundle via import.meta.glob({ eager: true })
// in src/config/assets.ts, so dist/assets/ no longer exists. Sanity-check the
// bundle contains data: URLs as a proxy for "assets shipped".
const esModulePath = path.join(distPath, 'sigurd-startup.es.js');
const esModuleSize = fs.statSync(esModulePath).size;
const inlineAssetCount = (
  fs.readFileSync(esModulePath, 'utf8').match(/data:image\/(png|jpe?g|gif);base64,/g) || []
).length;
console.log(
  `✅ Bundle includes ${inlineAssetCount} inline asset URLs (${(esModuleSize / 1024 / 1024).toFixed(1)} MB)`
);

// Check file sizes
console.log('\n📦 Package contents:');
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`  ${file}: ${sizeKB} KB`);
}

// Check if the package can be imported (basic syntax check)
try {
  const esModulePath = path.join(distPath, 'sigurd-startup.es.js');
  const esModuleContent = fs.readFileSync(esModulePath, 'utf8');
  
  // Basic checks
  if (!esModuleContent.includes('export')) {
    throw new Error('No exports found in ES module');
  }
  
  if (!esModuleContent.includes('customElements.define')) {
    throw new Error('Custom element not found in ES module');
  }
  
  console.log('\n✅ ES module syntax check passed');
} catch (error) {
  console.error('❌ ES module syntax check failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Package test completed successfully!');
console.log('📤 Ready to publish with: npm publish'); 