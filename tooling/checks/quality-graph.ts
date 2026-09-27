/** Check maintained source ownership and collect tests through their real runners. */
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProjectGraphAsync } from "@nx/devkit";
import { ESLint } from "eslint";
import ts from "typescript";
import { z } from "zod";

interface Coverage {
  project: string;
  root: string;
  ownedFiles: string[];
  typed: Set<string>;
  lintRoots: string[];
}
const inside = (file: string, root: string) =>
  file === root || file.startsWith(`${root}/`);
const testFile = (file: string) =>
  /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(file) ||
  /\.stories\.[jt]sx?$/.test(file);

export function coverageIssues(
  files: string[],
  projects: Coverage[],
  discovered: Set<string>,
): string[] {
  const issues: string[] = [];
  for (const file of files) {
    const owner = projects.find(
      (project) =>
        inside(file, project.root) || project.ownedFiles.includes(file),
    );
    if (!owner) {
      issues.push(`${file}: no owning project`);
      continue;
    }
    if (!owner.lintRoots.some((root) => inside(file, root)))
      issues.push(`${file}: omitted from ${owner.project}:lint`);
    if (/\.[cm]?tsx?$/.test(file) && !owner.typed.has(file))
      issues.push(`${file}: omitted from ${owner.project}:typecheck`);
    if (testFile(file) && !discovered.has(file))
      issues.push(`${file}: not collected by a configured test runner`);
  }
  return issues;
}

interface Commands {
  command?: string;
  commands?: (string | { command: string })[];
  cwd?: string;
}
const commands = (options: Commands) => [
  ...(options.command ? [options.command] : []),
  ...(options.commands ?? []).map((entry) =>
    typeof entry === "string" ? entry : entry.command,
  ),
];
const unitFiles = z.array(z.object({ file: z.string() }));
interface BrowserSuite {
  file: string;
  suites: BrowserSuite[];
}
const browserSuite: z.ZodType<BrowserSuite> = z.lazy(() =>
  z.object({
    file: z.string(),
    suites: z.array(browserSuite).default([]),
  }),
);
const browserFiles = z.object({
  config: z.object({ rootDir: z.string() }),
  suites: z.array(browserSuite),
  errors: z.array(z.unknown()).default([]),
});

export function maintainedFiles(root: string): string[] {
  return [
    ...new Set(
      execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { encoding: "utf8", cwd: root },
      )
        .split("\0")
        .filter((file) => file && existsSync(resolve(root, file))),
    ),
  ];
}

export async function checkQualityGraph() {
  const root = process.cwd();
  const graph = await createProjectGraphAsync();
  const files = maintainedFiles(root);
  const forbidden = files.filter((file) => /(?:^|\/)claude\.md$/i.test(file));
  const source = files.filter((file) => /\.[cm]?[jt]sx?$/.test(file));
  const coverage: Coverage[] = [];
  const discovered = new Set<string>();
  const runners = new Map<
    string,
    { args: string[]; cwd: string; kind: "unit" | "browser" }
  >();
  const issues: string[] = forbidden.map(
    (file) => `${file}: AGENTS.md is the sole instruction file`,
  );
  const path = (file: string) => relative(root, resolve(file));

  for (const project of Object.values(graph.nodes)) {
    const targets = project.data.targets ?? {};
    const metadata = project.data.metadata as
      | {
          ownedFiles?: string[];
          testPolicy?: { kind: string; targets: string[] };
        }
      | undefined;
    for (const name of ["lint", "typecheck"])
      if (!targets[name])
        issues.push(`${project.name}: missing ${name} target`);
    if (!targets.test && !metadata?.testPolicy)
      issues.push(`${project.name}: no test target or integration policy`);
    for (const reference of metadata?.testPolicy?.targets ?? []) {
      const [name, target] = reference.split(":");
      if (!name || !target || !graph.nodes[name]?.data.targets?.[target])
        issues.push(`${project.name}: unknown test policy target ${reference}`);
    }
    const typed = new Set<string>();
    for (const command of commands(
      (targets.typecheck?.options ?? {}) as Commands,
    )) {
      for (const match of command.matchAll(/(?:-p|--project)\s+([^\s]+)/g)) {
        const file = resolve(match[1]!);
        const config = ts.readConfigFile(file, ts.sys.readFile);
        if (config.error)
          throw new Error(
            ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
          );
        const parsed = ts.parseJsonConfigFileContent(
          config.config,
          ts.sys,
          resolve(file, ".."),
        );
        if (parsed.errors.length)
          throw new Error(
            ts.formatDiagnostics(parsed.errors, {
              getCurrentDirectory: () => root,
              getCanonicalFileName: (name) => name,
              getNewLine: () => "\n",
            }),
          );
        parsed.fileNames.forEach((file) => typed.add(path(file)));
      }
    }
    const lintRoots = commands(
      (targets.lint?.options ?? {}) as Commands,
    ).flatMap((command) => {
      const args = /(?:^|\s)eslint\s+(.+?)(?:\s+--|$)/.exec(command)?.[1] ?? "";
      return args.split(/\s+/).filter(Boolean).map(path);
    });
    coverage.push({
      project: project.name,
      root: project.data.root,
      ownedFiles: metadata?.ownedFiles ?? [],
      typed,
      lintRoots,
    });

    for (const target of Object.values(targets)) {
      const options = (target.options ?? {}) as Commands;
      const cwd = resolve(
        (options.cwd ?? root).replace("{workspaceRoot}", root),
      );
      for (const command of commands(options)) {
        const unit = /(?:^|\s)vitest run\s+([^&"]+)/.exec(command);
        if (unit) {
          const args = [
            "exec",
            "vitest",
            "list",
            ...unit[1]!.trim().split(/\s+/),
            "--filesOnly",
            "--json",
          ];
          runners.set(`${cwd}:${args.join(" ")}`, { args, cwd, kind: "unit" });
        }
        const browser = /playwright test --config ([^\s"]+)/.exec(command);
        if (browser) {
          const args = [
            "exec",
            "playwright",
            "test",
            "--config",
            browser[1]!,
            "--list",
            "--reporter",
            "json",
          ];
          runners.set(`${cwd}:${args.join(" ")}`, {
            args,
            cwd,
            kind: "browser",
          });
        }
      }
    }
  }
  for (const runner of runners.values()) {
    const raw: unknown = JSON.parse(
      execFileSync("pnpm", runner.args, {
        cwd: runner.cwd,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        env: { ...process.env, FORCE_COLOR: "0" },
      }),
    );
    if (runner.kind === "unit")
      unitFiles
        .parse(raw)
        .forEach(({ file }) => discovered.add(path(resolve(runner.cwd, file))));
    else {
      const report = browserFiles.parse(raw);
      if (report.errors.length)
        throw new Error(
          `Browser discovery failed: ${JSON.stringify(report.errors)}`,
        );
      const collect = (suites: BrowserSuite[]) =>
        suites.forEach((suite) => {
          discovered.add(path(resolve(report.config.rootDir, suite.file)));
          collect(suite.suites);
        });
      collect(report.suites);
    }
  }
  issues.push(...coverageIssues(source, coverage, discovered));
  const eslint = new ESLint();
  for (const file of source)
    if (await eslint.isPathIgnored(file))
      issues.push(`${file}: ignored by ESLint`);
  if (issues.length) throw new Error(issues.join("\n"));
  console.log(
    `Quality graph: ${source.length} source files owned and covered by lint/typecheck targets where applicable; ${discovered.size} test/story files collected by ${runners.size} runner configurations. Collection is not execution.`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await checkQualityGraph();
