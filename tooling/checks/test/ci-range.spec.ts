import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { changedFiles, git, resolveComparison } from "../ci-range";
import { checkChangelog } from "../changelog-gate";
import { nxGateArgs } from "../gates";

const roots: string[] = [];
const nx = join(
  dirname(createRequire(import.meta.url).resolve("nx/package.json")),
  "dist/bin/nx.js",
);
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "labs-ci-range-"));
  roots.push(root);
  git(root, "init", "-b", "main");
  git(root, "config", "user.email", "fixture@example.test");
  git(root, "config", "user.name", "Fixture");
  const write = (file: string, content: string) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  };
  const commit = (message: string) => {
    git(root, "add", ".");
    git(root, "commit", "--quiet", "-m", message);
    return git(root, "rev-parse", "HEAD");
  };
  write("package.json", JSON.stringify({ name: "ci-fixture", private: true }));
  const { namedInputs, targetDefaults } = JSON.parse(
    readFileSync("nx.json", "utf8"),
  );
  write("nx.json", JSON.stringify({ namedInputs, targetDefaults }));
  write(".gitignore", "node_modules\n.nx\n");
  mkdirSync(join(root, "node_modules"));
  symlinkSync(
    dirname(dirname(dirname(nx))),
    join(root, "node_modules/nx"),
    "dir",
  );
  for (const name of ["ui", "site", "untouched"]) {
    write(
      `packages/${name}/project.json`,
      JSON.stringify({
        name,
        targets: { test: { command: "node --version" } },
      }),
    );
    write(`packages/${name}/index.ts`, "export const initial = true;\n");
  }
  write("packages/ui/api-surface.md", "Initial API\n");
  write("CHANGELOG.md", "Initial release\n");
  const initial = commit("Initial fixture");
  return { root, write, commit, initial };
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

it.each(["build", "build-storybook"])(
  "invalidates %s when a source-only build-tool dependency changes",
  (target) => {
    const f = fixture();
    f.write(
      "packages/site/project.json",
      JSON.stringify({
        name: "site",
        implicitDependencies: ["ui"],
        targets: { [target]: { command: "node packages/site/run-build.cjs" } },
      }),
    );
    f.write(
      "packages/site/run-build.cjs",
      "require('node:fs').appendFileSync('.nx/build-runs.txt', 'run\\n');",
    );
    f.commit("Build configuration");
    const run = () =>
      execFileSync(process.execPath, [nx, "run", `site:${target}`], {
        cwd: f.root,
        encoding: "utf8",
        env: { ...process.env, NX_DAEMON: "false" },
      });
    run();
    run();
    expect(readFileSync(join(f.root, ".nx/build-runs.txt"), "utf8")).toBe(
      "run\n",
    );
    f.write("packages/ui/index.ts", "export const guard = 'changed';\n");
    f.commit("Update build-tool source");
    run();
    expect(readFileSync(join(f.root, ".nx/build-runs.txt"), "utf8")).toBe(
      "run\nrun\n",
    );
  },
  30_000,
);

