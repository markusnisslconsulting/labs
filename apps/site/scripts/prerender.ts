import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadCatalog } from "./catalog";
import { siteOrigin } from "../src/catalog/metadata";
import { publicRoutes } from "../src/catalog/directories";

const output = resolve("apps/site/dist");
const { render } = (await import(
  pathToFileURL(resolve("apps/site/.out/prerender/prerender-entry.js")).href
)) as typeof import("./prerender-entry");
const routes = publicRoutes(loadCatalog().entries);
const template = await readFile(join(output, "index.html"), "utf8");
if (
  !template.includes("<!--app-head-->") ||
  !template.includes("<!--app-html-->")
)
  throw new Error("Missing prerender placeholders");
await mkdir(join(output, "pages"), { recursive: true });
for (const path of [...routes, "/404"]) {
  const { head, body } = render(path);
  const name =
    path === "/"
      ? "index.html"
      : path === "/404"
        ? "404.html"
        : `pages/${path.slice(1)}.html`;
  await writeFile(
    join(output, name),
    template
      .replace("<!--app-head-->", () => head)
      .replace("<!--app-html-->", () => body),
  );
}
await writeFile(
  join(output, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>${siteOrigin}${path}</loc></url>`).join("")}</urlset>\n`,
);
await writeFile(
  join(output, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`,
);
console.log(
  `Prerendered ${routes.length} public routes and the missing-page document.`,
);
