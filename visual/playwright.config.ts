import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  outputDir: "./.visual-output",
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{arg}.png",
  use: {
    viewport: { width: 1100, height: 800 },
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
});