describe("CI comparison", () => {
  it("selects projects from every commit in a push through the actual Nx graph", () => {
    const f = fixture();
    f.write("packages/ui/index.ts", "export const updated = true;\n");
    f.commit("Earlier UI change");
    f.write("packages/site/index.ts", "export const updated = true;\n");
    const head = f.commit("Later site change");
    const comparison = resolveComparison(f.root, {
      eventName: "push",
      event: { before: f.initial, after: head },
    });
    expect(comparison.mode).toBe("affected");
    const output = execFileSync(
      process.execPath,
      [
        nx,
        "show",
        "projects",
        "--affected",
        "--json",
        `--base=${comparison.base}`,
        `--head=${head}`,
      ],
      {
        cwd: f.root,
        encoding: "utf8",
        env: { ...process.env, NX_DAEMON: "false" },
      },
    );
    expect(JSON.parse(output).sort()).toEqual(["site", "ui"]);
    expect(nxGateArgs(comparison, false)).toContain(`--base=${f.initial}`);
    expect(nxGateArgs(comparison, true)[0]).toBe("run-many");
  }, 30_000);

  it("selects the whole graph when shared CI setup changes", () => {
    const f = fixture();
    f.write(".github/actions/setup/action.yml", "name: Changed setup\n");
    const head = f.commit("Change shared setup");
    const output = execFileSync(
      process.execPath,
      [
        nx,
        "show",
        "projects",
        "--affected",
        "--json",
        `--base=${f.initial}`,
        `--head=${head}`,
      ],
      {
        cwd: f.root,
        encoding: "utf8",
        env: { ...process.env, NX_DAEMON: "false" },
      },
    );
    expect(JSON.parse(output).sort()).toEqual(["site", "ui", "untouched"]);
  }, 30_000);

  it("catches an API change in an earlier push commit even when the final commit only changes the site", () => {
    const f = fixture();
    f.write("packages/ui/api-surface.md", "Breaking API\n");
    f.commit("Change API");
    f.write("packages/site/index.ts", "export const later = true;\n");
    const head = f.commit("Change site");
    const comparison = resolveComparison(f.root, {
      eventName: "push",
      event: { before: f.initial, after: head },
    });
    expect(() => checkChangelog(f.root, comparison)).toThrow(
      "without CHANGELOG.md",
    );
    f.write("CHANGELOG.md", "Describe breaking API\n");
    const updatedHead = f.commit("Document API");
    expect(
      checkChangelog(f.root, { ...comparison, head: updatedHead }),
    ).toContain("requires review");
  });

  it("compares the tested pull request merge with the event base rather than a moving branch ref", () => {
    const f = fixture();
    git(f.root, "checkout", "-b", "feature");
    f.write("packages/ui/index.ts", "export const feature = true;\n");
    f.commit("Feature");
    git(f.root, "checkout", "main");
    f.write("packages/site/index.ts", "export const unrelated = true;\n");
    const base = f.commit("Base advanced");
    git(f.root, "merge", "--no-ff", "feature", "-m", "Tested merge");
    const head = git(f.root, "rev-parse", "HEAD");
    const comparison = resolveComparison(f.root, {
      eventName: "pull_request",
      event: { pull_request: { base: { sha: base } } },
      expectedHead: head,
    });
    expect(changedFiles(f.root, comparison)).toEqual(["packages/ui/index.ts"]);
    expect(comparison.base).toBe(base);
  });

  it("uses full verification and the actual before/after trees after a force push", () => {
    const f = fixture();
    f.write("packages/ui/api-surface.md", "Removed API\n");
    const before = f.commit("Previous main tip");
    git(f.root, "reset", "--hard", f.initial);
    f.write("packages/site/index.ts", "export const rewritten = true;\n");
    const head = f.commit("Rewritten main");
    const comparison = resolveComparison(f.root, {
      eventName: "push",
      event: { before, after: head, forced: true },
    });
    expect(comparison.mode).toBe("all");
    expect(changedFiles(f.root, comparison)).toContain(
      "packages/ui/api-surface.md",
    );
    expect(() => checkChangelog(f.root, comparison)).toThrow(
      "without CHANGELOG.md",
    );
  });

  it("checks all projects on the first push and compares its files with an empty tree", () => {
    const f = fixture();
    const comparison = resolveComparison(f.root, {
      eventName: "push",
      event: { before: "0".repeat(40), after: f.initial },
    });
    expect(comparison.mode).toBe("all");
    expect(changedFiles(f.root, comparison)).toContain("CHANGELOG.md");
    expect(checkChangelog(f.root, comparison)).toContain("requires review");
  });

  it.each(["push", "pull_request"])(
    "does not pass the changelog check when %s history is unavailable",
    (eventName) => {
      const f = fixture();
      const missing = "a".repeat(40);
      const event =
        eventName === "push"
          ? { before: missing, after: f.initial }
          : { pull_request: { base: { sha: missing } } };
      const comparison = resolveComparison(f.root, { eventName, event });
      expect(nxGateArgs(comparison, false)[0]).toBe("run-many");
      expect(() => checkChangelog(f.root, comparison)).toThrow(
        "without a comparison base",
      );
    },
  );

  it("requires a changelog base for manual full-workspace verification", () => {
    const f = fixture();
    expect(() =>
      resolveComparison(f.root, { eventName: "workflow_dispatch", event: {} }),
    ).toThrow();
    const comparison = resolveComparison(f.root, {
      eventName: "workflow_dispatch",
      event: { inputs: { base: f.initial } },
    });
    expect(comparison.mode).toBe("all");
    expect(comparison.base).toBe(f.initial);
  });

  it("fails when the checked-out commit differs from the event", () => {
    const f = fixture();
    expect(() =>
      resolveComparison(f.root, { expectedHead: "a".repeat(40) }),
    ).toThrow("workflow SHA");
    expect(() =>
      resolveComparison(f.root, {
        eventName: "push",
        event: { before: f.initial, after: "a".repeat(40) },
      }),
    ).toThrow("after-SHA");
  });

  it("includes uncommitted local API edits and rejects an invalid explicit base", () => {
    const f = fixture();
    f.write("packages/ui/api-surface.md", "Uncommitted API\n");
    expect(() =>
      checkChangelog(f.root, resolveComparison(f.root, { base: "main" })),
    ).toThrow("without CHANGELOG.md");
    expect(() =>
      checkChangelog(f.root, resolveComparison(f.root, { base: "missing" })),
    ).toThrow("without a comparison base");
  });

  it("does not treat a shallow boundary as an initial commit", () => {
    const f = fixture();
    f.write("packages/site/index.ts", "export const later = true;\n");
    f.commit("Second commit");
    const shallow = mkdtempSync(join(tmpdir(), "labs-ci-shallow-"));
    roots.push(shallow);
    git(shallow, "clone", "--quiet", "--depth=1", `file://${f.root}`, ".");
    expect(() => checkChangelog(shallow, resolveComparison(shallow))).toThrow(
      "without a comparison base",
    );
  });
});

