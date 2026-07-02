import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    // @datacon/shared-types is a CommonJS workspace package (its dist is also
    // require()'d by the NestJS API at runtime, so it must stay CJS); force
    // esbuild to pre-bundle/convert it to ESM for the browser dev server,
    // since Vite doesn't auto-optimize symlinked monorepo packages.
    include: ["@datacon/shared-types"],
  },
});
