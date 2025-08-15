import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

// Library build config - create a truly self-contained package
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "SigurdStartup",
      fileName: (format) => `sigurd-startup.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // Don't externalize anything - bundle everything inside
      output: {
        exports: "named",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'sigurd-startup.css';
          // Handle assets with proper naming - assets from src/assets/ will be here
          if (assetInfo.name?.endsWith('.png') || assetInfo.name?.endsWith('.wav')) {
            return `assets/[name][extname]`;
          }
          return assetInfo.name || 'asset';
        },
        // Ensure all assets are properly named
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: (chunkInfo) => {
          // Generate the correct filenames for ES and UMD formats
          if (chunkInfo.name === 'index') {
            return 'sigurd-startup.[format].js';
          }
          return '[name].js';
        },
      },
    },
    cssCodeSplit: false,
    // Assets are now in src/ so they get bundled automatically
    assetsInlineLimit: 0,
    // Copy public directory for any remaining assets
    copyPublicDir: true,
    // Ensure we get source maps for debugging
    sourcemap: true,
    // Target modern browsers
    target: 'es2020',
  },
  // Assets are now in src/assets/ so they get processed by Vite
  publicDir: 'public',
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.wav', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
}); 