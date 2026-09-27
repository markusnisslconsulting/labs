import { defineConfig, devices } from "@playwright/test";

/* Capture both Chromium and WebKit to inspect native-control differences. */
export default defineConfig({
  testDir: ".",
  /* Both of the sweep's own specs, and not the axes one, which has its
     own config. Naming a single file here is what silently stopped
     docs.spec.ts from running at all — the run count dropped by thirteen
     and nothing said so. */
  testMatch: /(sweep|docs)\.spec\.ts$/,
  outputDir: "./.out",
  workers: 6,
  /* One retry, because this is a camera and not a gate. Twelve workers
     across two engines occasionally lose a navigation to a timeout, and a
     missing frame in a contact sheet reads as a broken component. A gate
     with retries hides failures; a screenshot run without them invents
     them. */
  retries: 1,
  reporter: [["line"]],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 900, height: 480 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 900, height: 480 },
      },
    },
  ],
});
