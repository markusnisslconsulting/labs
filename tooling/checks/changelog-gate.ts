import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  changedFiles,
  comparisonFromEnvironment,
  resolveComparison,
  type Comparison,
} from "./ci-range";

export function checkChangelog(root: string, comparison: Comparison): string {
  const files = changedFiles(root, comparison);
  if (!files.includes("packages/ui/api-surface.md"))
    return "API surface unchanged";
  if (!files.includes("CHANGELOG.md"))
    throw new Error(
      "packages/ui/api-surface.md changed without CHANGELOG.md. Add an entry describing the affected components and compatibility impact.",
    );
  return "API surface and changelog both changed; entry content requires review";
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = process.cwd();
  const base = process.argv[2];
  const comparison = base
    ? resolveComparison(root, { base })
    : comparisonFromEnvironment(root);
  console.log(checkChangelog(root, comparison));
}
