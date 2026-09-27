import { createServer } from "node:http";
import { resolve } from "node:path";
import { verifyRelease } from "./assemble.ts";
import { staticHandler } from "./http.ts";
import { routeDocuments } from "./schema.ts";
const directory = resolve("dist/release");
const manifest = await verifyRelease(directory);
const port = Number(process.env["PORT"] ?? "4620");
const server = createServer(
  staticHandler(
    resolve(directory, "public"),
    routeDocuments(manifest.routes, manifest.releaseId),
  ),
);
server.listen(port, "127.0.0.1", () =>
  console.log(`Release preview: http://127.0.0.1:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => server.close());
