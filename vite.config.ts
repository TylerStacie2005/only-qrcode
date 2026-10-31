import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "tauri-plugin-admob-api": path.resolve(import.meta.dirname, "tauri-plugin-admob/guest-js/index.ts"),
    },
  },
  clearScreen: false,
  server: {
    host: host || false,
    port: 5173,
    strictPort: true,
    hmr: host ? { protocol: "ws", host, port: 5174 } : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
