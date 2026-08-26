import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

/**
 * Stories as tests, in a real browser.
 *
 * Kept separate from the node-side unit tests (`packages/ui/test`) on
 * purpose: those read stylesheets and the token registry off disk and have
 * no business paying for a browser, and mixing the two environments in one
 * project makes every failure ambiguous about where it ran.
 *
 * There is no setup file. Since Storybook 10.3 the addon applies the
 * preview's annotations itself, and adding a `setProjectAnnotations` call
 * makes it step aside — so the file that looks like it wires the theme up
 * is the file that stops the theme being wired up.
 */
export default defineConfig({
  plugins: [storybookTest({ configDir: ".storybook" })],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      // Vitest 4 takes a provider factory, not the string "playwright".
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
