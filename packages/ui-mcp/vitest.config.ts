import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: ".",
    include: ["packages/ui-mcp/test/**/*.spec.ts"],
    environment: "node",
  },
});
