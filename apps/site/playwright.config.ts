import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

/**
 * The labs site's own checks.
 *
 * Unlike the visual suite these need no baselines, so they are safe to
 * run anywhere and belong in CI: the design system was axe-checked
 * component by component while the site that assembles them was not
 * checked at all, which is exactly the composition gap that component
 * level accessibility cannot see.
 */
export default defineConfig({
  testDir: fileURLToPath(new URL("./e2e", import.meta.url)),
  use: { baseURL: process.env["SITE_URL"] ?? "http://127.0.0.1:4620" },
  reporter: [["list"]],
});
