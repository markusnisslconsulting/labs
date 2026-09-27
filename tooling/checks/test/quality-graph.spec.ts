import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { coverageIssues, maintainedFiles } from "../quality-graph";

const file = "apps/site/src/new.spec.ts";
const covered = {
  project: "site",
  root: "apps/site",
  ownedFiles: [],
  lintRoots: ["apps/site"],
  typed: new Set([file]),
};

describe("quality graph omissions", () => {
  it("rejects a test omitted by runner discovery even when lint and types cover it", () => {
    expect(coverageIssues([file], [covered], new Set())).toEqual([
      `${file}: not collected by a configured test runner`,
    ]);
  });
  it("rejects a source file outside its owner's lint or typecheck roots", () => {
    expect(
      coverageIssues(
        [file],
        [{ ...covered, lintRoots: ["apps/site/e2e"], typed: new Set() }],
        new Set([file]),
      ),
    ).toHaveLength(2);
  });
  it("requires ownership for a new top-level source directory", () => {
    expect(coverageIssues(["misc/check.ts"], [covered], new Set())).toEqual([
      "misc/check.ts: no owning project",
    ]);
  });
  it("accepts an explicitly owned root configuration file", () => {
    expect(
      coverageIssues(
        ["eslint.config.ts"],
        [
          {
            ...covered,
            ownedFiles: ["eslint.config.ts"],
            lintRoots: ["eslint.config.ts"],
            typed: new Set(["eslint.config.ts"]),
          },
        ],
        new Set(),
      ),
    ).toEqual([]);
  });
});

it("checks existing tracked and new files while excluding unstaged removals", () => {
  const root = mkdtempSync(join(tmpdir(), "labs-quality-graph-"));
  try {
    execFileSync("git", ["init", "--quiet", root]);
    writeFileSync(join(root, "kept.ts"), "export const kept = true;");
    writeFileSync(join(root, "removed.ts"), "export const removed = true;");
    execFileSync("git", ["add", "."], { cwd: root });
    rmSync(join(root, "removed.ts"));
    writeFileSync(join(root, "new.ts"), "export const added = true;");
    expect(maintainedFiles(root).sort()).toEqual(["kept.ts", "new.ts"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