interface Workflow {
  jobs: Record<string, { steps: { uses?: string; run?: string }[] }>;
}
it("workflows share installation and CI calls the local gate entry point", () => {
  for (const name of ["ci", "chromatic", "audit", "deploy"]) {
    const workflow = parse(
      readFileSync(`.github/workflows/${name}.yml`, "utf8"),
    ) as Workflow;
    const steps = Object.values(workflow.jobs).flatMap((job) => job.steps);
    expect(
      steps.filter((step) => step.uses === "./.github/actions/setup"),
    ).toHaveLength(1);
    expect(
      steps.some((step) => /setup-node|action-setup/.test(step.uses ?? "")),
    ).toBe(false);
    if (name === "ci") {
      expect(
        steps
          .filter((step) => step.run?.startsWith("pnpm gates"))
          .map((step) => step.run),
      ).toEqual(["pnpm gates --affected", "pnpm gates"]);
      expect(steps.some((step) => step.run?.includes("--targets="))).toBe(
        false,
      );
    }
  }
});

it("deployment consumes CI artifacts without rebuilding or cancelling promotion", () => {
  const workflow = parse(
    readFileSync(".github/workflows/deploy.yml", "utf8"),
  ) as {
    on: Record<string, unknown>;
    concurrency: { "cancel-in-progress": boolean };
    jobs: Record<
      string,
      {
        if: string;
        steps: Array<{
          uses?: string;
          run?: string;
          with?: Record<string, unknown>;
        }>;
      }
    >;
  };
  expect(workflow.on["push"]).toBeUndefined();
  expect(workflow.on["workflow_run"]).toMatchObject({
    workflows: ["CI"],
    types: ["completed"],
    branches: ["main"],
  });
  expect(workflow.concurrency["cancel-in-progress"]).toBe(false);
  const job = workflow.jobs["deploy"]!;
  expect(job.if).toContain("workflow_run.conclusion == 'success'");
  const commands = job.steps.flatMap((step) => (step.run ? [step.run] : []));
  expect(commands).toEqual([
    "pnpm exec tsx tooling/release/select-ci-cli.ts",
    "pnpm exec tsx tooling/release/extract-cli.ts",
    "pnpm exec tsx tooling/release/deploy-cli.ts",
  ]);
  expect(
    job.steps.find((step) =>
      step.uses?.startsWith("actions/download-artifact@"),
    )?.with,
  ).toMatchObject({
    "artifact-ids": "${{ steps.release.outputs.artifact_id }}",
    "run-id": "${{ steps.release.outputs.run_id }}",
    "digest-mismatch": "error",
  });
});
