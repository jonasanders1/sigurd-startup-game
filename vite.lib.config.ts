import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

// Library build config - no React plugin
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index-simple.ts"),
      name: "SigurdStartup",
      fileName: (format) => `sigurd-startup.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        exports: "named",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'sigurd-startup.css';
          return assetInfo.name || 'asset';
        },
      },
    },
    cssCodeSplit: false,
  },
  publicDir: 'public',
}); 