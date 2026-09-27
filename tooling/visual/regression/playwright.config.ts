import { defineConfig } from "@playwright/test";

/**
 * Role of this suite: a local, free, deterministic check while working on
 * a component. Its baselines are per-platform ({platform} in the path)
 * and were taken on darwin, so it is deliberately NOT a CI gate — CI
 * would have no matching baseline. Chromatic is the CI visual gate; it
 * blocks on pull requests. Two tools, two jobs, no overlap in spend.
 */

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
