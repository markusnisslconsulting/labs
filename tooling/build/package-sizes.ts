import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import ts from "typescript";

export interface Size {
  js: number;
  css: number;
  total: number;
}

/** Sum separately gzipped package files, following static relative imports once. */
export function importedSize(entry: string): Size {
  const seen = new Set<string>();
  const pending = [resolve(entry)];
  let js = 0;
  let css = 0;
  while (pending.length) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    // Missing imports are an incomplete build, not a zero-byte dependency.
    const bytes = readFileSync(file);
    const source = bytes.toString("utf8");
    const stylesheet = file.endsWith(".css");
    if (stylesheet) css += gzipSync(bytes).length;
    else js += gzipSync(bytes).length;
    const imports = stylesheet
      ? [
          ...source
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .matchAll(/@import\s*(?:url\()?\s*["']([^"']+)["']/g),
        ].map((hit) => hit[1]!)
      : ts
          .createSourceFile(
            file,
            source,
            ts.ScriptTarget.Latest,
            false,
            ts.ScriptKind.JS,
          )
          .statements.flatMap((statement) => {
            if (
              !ts.isImportDeclaration(statement) &&
              !ts.isExportDeclaration(statement)
            )
              return [];
            const specifier = statement.moduleSpecifier;
            return specifier && ts.isStringLiteral(specifier)
              ? [specifier.text]
              : [];
          });
    for (const specifier of imports) {
      if (specifier.startsWith("."))
        pending.push(resolve(dirname(file), specifier));
    }
  }
  return { js, css, total: js + css };
}

export function measureComponents(directory: string): Record<string, Size> {
  const folder = join(directory, "components");
  return Object.fromEntries(
    readdirSync(folder)
      .filter((name) => name.endsWith(".js"))
      .sort()
      .map((file) => [file.slice(0, -3), importedSize(join(folder, file))]),
  );
}
