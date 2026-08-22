import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The ui package is consumed as source, so both the app and Storybook
// compile one copy of each component.
const uiSrc = fileURLToPath(new URL("../../packages/ui/src", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      "@labs/ui": uiSrc,
    },
  },
  server: { port: 4300 },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
  },
});
