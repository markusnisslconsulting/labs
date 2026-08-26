import type { Plugin } from "vite";

/**
 * Assert that "use client" is still the first statement of every chunk
 * that has one.
 *
 * A directive is only a directive while it is the first statement of the
 * module; anywhere else it is a string expression that evaluates and is
 * discarded. That is not a theoretical risk — it happened here. Rollup
 * hoists imports above the module body and the per-component CSS plugin
 * prepends one more, so the components were emitted as
 *
 *     import "../Button.css";
 *     "use client";
 *
 * which a React Server Components build reads as a server component with
 * a pointless string in it. Nothing in the library fails; the consumer's
 * app fails, several layers from the cause, with an error about hooks in
 * a server component.
 *
 * This plugin does not fix that — the plugin that inserts the import does,
 * by inserting after the directive. This one refuses to let it regress,
 * because the fix lives in a different file from the symptom.
 */
export function assertClientDirectiveFirst(): Plugin {
  return {
    name: "labs-use-client",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        const hit = /["']use client["'];?/.exec(chunk.code);
        if (!hit) continue;
        if (hit.index !== 0) {
          const before = chunk.code.slice(0, hit.index).trim().split("\n")[0];
          this.error(
            `${chunk.fileName}: "use client" is not the first statement — ` +
              `${JSON.stringify(before)} comes before it, so the directive is ` +
              `dead and this chunk ships as a server component`,
          );
        }
      }
    },
  };
}
