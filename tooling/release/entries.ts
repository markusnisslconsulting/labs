import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Qualify build-owned URLs without changing document or fragment navigation. */
export function siteEntry(html: string, prefix: string): string {
  return html.replace(
    /((?:src|href)=(["']))\.\/(?=assets\/|(?:favicon\.svg|logo\.webp)(?:["'?#]))/g,
    `$1${prefix}/`,
  );
}

export function managerEntry(html: string, prefix: string): string {
  if (!html.includes("<head>") || /<base\b|PREVIEW_URL/.test(html))
    throw new Error("Unsupported Storybook manager entry format");
  // These are build-generated resource URLs, including inline module imports.
  return html
    .replace(
      /(["'])\.\/(sb-[\w/-]+\.[\w]+|favicon(?:-wrapper)?\.svg)/g,
      `$1${prefix}/$2`,
    )
    .replace(
      "<head>",
      `<head><script>window.PREVIEW_URL=${JSON.stringify(`${prefix}/iframe.html`)}</script>`,
    );
}

export function iframeEntry(prefix: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><script>location.replace(${JSON.stringify(`${prefix}/iframe.html`)}+location.search+location.hash)</script></head><body></body></html>\n`;
}

export async function qualifyStoryIndex(storybook: string, prefix: string) {
  const file = join(storybook, "sb-manager/globals-runtime.js");
  const runtime = await readFile(file, "utf8");
  const assignment = 'STORY_INDEX_PATH = "./index.json"';
  if (runtime.split(assignment).length !== 2)
    throw new Error("Unsupported Storybook story-index assignment");
  await writeFile(
    file,
    runtime.replace(
      assignment,
      `STORY_INDEX_PATH = ${JSON.stringify(`${prefix}/index.json`)}`,
    ),
  );
}
