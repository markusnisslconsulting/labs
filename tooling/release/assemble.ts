import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
  rm,
  rename,
  lstat,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { routeSchema, manifestSchema } from "./schema.ts";
import { artifactContentIssues, isPublicArtifact } from "./artifact-policy.ts";
import {
  iframeEntry,
  managerEntry,
  qualifyStoryIndex,
  siteEntry,
} from "./entries.ts";

export function apacheRules(routes: string[], releasePath: string) {
  const names = routes
    .filter((route) => route !== "/")
    .map((route) => route.slice(1));
  return [
    "<IfModule pagespeed_module>",
    "  ModPagespeed off",
    "</IfModule>",
    "<IfModule mod_headers.c>",
    '  <FilesMatch "\\.html$">',
    '    Header always set Cache-Control "no-cache"',
    "  </FilesMatch>",
    "</IfModule>",
    "DirectorySlash Off",
    "ErrorDocument 404 default",
    '<If "%{REQUEST_URI} !~ m#^/(?:storybook|releases)(?:/|$)# && %{REQUEST_URI} !~ m#\\.[^/]+$#">',
    "  ErrorDocument 404 /404.html",
    "</If>",
    "RewriteEngine On",
    "RewriteRule (^|/)\\. - [R=404,END]",
    "RewriteRule ^storybook$ /storybook/ [R=308,END]",
    "RewriteRule ^storybook/$ storybook/index.html [END]",
    ...(names.length
      ? [
          `RewriteRule ^(${names.join("|")})/$ /$1 [R=308,END]`,
          `RewriteRule ^(${names.join("|")})$ ${releasePath}/pages/$1.html [END]`,
        ]
      : []),
    "RewriteRule ^$ index.html [END]",
    "RewriteCond %{REQUEST_FILENAME} !-f",
    "RewriteRule ^ - [R=404,END]",
    "",
  ].join("\n");
}
const omitted = new Set([
  ".htaccess",
  "catalog-routes.json",
  "project.json",
  "preview-stats.json",
]);
const extensions =
  /\.(?:html|js|mjs|css|json|xml|svg|png|jpe?g|webp|gif|ico|woff2?|txt|webmanifest)$/;
