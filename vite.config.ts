import { resolve } from "path";
import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, "src/main.ts") },
      external: ["lodash"],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
        dir: "output",
        format: "cjs",
      },
    },
    outDir: "output",
    emptyOutDir: true,
    target: "es2017",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
