import { z } from "zod";

const runSchema = z.object({
  id: z.number().int().positive(),
  run_attempt: z.number().int().positive(),
  head_sha: z.string().regex(/^[a-f0-9]{40}$/),
  head_branch: z.literal("main"),
  path: z.literal(".github/workflows/ci.yml"),
  event: z.enum(["push", "workflow_dispatch"]),
  status: z.literal("completed"),
  conclusion: z.literal("success"),
  repository: z.object({ full_name: z.string() }),
  head_repository: z.object({ full_name: z.string() }),
});
const artifactSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  expired: z.literal(false),
  workflow_run: z.object({
    id: z.number().int().positive(),
    head_sha: z.string(),
  }),
});

export function selectCiRelease(options: {
  repository: string;
  runId: number;
  attempt: number;
  run: unknown;
  artifacts: unknown[];
  automatic: boolean;
  mainSha: string;
}) {
  const run = runSchema.parse(options.run);
  if (
    run.id !== options.runId ||
    run.run_attempt !== options.attempt ||
    run.repository.full_name !== options.repository ||
    run.head_repository.full_name !== options.repository
  )
    throw new Error(
      "CI run provenance does not match this repository and attempt",
    );
  if (options.automatic && run.head_sha !== options.mainSha) return undefined;
  const name = `labs-release-${run.head_sha}-${run.run_attempt}`;
  const matching = options.artifacts.filter(
    (artifact) =>
      typeof artifact === "object" &&
      artifact !== null &&
      "name" in artifact &&
      artifact.name === name,
  );
  if (matching.length !== 1)
    throw new Error("Expected exactly one retained CI release artifact");
  const artifact = artifactSchema.parse(matching[0]);
  if (
    artifact.workflow_run.id !== run.id ||
    artifact.workflow_run.head_sha !== run.head_sha
  )
    throw new Error("Artifact provenance does not match its successful CI run");
  return { sourceSha: run.head_sha, artifactId: artifact.id, runId: run.id };
}
