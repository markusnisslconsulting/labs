import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    root: ".",
    include: ["tooling/release/test/**/*.spec.ts"],
    environment: "node",
  },
});
