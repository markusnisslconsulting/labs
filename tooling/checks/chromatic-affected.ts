import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { z } from "zod";
import { comparisonFromEnvironment } from "./ci-range";

const comparison = comparisonFromEnvironment(process.cwd());
let run = true;
if (comparison.mode === "affected" && comparison.base) {
  const output = execFileSync(
    "pnpm",
    [
      "exec",
      "nx",
      "show",
      "projects",
      "--affected",
      "--json",
      `--base=${comparison.base}`,
      `--head=${comparison.head}`,
    ],
    { encoding: "utf8" },
  );
  run = z.array(z.string()).parse(JSON.parse(output)).includes("ui");
}
console.log(
  `${comparison.reason}; Chromatic ${run ? "required" : "unaffected"}`,
);
if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
