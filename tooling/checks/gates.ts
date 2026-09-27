import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkChangelog } from "./changelog-gate";
import { comparisonFromEnvironment, type Comparison } from "./ci-range";

export const targets = [
  "lint",
  "typecheck",
  "test",
  "build",
  "build-storybook",
  "test-storybook",
  "browser-test",
  "package-check",
  "tokens-check",
  "tokens-dtcg",
  "contrast-check",
  "story-coverage",
  "snapshot-budget",
  "adoption",
  "a11y",
  "inventory",
  "api-surface",
  "quality-graph",
];

export function nxGateArgs(comparison: Comparison, all: boolean): string[] {
  return comparison.mode === "affected" && comparison.base && !all
    ? [
        "affected",
        `--targets=${targets.join(",")}`,
        `--base=${comparison.base}`,
        `--head=${comparison.head}`,
      ]
    : ["run-many", `--targets=${targets.join(",")}`];
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--affected"))
    throw new Error("Usage: pnpm gates [--affected]");
  const comparison = comparisonFromEnvironment(process.cwd());
  console.log(
    `${comparison.reason}: ${comparison.base ?? "unavailable"} -> ${comparison.head}`,
  );
  const run = (args: string[]) =>
    execFileSync("pnpm", args, { stdio: "inherit" });
  run(["format:check"]);
  run(["audit:production"]);
  run(["exec", "nx", ...nxGateArgs(comparison, !args.includes("--affected"))]);
  // Budget probes must have all their inputs, including on an unrelated PR.
  run([
    "exec",
    "nx",
    "run-many",
    "--targets=build,build-storybook",
    "--projects=site,ui",
  ]);
  run(["size-check"]);
  console.log(checkChangelog(process.cwd(), comparison));
}
