import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: ".",
    include: [
      "apps/site/src/**/*.spec.{ts,tsx}",
      "apps/site/scripts/**/*.spec.ts",
    ],
    environment: "node",
  },
});
