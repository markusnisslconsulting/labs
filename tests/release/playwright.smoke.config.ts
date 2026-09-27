import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: ["routes.spec.ts", "smoke.spec.ts"],
  webServer: undefined,
  retries: 0,
  workers: 2,
  timeout: 120_000,
  globalTimeout: 600_000,
});
