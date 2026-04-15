import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
      {
        find: /^three$/,
        replacement: path.resolve(__dirname, "./node_modules/three/build/three.module.js"),
      },
      {
        find: /^three\/webgpu$/,
        replacement: path.resolve(__dirname, "./node_modules/three/build/three.webgpu.js"),
      },
    ],
    dedupe: ["react", "react-dom", "three"],
  },
  optimizeDeps: {
    include: ["react-force-graph-3d", "three-spritetext"],
    exclude: ["three"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    target: "es2022",
  },
});
