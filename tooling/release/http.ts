import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};
function respond(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  body: string | Buffer,
  type = "text/plain; charset=utf-8",
) {
  response.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(request.method === "HEAD" ? undefined : body);
}

/** Explicit document routes and exact static files, with no asset-to-SPA fallback. */
export function staticHandler(
  root: string,
  documents: Record<string, string> = {},
) {
  const directory = resolve(root);
  const routes = Object.keys(documents);
  return async (request: IncomingMessage, response: ServerResponse) => {
    if (!["GET", "HEAD"].includes(request.method ?? "")) {
      response.setHeader("Allow", "GET, HEAD");
      respond(request, response, 405, "Method not allowed");
      return;
    }
    let path: string;
    const [rawPath = "/", query] = (request.url ?? "/").split("?");
    try {
      path = decodeURIComponent(rawPath);
    } catch {
      respond(request, response, 400, "Invalid path");
      return;
    }
    if (
      !path.startsWith("/") ||
      path.includes("\\") ||
      path.includes("\0") ||
      path.split("/").some((part) => part.startsWith("."))
    ) {
      respond(request, response, 404, "Not found");
      return;
    }
    const redirect =
      path === "/storybook"
        ? "/storybook/"
        : path !== "/" &&
            path.endsWith("/") &&
            routes.includes(path.slice(0, -1))
          ? path.slice(0, -1)
          : undefined;
    if (redirect) {
      response.writeHead(308, {
        Location: redirect + (query === undefined ? "" : `?${query}`),
        "Cache-Control": "no-store",
      });
      response.end();
      return;
    }
    let status = 200;
    let target = routes.includes(path)
      ? documents[path]!
      : path === "/storybook/"
        ? "storybook/index.html"
        : path.slice(1);
    try {
      let file = resolve(directory, target || "index.html");
      let found = await stat(file)
        .then((entry) => entry.isFile())
        .catch(() => false);
      if (
        !found &&
        routes.length &&
        !path.startsWith("/storybook/") &&
        path !== "/releases" &&
        !path.startsWith("/releases/") &&
        !extname(path) &&
        request.headers.accept?.includes("text/html")
      ) {
        target = "404.html";
        file = resolve(directory, target);
        status = 404;
        found = await stat(file)
          .then((entry) => entry.isFile())
          .catch(() => false);
      }
      if (
        !found ||
        !(await realpath(file)).startsWith((await realpath(directory)) + sep)
      ) {
        respond(request, response, 404, "Not found");
        return;
      }
      const type = types[extname(file)];
      if (!type) {
        respond(request, response, 404, "Not found");
        return;
      }
      respond(request, response, status, await readFile(file), type);
    } catch {
      respond(request, response, 500, "Unable to serve the preview");
    }
  };
}
