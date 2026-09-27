import { describe, expect, it } from "vitest";
import { selectCiRelease } from "../ci-release.ts";

const sha = "a".repeat(40);
function fixture() {
  return {
    repository: "example/labs",
    runId: 123,
    attempt: 2,
    automatic: true,
    mainSha: sha,
    run: {
      id: 123,
      run_attempt: 2,
      head_sha: sha,
      head_branch: "main",
      path: ".github/workflows/ci.yml",
      event: "push",
      status: "completed",
      conclusion: "success",
      repository: { full_name: "example/labs" },
      head_repository: { full_name: "example/labs" },
    },
    artifacts: [
      {
        id: 456,
        name: `labs-release-${sha}-2`,
        expired: false,
        workflow_run: { id: 123, head_sha: sha },
      },
    ],
  };
}

describe("CI release selection", () => {
  it("selects an exact successful run and attempt, skipping stale automatic results", () => {
    const f = fixture();
    expect(selectCiRelease(f)).toEqual({
      sourceSha: sha,
      artifactId: 456,
      runId: 123,
    });
    expect(selectCiRelease({ ...f, mainSha: "b".repeat(40) })).toBeUndefined();
    expect(
      selectCiRelease({ ...f, mainSha: "b".repeat(40), automatic: false }),
    ).toBeDefined();
  });
  it.each([
    { conclusion: "failure" },
    { status: "in_progress" },
    { event: "pull_request" },
    { head_branch: "feature" },
    { path: ".github/workflows/other.yml" },
    { head_repository: { full_name: "fork/labs" } },
    { repository: { full_name: "other/labs" } },
    { id: 321 },
    { run_attempt: 1 },
  ])("rejects unverified run metadata %#", (change) => {
    const f = fixture();
    expect(() =>
      selectCiRelease({ ...f, run: { ...f.run, ...change } }),
    ).toThrow();
  });
  it("rejects expired, missing, duplicate and mismatched artifacts", () => {
    const f = fixture();
    for (const artifacts of [
      [],
      [...f.artifacts, ...f.artifacts],
      [{ ...f.artifacts[0], expired: true }],
      [{ ...f.artifacts[0], workflow_run: { id: 999, head_sha: sha } }],
      [
        {
          ...f.artifacts[0],
          workflow_run: { id: 123, head_sha: "b".repeat(40) },
        },
      ],
    ])
      expect(() => selectCiRelease({ ...f, artifacts })).toThrow();
  });
});
