import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/renderer"
  },
  plugins: [react()],
  server: {
    port: 5174
  }
});
