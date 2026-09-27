import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: ".",
    include: ["apps/ui-mcp/test/**/*.spec.ts"],
    environment: "node",
  },
});
