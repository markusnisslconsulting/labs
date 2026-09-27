import { fileURLToPath } from "node:url";
import { loadCatalog } from "./catalog.ts";
import { loadWorkbench } from "./workbench";

const { entries } = loadCatalog({
  storybookIndex: fileURLToPath(
    new URL("../../../dist/packages/ui-storybook/index.json", import.meta.url),
  ),
});
const references = loadWorkbench();
console.log(
  `Catalog: ${entries.length} entries, ${references.components.length} component references and ${references.foundations.length} foundations/guides; destinations are valid.`,
);