async function copyPublic(source: string, target: string, topLevel = true) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (topLevel && omitted.has(entry.name)) continue;
    if (entry.name.startsWith(".") || entry.isSymbolicLink())
      throw new Error(`Unexpected public artifact: ${entry.name}`);
    if (entry.isDirectory()) {
      await mkdir(join(target, entry.name), { recursive: true });
      await copyPublic(
        join(source, entry.name),
        join(target, entry.name),
        false,
      );
    } else {
      if (!entry.isFile())
        throw new Error(`Unexpected public artifact: ${entry.name}`);
      if (!extensions.test(entry.name))
        throw new Error(`Unexpected public file type: ${entry.name}`);
      await writeFile(
        join(target, entry.name),
        await readFile(join(source, entry.name)),
      );
    }
  }
}
export async function fileInventory(
  root: string,
  prefix = "",
): Promise<Record<string, { bytes: number; sha256: string }>> {
  if (!(await lstat(root)).isDirectory())
    throw new Error(
      "Release directory must be a real directory, not a symlink",
    );
  const files = new Map<string, { bytes: number; sha256: string }>();
  for (const entry of (await readdir(root, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name, "en"),
  )) {
    const key = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink in release: ${key}`);
    if (entry.isDirectory()) {
      const nested = await fileInventory(join(root, entry.name), key + "/");
      for (const [name, digest] of Object.entries(nested))
        files.set(name, digest);
    } else {
      if (!entry.isFile())
        throw new Error(`Non-regular file in release: ${key}`);
      const data = await readFile(join(root, entry.name));
      files.set(key, {
        bytes: data.length,
        sha256: createHash("sha256").update(data).digest("hex"),
      });
    }
  }
  return Object.fromEntries(files);
}
export async function assemble(options: {
  site: string;
  storybook: string;
  output: string;
  sourceSha: string;
  dirty: boolean;
}) {
  const { routes } = routeSchema.parse(
    JSON.parse(
      await readFile(join(options.site, "catalog-routes.json"), "utf8"),
    ),
  );
  const output = resolve(options.output);
  if (output === resolve(output, ".."))
    throw new Error("Release output must be separate from the filesystem root");
  for (const source of [resolve(options.site), resolve(options.storybook)]) {
    if (
      source.startsWith(output + "/") ||
      output.startsWith(source + "/") ||
      source === output
    )
      throw new Error("Release output must be separate from its build inputs");
  }
  for (const file of ["index.html", "iframe.html", "index.json"]) {
    await readFile(join(options.storybook, file));
  }
  for (const file of ["index.html", "404.html", "sitemap.xml", "robots.txt"]) {
    await readFile(join(options.site, file));
  }
  await mkdir(dirname(output), { recursive: true });
  const stage = await mkdtemp(output + ".tmp-");
  try {
    const publicRoot = join(stage, "public");
    await mkdir(join(publicRoot, "storybook"), { recursive: true });
    await copyPublic(options.site, publicRoot);
    await copyPublic(options.storybook, join(publicRoot, "storybook"));
    const buildDigest = createHash("sha256")
      .update(JSON.stringify(await fileInventory(publicRoot)))
      .digest("hex")
      .slice(0, 16);
    const releaseId = `${options.sourceSha}-${buildDigest}`;
    // Validate before using caller-supplied provenance in a path.
    if (!/^[a-f0-9]{40}-[a-f0-9]{16}$/.test(releaseId))
      throw new Error("Invalid release source commit");
    const releasePath = `releases/${releaseId}`;
    const immutable = join(stage, "immutable");
    await rename(publicRoot, immutable);
    await mkdir(join(publicRoot, "releases"), { recursive: true });
    const releaseRoot = join(publicRoot, releasePath);
    await rename(immutable, releaseRoot);
    const prefix = `/${releasePath}`;
    await qualifyStoryIndex(
      join(releaseRoot, "storybook"),
      `${prefix}/storybook`,
    );
    await mkdir(join(publicRoot, "storybook"));
    await writeFile(
      join(publicRoot, "storybook/index.html"),
      managerEntry(
        await readFile(join(releaseRoot, "storybook/index.html"), "utf8"),
        `${prefix}/storybook`,
      ),
    );
    await writeFile(
      join(publicRoot, "storybook/iframe.html"),
      iframeEntry(`${prefix}/storybook`),
    );
    // Existing public schema and identity URLs are part of the published contract.
    for (const path of [
      "favicon.svg",
      "logo.webp",
      "catalogs/ticket-ui.json",
      "storybook/index.json",
      "sitemap.xml",
      "robots.txt",
    ]) {
      const source = join(releaseRoot, path);
      const exists = await lstat(source).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT") return undefined;
          throw error;
        },
      );
      if (exists) {
        await mkdir(dirname(join(publicRoot, path)), { recursive: true });
        await writeFile(join(publicRoot, path), await readFile(source));
      }
    }
    for (const path of [
      "index.html",
      "404.html",
      ...routes
        .filter((route) => route !== "/")
        .map((route) => `pages/${route.slice(1)}.html`),
    ]) {
      const html = siteEntry(
        await readFile(join(releaseRoot, path), "utf8"),
        prefix,
      );
      await writeFile(join(releaseRoot, path), html);
      if (!path.startsWith("pages/"))
        await writeFile(join(publicRoot, path), html);
    }
    await writeFile(
      join(publicRoot, ".htaccess"),
      apacheRules(routes, releasePath),
    );
    const manifest = {
      version: 2,
      releaseId,
      sourceSha: options.sourceSha,
      dirty: options.dirty,
      routes,
      files: await fileInventory(publicRoot),
    };
    await writeFile(
      join(stage, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    await verifyRelease(stage);
    await rm(output, { recursive: true, force: true });
    await rename(stage, output);
    return manifest;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

export async function verifyRelease(directory: string, expectedSha?: string) {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")),
  );
  if (expectedSha && (manifest.sourceSha !== expectedSha || manifest.dirty))
    throw new Error("Release does not match a clean expected commit");
  if (!manifest.releaseId.startsWith(manifest.sourceSha + "-"))
    throw new Error("Release identifier does not match its source commit");
  const actual = await fileInventory(join(directory, "public"));
  const paths = new Set([
    ...Object.keys(actual),
    ...Object.keys(manifest.files),
  ]);
  for (const path of paths) {
    if (!isPublicArtifact(path, manifest.routes))
      throw new Error(`Unexpected release path: ${JSON.stringify(path)}`);
    if (
      path.startsWith("releases/") &&
      !path.startsWith(`releases/${manifest.releaseId}/`)
    )
      throw new Error(
        "Release contains files from a different release identifier",
      );
    if (
      actual[path]?.sha256 !== manifest.files[path]?.sha256 ||
      actual[path]?.bytes !== manifest.files[path]?.bytes
    )
      throw new Error(`Release file mismatch: ${path}`);
    const issues = await artifactContentIssues(
      path,
      await readFile(join(directory, "public", path)),
    );
    if (issues.length)
      throw new Error(
        `Release content rejected: ${JSON.stringify(path)} (${issues.join(", ")})`,
      );
  }
  return manifest;
}
