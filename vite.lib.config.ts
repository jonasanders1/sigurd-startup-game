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
          // Route bundled binary assets (sprites, audio, fonts) under
          // dist/assets/ with their original filenames so consumers can
          // resolve them via the same path the @font-face / sprite
          // imports reference.
          const name = assetInfo.name ?? '';
          if (/\.(png|jpe?g|gif|wav|mp3|ogg|ttf|otf|woff2?)$/i.test(name)) {
            return 'assets/[name][extname]';
          }
          return name || 'asset';
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
    // Source maps off for the published bundle (saves ~44MB per install +
    // avoids leaking original TS structure to npm consumers).
    sourcemap: false,
    // Target modern browsers
    target: 'es2020',
  },
  // Assets are now in src/assets/ so they get processed by Vite
  publicDir: 'public',
  // Asset handling — `.ttf`/`.otf`/`.woff*` are already in Vite's default
  // asset list; the others need to be listed explicitly so Vite treats
  // them as importable URLs in dev too.
  assetsInclude: ['**/*.png', '**/*.wav', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
}); 