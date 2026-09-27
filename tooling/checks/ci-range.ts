import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { z } from "zod";

export interface Comparison {
  mode: "affected" | "all";
  base: string | null;
  head: string;
  worktree: boolean;
  reason: string;
}

const push = z.object({
  before: z.string(),
  after: z.string(),
  forced: z.boolean().default(false),
});
const pullRequest = z.object({
  pull_request: z.object({ base: z.object({ sha: z.string() }) }),
});
const dispatch = z.object({ inputs: z.object({ base: z.string().min(1) }) });

export function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function commit(root: string, ref: string): string | null {
  try {
    return git(
      root,
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${ref}^{commit}`,
    );
  } catch {
    return null;
  }
}

function mergeBase(root: string, base: string, head: string): string | null {
  try {
    return git(root, "merge-base", base, head);
  } catch {
    return null;
  }
}

function emptyTree(root: string): string {
  return execFileSync("git", ["hash-object", "-w", "-t", "tree", "--stdin"], {
    cwd: root,
    input: "",
    encoding: "utf8",
  }).trim();
}

export function resolveComparison(
  root: string,
  options: {
    eventName?: string;
    event?: unknown;
    expectedHead?: string;
    base?: string;
  } = {},
): Comparison {
  const head = git(root, "rev-parse", "HEAD");
  if (options.expectedHead && options.expectedHead !== head)
    throw new Error("Checked-out HEAD does not match the workflow SHA");
  const result = (
    mode: Comparison["mode"],
    base: string | null,
    reason: string,
  ): Comparison => ({
    mode,
    base,
    head,
    worktree: !options.eventName,
    reason,
  });
  if (options.eventName === "push") {
    const event = push.parse(options.event);
    if (event.after !== head)
      throw new Error("Push after-SHA does not match checked-out HEAD");
    if (/^0{40}$/.test(event.before))
      return result(
        "all",
        emptyTree(root),
        "New ref: check the whole workspace",
      );
    const base = commit(root, event.before);
    if (!base)
      return result(
        "all",
        null,
        "Push before-SHA is unavailable; fetch it before checking the changelog",
      );
    if (event.forced || mergeBase(root, base, head) !== base)
      return result(
        "all",
        base,
        "Rewritten history: check all projects and compare the before/after trees",
      );
    return result("affected", base, "Compare every commit in the push");
  }
  if (options.eventName === "pull_request") {
    const event = pullRequest.parse(options.event);
    const base = commit(root, event.pull_request.base.sha);
    const ancestor = base && mergeBase(root, base, head);
    return result(
      ancestor ? "affected" : "all",
      ancestor,
      ancestor
        ? "Compare the tested merge with its base"
        : "Pull request history is unavailable; fetch it before checking the changelog",
    );
  }
  if (options.eventName === "workflow_dispatch") {
    const event = dispatch.parse(options.event);
    return result(
      "all",
      commit(root, event.inputs.base),
      "Manual run: all projects, with an explicit changelog base",
    );
  }
  if (options.eventName)
    throw new Error(`Unsupported verification event: ${options.eventName}`);
  if (options.base) {
    const base = commit(root, options.base);
    return result(
      "all",
      base && mergeBase(root, base, head),
      "Local run with an explicit base",
    );
  }
  const main = commit(root, "main");
  const ancestor = main && mergeBase(root, main, head);
  if (ancestor && ancestor !== head)
    return result("all", ancestor, "Local branch changes since main");
  const parent = commit(root, "HEAD^");
  // A shallow checkout is not an initial commit.
  const base =
    parent ??
    (git(root, "rev-parse", "--is-shallow-repository") === "false"
      ? emptyTree(root)
      : null);
  return result(
    "all",
    base,
    "Local main checkout: latest commit and working-tree changes",
  );
}

export function comparisonFromEnvironment(
  root: string,
  env = process.env,
): Comparison {
  if (!env.GITHUB_ACTIONS)
    return resolveComparison(root, { base: env.NX_BASE });
  if (!env.GITHUB_EVENT_NAME || !env.GITHUB_EVENT_PATH || !env.GITHUB_SHA)
    throw new Error("Workflow event name, payload and SHA are required");
  return resolveComparison(root, {
    eventName: env.GITHUB_EVENT_NAME,
    event: JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8")),
    expectedHead: env.GITHUB_SHA,
  });
}

export function changedFiles(root: string, comparison: Comparison): string[] {
  if (!comparison.base)
    throw new Error(
      "Cannot verify the changelog without a comparison base. Fetch the missing history or provide an explicit base.",
    );
  const files = git(
    root,
    "diff",
    "--name-only",
    "--no-renames",
    "-z",
    comparison.base,
    ...(comparison.worktree ? [] : [comparison.head]),
    "--",
  )
    .split("\0")
    .filter(Boolean);
  if (comparison.worktree)
    files.push(
      ...git(root, "ls-files", "--others", "--exclude-standard", "-z")
        .split("\0")
        .filter(Boolean),
    );
  return [...new Set(files)];
}
