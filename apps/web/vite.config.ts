// Vite config -- React plugin, path aliases matching tsconfig ("@/..."
// -> src/), and a dev-server proxy so the web app can call /api/v1/*
// without CORS friction while apps/api runs on its own port locally.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
