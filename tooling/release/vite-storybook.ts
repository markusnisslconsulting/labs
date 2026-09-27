import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { staticHandler } from "./http.ts";

export function storybookMount(directory: string): Plugin {
  return {
    name: "labs-storybook-mount",
    configureServer(server) {
      if (!existsSync(resolve(directory, "index.html")))
        throw new Error(
          "Build Storybook first: pnpm nx run ui:build-storybook",
        );
      const serve = staticHandler(directory);
      server.middlewares.use((request, response, next) => {
        if (
          request.url === "/storybook" ||
          request.url?.startsWith("/storybook?")
        ) {
          response.writeHead(308, {
            Location: request.url.replace("/storybook", "/storybook/"),
          });
          response.end();
          return;
        }
        if (!request.url?.startsWith("/storybook/")) {
          next();
          return;
        }
        request.url = request.url.slice("/storybook".length);
        void serve(request, response);
      });
    },
  };
}
