import { defineConfig, devices } from "@playwright/test";

/**
 * Two engines, because both defects that reached Markus were engine
 * specific and neither was visible in the one engine the pipeline used.
 *
 * Chromium drew our Combobox chevron next to its own datalist triangle;
 * WebKit drew a bevelled box with a checkmark inside the Select we had
 * already drawn. A suite that renders in one browser cannot see either,
 * and a suite that compares a render against its own previous render
 * cannot see them at all.
 */
export default defineConfig({
  testDir: ".",
  outputDir: "./.sweep-output",
  workers: 6,
  reporter: [["line"]],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 900, height: 480 } },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 900, height: 480 } },
    },
  ],
});
