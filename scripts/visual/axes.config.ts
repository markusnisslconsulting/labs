import { defineConfig, devices } from "@playwright/test";

/** Chromium only: the axes are CSS, and a second engine would double the
 *  sheets without doubling what they show. Engine differences are the
 *  sweep's job. */
export default defineConfig({
  testDir: ".",
  testMatch: "axes.spec.ts",
  outputDir: "./.out",
  workers: 6,
  retries: 1,
  reporter: [["line"]],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 760, height: 520 },
      },
    },
  ],
});
