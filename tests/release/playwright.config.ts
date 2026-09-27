import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  use: { baseURL: process.env["RELEASE_URL"] ?? "http://127.0.0.1:4630" },
  webServer: process.env["RELEASE_URL"]
    ? undefined
    : {
        command: "PORT=4630 pnpm exec tsx tooling/release/serve.ts",
        url: "http://127.0.0.1:4630",
        reuseExistingServer: false,
        cwd: fileURLToPath(new URL("../..", import.meta.url)),
      },
});
