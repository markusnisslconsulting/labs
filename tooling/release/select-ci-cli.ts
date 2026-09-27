import { appendFile, readFile } from "node:fs/promises";
import { z } from "zod";
import { selectCiRelease } from "./ci-release.ts";
import { githubJson, repositoryPath } from "./github.ts";

const positiveId = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
const event = JSON.parse(
  await readFile(process.env["GITHUB_EVENT_PATH"]!, "utf8"),
) as Record<string, unknown>;
const automatic = process.env["GITHUB_EVENT_NAME"] === "workflow_run";
if (!automatic && process.env["GITHUB_EVENT_NAME"] !== "workflow_dispatch")
  throw new Error("Unsupported deployment trigger");
const candidate = z.object({ id: positiveId, run_attempt: positiveId }).parse(
  automatic
    ? event["workflow_run"]
    : {
        id: process.env["CI_RUN_ID"],
        run_attempt: process.env["CI_ATTEMPT"],
      },
);
const repository = repositoryPath();
const run = await githubJson(
  `${repository}/actions/runs/${candidate.id}/attempts/${candidate.run_attempt}`,
);
const main = z
  .object({ object: z.object({ sha: z.string() }) })
  .parse(await githubJson(`${repository}/git/ref/heads/main`));
const artifacts: unknown[] = [];
for (let page = 1; ; page++) {
  const batch = z
    .object({ artifacts: z.array(z.unknown()) })
    .parse(
      await githubJson(
        `${repository}/actions/runs/${candidate.id}/artifacts?per_page=100&page=${page}`,
      ),
    );
  artifacts.push(...batch.artifacts);
  if (batch.artifacts.length < 100) break;
  if (page >= 100) throw new Error("Unexpected artifact pagination size");
}
const release = selectCiRelease({
  repository: process.env["GITHUB_REPOSITORY"]!,
  runId: candidate.id,
  attempt: candidate.run_attempt,
  run,
  artifacts,
  automatic,
  mainSha: main.object.sha,
});
const output = process.env["GITHUB_OUTPUT"];
if (!output) throw new Error("Missing workflow output file");
await appendFile(
  output,
  release
    ? `deploy=true\nsource_sha=${release.sourceSha}\nartifact_id=${release.artifactId}\nrun_id=${release.runId}\n`
    : "deploy=false\n",
);
console.log(
  release
    ? `Selected verified CI artifact ${release.artifactId} for ${release.sourceSha}`
    : "Skipped an older CI result because main has advanced",
);
