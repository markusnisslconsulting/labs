import { defineConfig } from "vite";
import { resolve } from "node:path";

const entry = process.env.ENTRY ?? "barrel";
const consumerRoot = process.env.CONSUMER_ROOT;
if (!consumerRoot)
  throw new Error(
    "Run the consumer-check command to install the artifact first.",
  );

export default defineConfig({
  logLevel: "error",
  root: consumerRoot,
  build: {
    outDir: resolve(consumerRoot, `.out/${entry}`),
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    lib: {
      entry: resolve(consumerRoot, `src/${entry}.tsx`),
      formats: ["es"],
      fileName: "app",
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime", "react-dom"],
    },
  },
});
