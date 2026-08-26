import type { TestRunnerConfig } from "@storybook/test-runner";
import { getStoryContext } from "@storybook/test-runner";
import { checkA11y, configureAxe, injectAxe } from "axe-playwright";

/**
 * The a11y gate. The addon renders findings in the panel; this is what
 * makes them fail a build, which is the difference between documenting
 * accessibility and enforcing it.
 *
 * Stories opt out per story with `parameters.a11y.disable`, and narrow
 * the rule set with `parameters.a11y.config.rules` — the same shape the
 * addon reads, so the panel and CI never disagree.
 */
/**
 * axe refuses to start while a previous run is in flight, and stories
 * that keep timers alive can overlap. Serialising the checks in-process
 * keeps the gate deterministic instead of intermittently red.
 */
let inFlight: Promise<unknown> = Promise.resolve();
function serialize<T>(run: () => Promise<T>): Promise<T> {
  const next = inFlight.then(run, run);
  inFlight = next.catch(() => undefined);
  return next;
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    const a11y = storyContext.parameters?.["a11y"] as
      | { disable?: boolean; test?: string; config?: { rules?: unknown[] } }
      | undefined;

    if (a11y?.disable || a11y?.test === "off") return;

    if (a11y?.config?.rules) {
      await configureAxe(page, { rules: a11y.config.rules as never });
    }
    const check = () =>
      serialize(() =>
        checkA11y(
          page,
          "#storybook-root",
          { detailedReport: true, detailedReportOptions: { html: true } },
          // skipFailures = false: a violation throws, so the run is red.
          false,
        ),
      );

    // Light, then dark.
    //
    // The runner visits each story once with the default globals, which
    // meant every accessibility check only ever saw the light theme. Dark
    // shipped for months with a black-on-dark select, a tooltip trigger
    // on the browser's grey button face, and a nested brand that kept its
    // light accent under a dark root. All three were invisible here.
    //
    // Flipping the attribute in place costs one extra axe run per story
    // rather than a second full pass over the Storybook.
    await check();
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark"),
    );
    try {
      await check();
    } finally {
      await page.evaluate(() =>
        document.documentElement.removeAttribute("data-theme"),
      );
    }
  },
};

export default config;
