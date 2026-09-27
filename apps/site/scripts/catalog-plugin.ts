import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { loadCatalog } from "./catalog.ts";
import { publicRoutes } from "../src/catalog/directories";

export function catalogValidation(): Plugin {
  let building = false;
  const validate = () =>
    loadCatalog(
      building
        ? {
            storybookIndex: fileURLToPath(
              new URL(
                "../../../dist/packages/ui-storybook/index.json",
                import.meta.url,
              ),
            ),
          }
        : {},
    );
  return {
    name: "labs-catalog-validation",
    configResolved(config) {
      building = config.command === "build";
    },
    buildStart() {
      for (const file of validate().files) this.addWatchFile(file);
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "catalog-routes.json",
        source: JSON.stringify({
          routes: publicRoutes(validate().entries),
        }),
      });
    },
    transform(_code, id) {
      if (id.endsWith("/lab.json")) validate();
    },
    handleHotUpdate(context) {
      if (/\/(?:lab\.json|LabDemo\.tsx)$/.test(context.file)) validate();
    },
  };
}
