import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./browser",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  reporter: process.env["CI"] ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:4414",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
